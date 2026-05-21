import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  parseSiteSettings,
  type Banner,
  type Category,
  type NovelSerialStatus,
  type SiteSettings,
} from '@guangyu/database';

/**
 * Site settings, read fresh on every request (the cookie-based Supabase client
 * makes callers dynamic), so admin changes appear without a rebuild/redeploy.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('site_settings').select('key, value');
  return parseSiteSettings(data);
}

export type HomeBanner = Pick<
  Banner,
  'id' | 'title' | 'image_url' | 'mobile_image_url' | 'link_url' | 'button_label'
>;

/** Active banners, ascending by sort_order. RLS already restricts to active = true. */
export async function getActiveBanners(): Promise<HomeBanner[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('banners')
    .select('id, title, image_url, mobile_image_url, link_url, button_label')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  return (data ?? []) as HomeBanner[];
}

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

/** Route params for non-ASCII slugs arrive percent-encoded; decode before matching. */
function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export async function getNovelBySlug(slug: string): Promise<NovelDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('novels')
    .select(NOVEL_LIST_SELECT)
    .eq('slug', decodeSlug(slug))
    .maybeSingle();
  return (data as unknown as NovelDetail) ?? null;
}

export type ChapterListItem = { id: string; chapter_number: number; title: string };

/** Published chapters of a novel, ascending. RLS also gates on the parent novel being published. */
export async function getPublishedChapters(novelId: string): Promise<ChapterListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('chapters')
    .select('id, chapter_number, title')
    .eq('novel_id', novelId)
    .eq('status', 'published')
    .order('chapter_number', { ascending: true });
  return (data ?? []) as ChapterListItem[];
}

export type ChapterContent = ChapterListItem & { content: string };

export async function getChapterContent(
  novelId: string,
  chapterNumber: number,
): Promise<ChapterContent | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('chapters')
    .select('id, chapter_number, title, content')
    .eq('novel_id', novelId)
    .eq('chapter_number', chapterNumber)
    .eq('status', 'published')
    .maybeSingle();
  return (data as ChapterContent) ?? null;
}
