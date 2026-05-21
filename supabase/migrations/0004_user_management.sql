-- =====================================================================
-- 光羽小说 — Phase 3e: superadmin user management
--
--   * profiles.suspended — app-level suspension flag (enforced in the
--     admin middleware). NOTE: this does not revoke existing auth tokens;
--     full token-level banning would require the service role / admin API.
--   * admin_list_users() — security-definer, superadmin-only paginated
--     search that exposes auth.users.email (which the anon/authenticated
--     client cannot read directly) joined with profile metadata.
-- =====================================================================

alter table public.profiles
  add column if not exists suspended boolean not null default false;

create or replace function public.admin_list_users(
  p_search text default null,
  p_role public.user_role default null,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid,
  email text,
  role public.user_role,
  display_name text,
  suspended boolean,
  created_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  -- Hard guard: only superadmins may enumerate users / read emails.
  if not public.is_superadmin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with filtered as (
    select p.id,
           u.email::text as email,
           p.role,
           p.display_name,
           p.suspended,
           p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    where (p_role is null or p.role = p_role)
      and (
        p_search is null or p_search = ''
        or u.email ilike '%' || p_search || '%'
        or coalesce(p.display_name, '') ilike '%' || p_search || '%'
      )
  )
  select f.id, f.email, f.role, f.display_name, f.suspended, f.created_at,
         count(*) over () as total_count
  from filtered f
  order by f.created_at desc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
end;
$$;

revoke all on function public.admin_list_users(text, public.user_role, int, int) from public;
grant execute on function public.admin_list_users(text, public.user_role, int, int) to authenticated;
