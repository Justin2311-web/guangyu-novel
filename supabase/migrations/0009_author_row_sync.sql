-- =====================================================================
-- 光羽小说 — Fix: guarantee an authors row for every author-role profile
--
-- Root cause: a user could reach role='author' without an authors row
-- (e.g. promoted via the admin Users role dropdown, which only updated
-- profiles.role). The author portal then showed "未找到作者资料".
--
-- This makes the database the single source of truth: a SECURITY DEFINER
-- trigger creates the authors row whenever a profile becomes 'author',
-- regardless of which code path set the role. Plus a one-time backfill for
-- existing orphans. Idempotent and safe to re-run.
-- =====================================================================

-- 1. One-time backfill: create authors rows for orphaned author profiles.
insert into public.authors (profile_id, pen_name, status)
select p.id, coalesce(nullif(btrim(p.display_name), ''), '新作者'), 'active'
from public.profiles p
left join public.authors a on a.profile_id = p.id
where p.role = 'author' and a.id is null;

-- 2. Trigger to keep it consistent going forward.
create or replace function public.ensure_author_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'author' then
    insert into public.authors (profile_id, pen_name, status)
    values (new.id, coalesce(nullif(btrim(new.display_name), ''), '新作者'), 'active')
    on conflict (profile_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_ensure_author_row on public.profiles;
create trigger profiles_ensure_author_row
  after insert or update of role on public.profiles
  for each row
  execute function public.ensure_author_row();
