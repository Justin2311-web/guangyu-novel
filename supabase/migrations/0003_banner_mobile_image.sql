-- =====================================================================
-- 光羽小说 — Phase 3d: responsive banner images
--
-- The Phase 1 banners table had a single image_url. Phase 3d treats that
-- column as the desktop image and adds an optional mobile_image_url that
-- the reader falls back from to image_url when absent.
-- =====================================================================

alter table public.banners
  add column if not exists mobile_image_url text;

comment on column public.banners.image_url is
  'Desktop banner image URL (required).';
comment on column public.banners.mobile_image_url is
  'Optional mobile banner image URL; falls back to image_url when null.';
