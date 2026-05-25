-- =====================================================================
-- 光羽小说 — Phase 6i: local image upload via Supabase Storage
--
--   Creates the public `public-assets` bucket used for uploaded images
--   (novel covers, author avatars, site logo/favicon, banners). Fully
--   additive + idempotent: existing external image URLs are untouched and
--   keep working — the uploader simply writes a new public URL into the
--   same existing DB columns.
--
--   Security model (safe minimum):
--     * public READ of bucket objects (covers/avatars/banners are public)
--     * only AUTHENTICATED users may write (insert/update/delete) — anon
--       cannot upload
--   Fine-grained per-author path ownership is intentionally NOT enforced at
--   the storage layer (documented limitation): the meaningful boundary is
--   which DB row a URL can be attached to, which is already governed by the
--   novels / authors / site_settings table RLS. Bucket also enforces a 5MB
--   size cap and an image-only mime allow-list server-side.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-assets',
  'public-assets',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- RLS is already enabled on storage.objects by Supabase.
drop policy if exists "public-assets read"   on storage.objects;
drop policy if exists "public-assets insert" on storage.objects;
drop policy if exists "public-assets update" on storage.objects;
drop policy if exists "public-assets delete" on storage.objects;

create policy "public-assets read"
  on storage.objects for select
  using (bucket_id = 'public-assets');

create policy "public-assets insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'public-assets');

create policy "public-assets update"
  on storage.objects for update to authenticated
  using (bucket_id = 'public-assets')
  with check (bucket_id = 'public-assets');

create policy "public-assets delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'public-assets');
