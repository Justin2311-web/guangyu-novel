-- =====================================================================
-- 光羽小说 — Phase 3f: site settings CMS
--
-- The site_settings table (key text PK, value jsonb) already exists from
-- 0001 with public-read / admin-write RLS. This migration is idempotent:
-- it ensures the table exists and seeds the canonical Phase 3f keys with
-- sensible defaults (existing rows are preserved via ON CONFLICT DO NOTHING).
-- Values are stored as jsonb strings.
-- =====================================================================

create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value) values
  -- General
  ('site.name',          to_jsonb('光羽小说'::text)),
  ('site.description',   to_jsonb('光羽小说 — 阅读优质中文小说的开放平台。'::text)),
  ('site.logo_url',      to_jsonb(''::text)),
  ('site.favicon_url',   to_jsonb(''::text)),
  -- Homepage
  ('home.hero_title',    to_jsonb('欢迎来到 光羽小说'::text)),
  ('home.hero_subtitle', to_jsonb('阅读优质中文小说。后续阶段将接入推荐、最新更新与作者后台等功能。'::text)),
  ('home.hero_cta_text', to_jsonb('进入书库'::text)),
  ('home.hero_cta_link', to_jsonb('/novels'::text)),
  -- SEO
  ('seo.meta_title',       to_jsonb('光羽小说'::text)),
  ('seo.meta_description', to_jsonb('光羽小说 — 阅读优质中文小说的开放平台。'::text)),
  ('seo.meta_keywords',    to_jsonb('小说,中文小说,在线阅读'::text)),
  -- Social media
  ('social.facebook',  to_jsonb(''::text)),
  ('social.instagram', to_jsonb(''::text)),
  ('social.tiktok',    to_jsonb(''::text)),
  ('social.youtube',   to_jsonb(''::text)),
  ('social.discord',   to_jsonb(''::text)),
  -- Contact
  ('contact.email',   to_jsonb(''::text)),
  ('contact.phone',   to_jsonb(''::text)),
  ('contact.address', to_jsonb(''::text)),
  -- Footer
  ('footer.about',     to_jsonb(''::text)),
  ('footer.copyright', to_jsonb('© 光羽小说. All rights reserved.'::text))
on conflict (key) do nothing;
