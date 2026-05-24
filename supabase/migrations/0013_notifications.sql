-- =====================================================================
-- 光羽小说 — Phase 6d: notification center
--
--   New table public.notifications + its own RLS. Notifications are
--   generated entirely by SECURITY DEFINER triggers on existing tables, so
--   no application code needs elevated inserts and no existing approval /
--   comment / review logic is modified. Nothing else (tables, columns,
--   policies, functions) is changed — fully additive.
--
--   Cross-user inserts (comment -> author, new chapter -> bookmarkers) are
--   impossible under owner-only insert RLS without the service role, so the
--   trigger functions (owned by the migration role) do the inserts. The
--   shared _notify() helper has EXECUTE revoked from clients, so it can only
--   run from inside those triggers — clients can never inject notifications.
-- =====================================================================

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text,
  target_url  text,
  actor_id    uuid references auth.users(id) on delete set null,
  novel_id    uuid references public.novels(id) on delete cascade,
  chapter_id  uuid references public.chapters(id) on delete cascade,
  comment_id  uuid references public.comments(id) on delete cascade,
  read_at     timestamptz,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications(user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications(user_id) where read_at is null;

alter table public.notifications enable row level security;

-- ---------------------------------------------------------------------
-- RLS: a user sees & updates only their own; admins manage all; there is
-- NO client insert policy (inserts happen via the definer triggers only).
-- ---------------------------------------------------------------------
drop policy if exists "notifications: owner select" on public.notifications;
drop policy if exists "notifications: owner update" on public.notifications;
drop policy if exists "notifications: admin all"    on public.notifications;

create policy "notifications: owner select"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications: owner update"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications: admin all"
  on public.notifications for all
  using (public.is_admin_or_higher())
  with check (public.is_admin_or_higher());

-- ---------------------------------------------------------------------
-- shared insert helper (clients cannot call it directly)
-- ---------------------------------------------------------------------
create or replace function public._notify(
  p_user_id    uuid,
  p_type       text,
  p_title      text,
  p_body       text,
  p_target_url text,
  p_actor_id   uuid default null,
  p_novel_id   uuid default null,
  p_chapter_id uuid default null,
  p_comment_id uuid default null
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notifications
    (user_id, type, title, body, target_url, actor_id, novel_id, chapter_id, comment_id)
  values
    (p_user_id, p_type, p_title, p_body, p_target_url, p_actor_id, p_novel_id, p_chapter_id, p_comment_id);
$$;

revoke all on function
  public._notify(uuid, text, text, text, text, uuid, uuid, uuid, uuid) from public;

-- ---------------------------------------------------------------------
-- comment on a novel -> notify the author (skip self-comments)
-- ---------------------------------------------------------------------
create or replace function public.tg_notify_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_uid uuid;
  v_slug       text;
  v_title      text;
begin
  if new.status <> 'visible' then
    return new;
  end if;
  select a.profile_id, n.slug, n.title
    into v_author_uid, v_slug, v_title
  from public.novels n
  join public.authors a on a.id = n.author_id
  where n.id = new.novel_id;

  if v_author_uid is null or v_author_uid = new.user_id then
    return new;
  end if;

  perform public._notify(
    v_author_uid,
    'comment_on_novel',
    format('《%s》收到新评论', coalesce(v_title, '作品')),
    left(new.content, 80),
    '/novels/' || v_slug,
    new.user_id, new.novel_id, null, new.id
  );
  return new;
end;
$$;

drop trigger if exists comments_notify_author on public.comments;
create trigger comments_notify_author
  after insert on public.comments
  for each row execute function public.tg_notify_comment();

-- ---------------------------------------------------------------------
-- novel review status change -> notify the author
-- ---------------------------------------------------------------------
create or replace function public.tg_notify_novel_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_uid uuid;
begin
  select profile_id into v_author_uid from public.authors where id = new.author_id;
  if v_author_uid is null then
    return new;
  end if;

  if new.review_status = 'published' then
    perform public._notify(v_author_uid, 'novel_approved',
      format('《%s》已通过审核', new.title), '你的作品已发布并公开展示。',
      '/author/novels/' || new.id || '/edit', auth.uid(), new.id, null, null);
  elsif new.review_status = 'rejected' then
    perform public._notify(v_author_uid, 'novel_rejected',
      format('《%s》未通过审核', new.title), coalesce(new.review_note, '请查看审核意见。'),
      '/author/novels/' || new.id || '/edit', auth.uid(), new.id, null, null);
  end if;
  return new;
end;
$$;

drop trigger if exists novels_notify_review on public.novels;
create trigger novels_notify_review
  after update on public.novels
  for each row
  when (old.review_status is distinct from new.review_status)
  execute function public.tg_notify_novel_review();

-- ---------------------------------------------------------------------
-- chapter review status change -> notify author + (on publish) bookmarkers
-- ---------------------------------------------------------------------
create or replace function public.tg_notify_chapter_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_uid uuid;
  v_slug       text;
  v_ntitle     text;
begin
  select a.profile_id, n.slug, n.title
    into v_author_uid, v_slug, v_ntitle
  from public.novels n
  join public.authors a on a.id = n.author_id
  where n.id = new.novel_id;

  if new.status = 'published' and old.status is distinct from 'published' then
    if v_author_uid is not null then
      perform public._notify(v_author_uid, 'chapter_approved',
        format('章节《%s》已通过审核', new.title), '章节已发布。',
        '/author/chapters/' || new.id || '/edit', auth.uid(), new.novel_id, new.id, null);
    end if;

    -- fan-out to everyone who bookmarked this novel, except the author
    insert into public.notifications
      (user_id, type, title, body, target_url, actor_id, novel_id, chapter_id)
    select
      b.user_id, 'novel_new_chapter',
      format('《%s》更新了新章节', coalesce(v_ntitle, '作品')),
      format('第 %s 章 %s', new.chapter_number, new.title),
      '/novels/' || v_slug || '/' || new.chapter_number,
      null, new.novel_id, new.id
    from public.bookmarks b
    where b.novel_id = new.novel_id
      and (v_author_uid is null or b.user_id <> v_author_uid);

  elsif new.status = 'rejected' and old.status is distinct from 'rejected' then
    if v_author_uid is not null then
      perform public._notify(v_author_uid, 'chapter_rejected',
        format('章节《%s》未通过审核', new.title), coalesce(new.review_note, '请查看审核意见。'),
        '/author/chapters/' || new.id || '/edit', auth.uid(), new.novel_id, new.id, null);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists chapters_notify_review on public.chapters;
create trigger chapters_notify_review
  after update on public.chapters
  for each row
  when (old.status is distinct from new.status)
  execute function public.tg_notify_chapter_review();

-- ---------------------------------------------------------------------
-- author application decision -> notify the applicant
-- ---------------------------------------------------------------------
create or replace function public.tg_notify_application_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' then
    perform public._notify(new.user_id, 'author_application_approved',
      '作者申请已通过', '欢迎加入！你现在可以在作者中心创作。',
      '/author/dashboard', auth.uid(), null, null, null);
  elsif new.status = 'rejected' then
    perform public._notify(new.user_id, 'author_application_rejected',
      '作者申请未通过', coalesce(new.admin_note, '感谢你的申请。'),
      '/account', auth.uid(), null, null, null);
  end if;
  return new;
end;
$$;

drop trigger if exists author_applications_notify on public.author_applications;
create trigger author_applications_notify
  after update on public.author_applications
  for each row
  when (old.status is distinct from new.status)
  execute function public.tg_notify_application_review();
