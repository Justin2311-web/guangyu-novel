-- =====================================================================
-- 光羽小说 — Phase 6n: restrict storage deletes to admins
--
--   The Media Library exposes delete. Previously DELETE on public-assets
--   was open to any authenticated user; no client ever deleted objects, so
--   tightening DELETE to admin/superadmin is safe and removes an over-broad
--   grant. READ stays public; INSERT/UPDATE stay authenticated so author +
--   admin uploads keep working unchanged. Additive + idempotent.
-- =====================================================================

drop policy if exists "public-assets delete" on storage.objects;

create policy "public-assets delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'public-assets' and public.is_admin_or_higher());
