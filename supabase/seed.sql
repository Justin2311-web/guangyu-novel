-- =====================================================================
-- 光羽小说 — Phase 1 seed data
--
-- Safe to run multiple times: every insert is guarded with ON CONFLICT.
--
-- The demo author is created by inserting directly into auth.users so the
-- profile/author FK chain resolves. This is intended for LOCAL DEV and
-- staging only. Do NOT run this against production.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------
insert into public.categories (slug, name, description, sort_order) values
  ('xianxia',    '仙侠',   '修真、问道、飞升的东方玄幻世界', 10),
  ('xuanhuan',   '玄幻',   '异世大陆、斗气魔法的西式玄幻',     20),
  ('dushi',      '都市',   '都市生活、职场情感的现代题材',     30),
  ('lishi',      '历史',   '架空、穿越、正史改编的历史题材',     40),
  ('kehuan',     '科幻',   '星际、末日、未来科技的科幻题材',     50),
  ('xuanyi',     '悬疑',   '推理、惊悚、灵异的悬疑题材',         60)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Demo author — local-dev only
--   * Creates an auth.users row with a fixed UUID
--   * handle_new_user() trigger creates the matching profiles row
--   * Then we elevate role to 'author' and create the authors record
-- ---------------------------------------------------------------------
do $$
declare
  v_user_id uuid := '00000000-0000-0000-0000-00000000a001';
  v_author_id uuid;
  v_category_id uuid;
  v_novel_id uuid;
begin
  -- 1. Insert a demo auth user (skipped if already present).
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at
  ) values (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'demo-author@guangyu.local',
    crypt('demo-password-change-me', gen_salt('bf')),
    now(),
    jsonb_build_object('display_name', '光羽测试作者'),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    now(), now()
  ) on conflict (id) do nothing;

  -- 2. Ensure the profile row exists (trigger handles new inserts,
  --    but be defensive in case the trigger was disabled).
  insert into public.profiles (id, role, display_name)
  values (v_user_id, 'author', '光羽测试作者')
  on conflict (id) do update set role = 'author';

  -- 3. Author record.
  insert into public.authors (profile_id, pen_name, bio)
  values (v_user_id, '云中鹤', '光羽小说平台的示例作者，用于演示与本地开发。')
  on conflict (profile_id) do nothing
  returning id into v_author_id;

  if v_author_id is null then
    select id into v_author_id from public.authors where profile_id = v_user_id;
  end if;

  -- 4. Category lookup.
  select id into v_category_id from public.categories where slug = 'xianxia';

  -- 5. Demo novel.
  insert into public.novels (
    author_id, category_id, slug, title, description,
    cover_image_url, status, is_published, review_status, featured, published_at
  ) values (
    v_author_id, v_category_id,
    'yulinjian-ji',
    '《羽林剑记》',
    '少年沈青松机缘巧合得到一柄上古羽林剑，自此踏上问鼎仙途的修行之路。',
    null,
    'ongoing', true, 'published', true, now()
  )
  on conflict (slug) do nothing
  returning id into v_novel_id;

  if v_novel_id is null then
    select id into v_novel_id from public.novels where slug = 'yulinjian-ji';
  end if;

  -- 6. Demo chapters.
  insert into public.chapters (novel_id, chapter_number, title, content, status, published_at)
  values
    (v_novel_id, 1, '第一章 · 少年与剑',
     E'青松镇的晨雾里，沈青松第一次握住了那柄羽林剑。\n\n剑刃极轻，却仿佛压住了他十六年的命数。',
     'published', now()),
    (v_novel_id, 2, '第二章 · 入山',
     E'三日之后，他独自踏上了通往云隐山的石阶。\n\n山风将他单薄的衣衫吹得猎猎作响，他却始终没有回头。',
     'published', now())
  on conflict (novel_id, chapter_number) do nothing;
end $$;

-- ---------------------------------------------------------------------
-- Default banner
-- ---------------------------------------------------------------------
insert into public.banners (title, image_url, link_url, button_label, sort_order, active)
values (
  '光羽小说 · 全新上线',
  'https://placehold.co/1200x400?text=光羽小说',
  '/novels',
  '前往书库',
  10,
  true
)
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Default site_settings
-- ---------------------------------------------------------------------
insert into public.site_settings (key, value) values
  ('site.name',            to_jsonb('光羽小说'::text)),
  ('site.logo_url',        to_jsonb(''::text)),
  ('site.footer_logo_url', to_jsonb(''::text)),
  ('site.footer_links',    '[]'::jsonb),
  ('site.social_links',    '[]'::jsonb),
  ('announcement.text',    to_jsonb('欢迎来到光羽小说，新作品持续更新中。'::text)),
  ('announcement.active',  to_jsonb(true)),
  ('announcement.scrolling', to_jsonb(true))
on conflict (key) do nothing;
