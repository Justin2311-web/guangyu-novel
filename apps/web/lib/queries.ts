import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Category, NovelSerialStatus } from '@guangyu/database';

export async function getCategories(): Promise<Category[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('categories')
    .select('id, slug, name, description, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  return (data ?? []) as Category[];
}

export type NovelListItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  status: NovelSerialStatus;
  created_at: string;
  authors: { pen_name: string } | null;
  categories: { name: string; slug: string } | null;
};

const NOVEL_LIST_SELECT =
  'id, slug, title, description, cover_image_url, status, created_at, authors(pen_name), categories(name, slug)';

/** Latest published novels (RLS only returns is_published = true). */
export async function getLatestNovels(limit = 8): Promise<NovelListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('novels')
    .select(NOVEL_LIST_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as NovelListItem[];
}

/** All published novels, optionally filtered by category slug. */
export async function getNovels(categorySlug?: string): Promise<NovelListItem[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('novels')
    .select(NOVEL_LIST_SELECT)
    .order('created_at', { ascending: false });

  if (categorySlug) {
    // filter via the joined category slug
    query = query.eq('categories.slug', categorySlug).not('category_id', 'is', null);
  }

  const { data } = await query;
  let rows = (data ?? []) as unknown as NovelListItem[];
  // The embedded filter only nulls the relation; keep rows whose category matched.
  if (categorySlug) rows = rows.filter((r) => r.categories?.slug === categorySlug);
  return rows;
}

export type NovelDetail = NovelListItem & { description: string | null };

export async function getNovelBySlug(slug: string): Promise<NovelDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('novels')
    .select(NOVEL_LIST_SELECT)
    .eq('slug', slug)
    .maybeSingle();
  return (data as unknown as NovelDetail) ?? null;
}
