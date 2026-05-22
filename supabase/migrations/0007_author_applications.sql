-- =====================================================================
-- 光羽小说 — Phase 4e: self-service author application workflow
--
--   * author_applications — a reader applies to become an author; admins
--     review (approve / reject / request revision).
--   * authors gains status + avatar_url (author_profiles parity).
--   * Reviews + role promotion run through a security-definer function so
--     that ADMINS (not just superadmins) can approve without broad table
--     grants. Promotion never downgrades admin/superadmin and never
--     approves a suspended/soft-deleted user.
-- =====================================================================

-- 1. authors: status + avatar_url
alter table public.authors
  add column if not exists status     text not null default 'active', -- 'active' | 'suspended'
  add column if not exists avatar_url text;

-- 2. author_applications
create table if not exists public.author_applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  pen_name      text not null,
  bio           text,
  genre         text,
  contact_email text,
  contact_phone text,
  social_link   text,
  sample_text   text,
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected', 'revision_requested')),
  admin_note    text,
  reviewed_by   uuid references auth.users(id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists author_applications_user_idx   on public.author_applications(user_id);
create index if not exists author_applications_status_idx on public.author_applications(status);
-- At most one pending application per user.
create unique index if not exists author_applications_one_pending
  on public.author_applications(user_id) where status = 'pending';

drop trigger if exists author_applications_set_updated_at on public.author_applications;
create trigger author_applications_set_updated_at
  before update on public.author_applications
  for each row execute function public.set_updated_at();

alter table public.author_applications enable row level security;

drop policy if exists "author_applications: owner select" on public.author_applications;
drop policy if exists "author_applications: owner insert" on public.author_applications;
drop policy if exists "author_applications: owner update" on public.author_applications;
drop policy if exists "author_applications: admin select" on public.author_applications;

create policy "author_applications: owner select"
  on public.author_applications for select
  using (user_id = auth.uid());

create policy "author_applications: owner insert"
  on public.author_applications for insert
  with check (user_id = auth.uid());

-- Owners may edit/resubmit only while not yet approved.
create policy "author_applications: owner update"
  on public.author_applications for update
  using (user_id = auth.uid() and status in ('pending', 'revision_requested', 'rejected'))
  with check (user_id = auth.uid());

create policy "author_applications: admin select"
  on public.author_applications for select
  using (public.is_admin_or_higher());

-- 3. Admin listing (joins auth.users email, which is not directly readable).
create or replace function public.admin_list_author_applications(
  p_search text default null,
  p_status text default null,
  p_limit int default 50,
  p_offset int default 0
)
returns table (
  id uuid,
  user_id uuid,
  email text,
  pen_name text,
  bio text,
  genre text,
  contact_email text,
  contact_phone text,
  social_link text,
  sample_text text,
  status text,
  admin_note text,
  reviewer_email text,
  reviewed_at timestamptz,
  applicant_role public.user_role,
  created_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin_or_higher() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with filtered as (
    select a.id, a.user_id, u.email::text as email, a.pen_name, a.bio, a.genre,
           a.contact_email, a.contact_phone, a.social_link, a.sample_text,
           a.status, a.admin_note, ru.email::text as reviewer_email, a.reviewed_at,
           p.role as applicant_role, a.created_at
    from public.author_applications a
    join auth.users u on u.id = a.user_id
    left join auth.users ru on ru.id = a.reviewed_by
    left join public.profiles p on p.id = a.user_id
    where (p_status is null or p_status = '' or a.status = p_status)
      and (
        p_search is null or p_search = ''
        or u.email ilike '%' || p_search || '%'
        or a.pen_name ilike '%' || p_search || '%'
        or coalesce(a.genre, '') ilike '%' || p_search || '%'
      )
  )
  select f.id, f.user_id, f.email, f.pen_name, f.bio, f.genre, f.contact_email,
         f.contact_phone, f.social_link, f.sample_text, f.status, f.admin_note,
         f.reviewer_email, f.reviewed_at, f.applicant_role, f.created_at,
         count(*) over () as total_count
  from filtered f
  order by case when f.status = 'pending' then 0 else 1 end, f.created_at desc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
end;
$$;

revoke all on function public.admin_list_author_applications(text, text, int, int) from public;
grant execute on function public.admin_list_author_applications(text, text, int, int) to authenticated;

-- 4. Review + (on approval) atomic role promotion + author profile creation.
create or replace function public.review_author_application(
  p_app_id uuid,
  p_status text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_app public.author_applications%rowtype;
  v_profile public.profiles%rowtype;
begin
  if not public.is_admin_or_higher() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_status not in ('approved', 'rejected', 'revision_requested') then
    raise exception 'invalid status %', p_status using errcode = '22023';
  end if;

  select * into v_app from public.author_applications where id = p_app_id for update;
  if not found then
    raise exception 'application not found' using errcode = 'P0002';
  end if;

  if p_status = 'approved' then
    select * into v_profile from public.profiles where id = v_app.user_id;
    if v_profile.deleted_at is not null or v_profile.suspended then
      raise exception 'cannot approve a suspended or deleted user' using errcode = '42501';
    end if;

    -- Create/refresh the author profile.
    insert into public.authors (profile_id, pen_name, bio, status)
    values (v_app.user_id, v_app.pen_name, v_app.bio, 'active')
    on conflict (profile_id)
    do update set pen_name = excluded.pen_name, bio = excluded.bio, status = 'active';

    -- Promote reader -> author only (never downgrade admin/superadmin).
    update public.profiles set role = 'author'
    where id = v_app.user_id and role = 'reader';
  end if;

  update public.author_applications
  set status = p_status, admin_note = p_note, reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_app_id;
end;
$$;

revoke all on function public.review_author_application(uuid, text, text) from public;
grant execute on function public.review_author_application(uuid, text, text) to authenticated;
