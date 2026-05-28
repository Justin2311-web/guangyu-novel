-- =====================================================================
-- 光羽小说 — Phase 6u: comment reports
--
--   New table public.comment_reports with its own RLS. Strictly additive:
--   no existing table / column / policy / function is modified. Safe to
--   re-run (every CREATE uses IF NOT EXISTS; every policy is dropped
--   and re-created).
--
--   Design notes:
--     * Reports are scoped to a comment_id; the parent novel can be
--       derived via the join `comment_reports.comment_id -> comments.novel_id`.
--     * `reason` uses a CHECK constraint rather than a Postgres enum to
--       keep additions cheap.
--     * `status` lives on the report row (open / resolved / dismissed).
--     * To prevent spammy duplicates, a partial unique index allows only
--       one OPEN report per (comment_id, reporter_id). Once resolved or
--       dismissed, the same user may re-report.
-- =====================================================================

create table if not exists public.comment_reports (
  id            uuid primary key default gen_random_uuid(),
  comment_id    uuid not null references public.comments(id) on delete cascade,
  reporter_id   uuid not null references auth.users(id) on delete cascade,
  reason        text not null
                  check (reason in ('spam', 'harassment', 'sexual', 'spoiler', 'other')),
  details       text,
  status        text not null default 'open'
                  check (status in ('open', 'resolved', 'dismissed')),
  resolved_by   uuid references auth.users(id) on delete set null,
  resolved_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists comment_reports_comment_idx
  on public.comment_reports(comment_id);
create index if not exists comment_reports_status_idx
  on public.comment_reports(status, created_at desc);
create unique index if not exists comment_reports_open_unique
  on public.comment_reports(comment_id, reporter_id)
  where status = 'open';

drop trigger if exists comment_reports_set_updated_at on public.comment_reports;
create trigger comment_reports_set_updated_at
  before update on public.comment_reports
  for each row execute function public.set_updated_at();

alter table public.comment_reports enable row level security;

-- ---------------------------------------------------------------------
-- comment_reports policies
--   * a logged-in user may file a report on their own behalf
--   * a logged-in user may read their own reports (status / resolution)
--   * admin / superadmin reads + updates all reports
--   * nothing is publicly readable
-- ---------------------------------------------------------------------
drop policy if exists "comment_reports: reporter insert"  on public.comment_reports;
drop policy if exists "comment_reports: reporter read own" on public.comment_reports;
drop policy if exists "comment_reports: admin all"        on public.comment_reports;

create policy "comment_reports: reporter insert"
  on public.comment_reports for insert
  with check (reporter_id = auth.uid());

create policy "comment_reports: reporter read own"
  on public.comment_reports for select
  using (reporter_id = auth.uid());

create policy "comment_reports: admin all"
  on public.comment_reports for all
  using (public.is_admin_or_higher())
  with check (public.is_admin_or_higher());
