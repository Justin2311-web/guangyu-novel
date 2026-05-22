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
  updated_at: string;
  authors: { pen_name: string } | null;
  categories: { name: string; slug: string } | null;
};

const NOVEL_LIST_SELECT =
  'id, slug, title, description, cover_image_url, status, created_at, updated_at, authors(pen_name), categories(name, slug)';

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

export type NovelSort = 'updated' | 'created' | 'title';

export type NovelQueryOptions = {
  q?: string;
  categorySlug?: string;
  status?: NovelSerialStatus;
  sort?: NovelSort;
};

/**
 * Published novels (RLS gates to is_published) with optional search, category
 * + status filters, and sorting. The free-text query matches title,
 * description, author pen name, or category name (matched in-memory so it can
 * span the joined author/category relations).
 */
export async function getNovels(options: NovelQueryOptions = {}): Promise<NovelListItem[]> {
  const { q, categorySlug, status, sort = 'updated' } = options;
  const supabase = await createSupabaseServerClient();

  let query = supabase.from('novels').select(NOVEL_LIST_SELECT);

  if (status) query = query.eq('status', status);
  if (categorySlug) {
    query = query.eq('categories.slug', categorySlug).not('category_id', 'is', null);
  }

  if (sort === 'title') query = query.order('title', { ascending: true });
  else if (sort === 'created') query = query.order('created_at', { ascending: false });
  else query = query.order('updated_at', { ascending: false });

  const { data } = await query;
  let rows = (data ?? []) as unknown as NovelListItem[];

  // The embedded category filter only nulls the relation; keep matched rows.
  if (categorySlug) rows = rows.filter((r) => r.categories?.slug === categorySlug);

  const needle = q?.trim().toLowerCase();
  if (needle) {
    rows = rows.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) ||
        (r.description ?? '').toLowerCase().includes(needle) ||
        (r.authors?.pen_name ?? '').toLowerCase().includes(needle) ||
        (r.categories?.name ?? '').toLowerCase().includes(needle),
    );
  }

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

// =====================================================================
// Reader experience — reading history & bookmarks (RLS scopes every
// query below to the current user; logged-out callers get empty results).
// =====================================================================

/** The user's last-read chapter for a novel, or null. */
export async function getReadingHistoryForNovel(
  novelId: string,
): Promise<{ chapterNumber: number } | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('reading_history')
    .select('chapters(chapter_number)')
    .eq('novel_id', novelId)
    .maybeSingle();
  const num = (data as { chapters: { chapter_number: number } | null } | null)?.chapters
    ?.chapter_number;
  return typeof num === 'number' ? { chapterNumber: num } : null;
}

export type ContinueReadingItem = {
  novelSlug: string;
  novelTitle: string;
  coverImageUrl: string | null;
  chapterNumber: number | null;
  chapterTitle: string | null;
  lastReadAt: string;
};

/** Recently-read novels for the current user, newest first (visible novels only). */
export async function getContinueReading(limit = 6): Promise<ContinueReadingItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('reading_history')
    .select(
      'last_read_at, novels!inner(slug, title, cover_image_url), chapters(chapter_number, title)',
    )
    .order('last_read_at', { ascending: false })
    .limit(limit);

  type Row = {
    last_read_at: string;
    novels: { slug: string; title: string; cover_image_url: string | null } | null;
    chapters: { chapter_number: number; title: string } | null;
  };
  return ((data ?? []) as unknown as Row[])
    .filter((r) => r.novels)
    .map((r) => ({
      novelSlug: r.novels!.slug,
      novelTitle: r.novels!.title,
      coverImageUrl: r.novels!.cover_image_url,
      chapterNumber: r.chapters?.chapter_number ?? null,
      chapterTitle: r.chapters?.title ?? null,
      lastReadAt: r.last_read_at,
    }));
}

/** Whether the current user has bookmarked a novel. */
export async function isBookmarked(novelId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('novel_id', novelId)
    .maybeSingle();
  return !!data;
}

export type BookmarkItem = {
  novelSlug: string;
  novelTitle: string;
  authorName: string | null;
  categoryName: string | null;
  continueChapterNumber: number | null;
};

/** The current user's bookmarked novels with a continue-reading chapter if any. */
export async function getBookmarks(): Promise<BookmarkItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('bookmarks')
    .select(
      'created_at, novels!inner(id, slug, title, authors(pen_name), categories(name))',
    )
    .order('created_at', { ascending: false });

  type Row = {
    novels: {
      id: string;
      slug: string;
      title: string;
      authors: { pen_name: string } | null;
      categories: { name: string } | null;
    } | null;
  };
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.novels);

  // Map each bookmarked novel to the user's last-read chapter (if any).
  const { data: hist } = await supabase
    .from('reading_history')
    .select('novel_id, chapters(chapter_number)');
  type HistRow = { novel_id: string; chapters: { chapter_number: number } | null };
  const continueByNovel = new Map<string, number>();
  for (const h of (hist ?? []) as unknown as HistRow[]) {
    if (h.chapters?.chapter_number != null) continueByNovel.set(h.novel_id, h.chapters.chapter_number);
  }

  return rows.map((r) => ({
    novelSlug: r.novels!.slug,
    novelTitle: r.novels!.title,
    authorName: r.novels!.authors?.pen_name ?? null,
    categoryName: r.novels!.categories?.name ?? null,
    continueChapterNumber: continueByNovel.get(r.novels!.id) ?? null,
  }));
}
