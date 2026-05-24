-- =====================================================================
-- 光羽小说 — Phase 6a: public author profiles
--
--   Adds a public, URL-safe `slug` to authors so each author gets a
--   stable public page at /authors/[slug]. Fully additive:
--     * authors.slug (text, unique) — backfilled for every existing row
--     * set_author_slug() BEFORE INSERT trigger auto-generates a slug
--       whenever one is not supplied (covers the role-promotion +
--       application-approval insert paths that don't set slug).
--
--   No data is removed; no RLS, no other table is touched. The existing
--   "authors: public select" policy already exposes these columns, so the
--   public directory/profile pages work for anonymous visitors.
-- =====================================================================

-- 1. column ------------------------------------------------------------
alter table public.authors
  add column if not exists slug text;

-- 2. slug generator ----------------------------------------------------
--    Latin pen names yield a readable slug; non-latin (e.g. Chinese)
--    names slugify to empty, so we always append a short hex suffix from
--    the row id. The id suffix also guarantees global uniqueness.
create or replace function public.gen_author_slug(p_pen_name text, p_id uuid)
returns text
language sql
immutable
as $$
  select coalesce(
           nullif(
             trim(both '-' from regexp_replace(lower(coalesce(p_pen_name, '')), '[^a-z0-9]+', '-', 'g')),
             ''
           ) || '-',
           'author-'
         ) || left(replace(p_id::text, '-', ''), 8);
$$;

-- 3. backfill every existing row --------------------------------------
update public.authors
set slug = public.gen_author_slug(pen_name, id)
where slug is null or slug = '';

-- 4. uniqueness --------------------------------------------------------
create unique index if not exists authors_slug_key on public.authors(slug);

-- 5. auto-generate on insert when not provided -------------------------
create or replace function public.set_author_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := public.gen_author_slug(new.pen_name, new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists authors_set_slug on public.authors;
create trigger authors_set_slug
  before insert on public.authors
  for each row execute function public.set_author_slug();
