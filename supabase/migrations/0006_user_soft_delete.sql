-- =====================================================================
-- 光羽小说 — Phase 4d: user soft-delete + admin user filtering
--
-- Hard-deleting auth.users requires the service role / admin API, which we
-- intentionally avoid. Instead users are soft-deleted via profiles.deleted_at
-- (reversible). The admin middleware blocks users with deleted_at set.
-- =====================================================================

alter table public.profiles
  add column if not exists deleted_at     timestamptz,
  add column if not exists deleted_by     uuid references auth.users(id) on delete set null,
  add column if not exists deleted_reason text;

create index if not exists profiles_deleted_at_idx on public.profiles(deleted_at);

-- Rebuild the superadmin-only listing function to expose deletion state and
-- support a status filter. Default (null/empty status) hides deleted users.
drop function if exists public.admin_list_users(text, public.user_role, int, int);
drop function if exists public.admin_list_users(text, public.user_role, text, int, int);

create or replace function public.admin_list_users(
  p_search text default null,
  p_role public.user_role default null,
  p_status text default null,  -- 'active' | 'suspended' | 'deleted' | 'all' | null(=non-deleted)
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid,
  email text,
  role public.user_role,
  display_name text,
  suspended boolean,
  deleted_at timestamptz,
  created_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
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
           p.deleted_at,
           p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    where (p_role is null or p.role = p_role)
      and (
        case
          when p_status = 'deleted'   then p.deleted_at is not null
          when p_status = 'active'    then p.deleted_at is null and p.suspended = false
          when p_status = 'suspended' then p.deleted_at is null and p.suspended = true
          when p_status = 'all'       then true
          else p.deleted_at is null  -- default: hide soft-deleted users
        end
      )
      and (
        p_search is null or p_search = ''
        or u.email ilike '%' || p_search || '%'
        or coalesce(p.display_name, '') ilike '%' || p_search || '%'
      )
  )
  select f.id, f.email, f.role, f.display_name, f.suspended, f.deleted_at, f.created_at,
         count(*) over () as total_count
  from filtered f
  order by f.created_at desc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
end;
$$;

revoke all on function public.admin_list_users(text, public.user_role, text, int, int) from public;
grant execute on function public.admin_list_users(text, public.user_role, text, int, int) to authenticated;
