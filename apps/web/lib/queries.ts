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
  authors: { pen_name: string; slug: string | null } | null;
  categories: { name: string; slug: string } | null;
};

const NOVEL_LIST_SELECT =
  'id, slug, title, description, cover_image_url, status, created_at, updated_at, authors(pen_name, slug), categories(name, slug)';

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

/** Most-viewed published novels (popularity ranking). */
export async function getPopularNovels(limit = 8): Promise<NovelListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('novels')
    .select(NOVEL_LIST_SELECT)
    .order('view_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as NovelListItem[];
}

/** Featured published novels; falls back to latest when none are flagged. */
export async function getFeaturedNovels(limit = 6): Promise<NovelListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('novels')
    .select(NOVEL_LIST_SELECT)
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  const featured = (data ?? []) as unknown as NovelListItem[];
  if (featured.length > 0) return featured;
  return getLatestNovels(limit);
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

// =====================================================================
// Phase 6a — public author profiles
//   RLS: "authors: public select" exposes author rows to everyone, and
//   embedded novel/chapter counts respect the novels/chapters RLS, so
//   anonymous visitors only ever see *published* novels and chapters.
// =====================================================================

export type PublicAuthorListItem = {
  id: string;
  slug: string;
  penName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  novelCount: number;
  totalViews: number;
};

/**
 * Active authors for the public directory / ranking, ordered by total views
 * (most-read first). The embedded novels(view_count) respects the novels RLS,
 * so only *published* novels contribute to the count and view total for
 * anonymous visitors.
 */
export async function getPublicAuthors(): Promise<PublicAuthorListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('authors')
    .select('id, slug, pen_name, bio, avatar_url, created_at, status, novels(view_count)')
    .eq('status', 'active');

  type Row = {
    id: string;
    slug: string | null;
    pen_name: string;
    bio: string | null;
    avatar_url: string | null;
    created_at: string;
    novels: { view_count: number | null }[] | null;
  };

  return ((data ?? []) as unknown as Row[])
    .filter((r) => r.slug)
    .map((r) => {
      const novels = r.novels ?? [];
      return {
        id: r.id,
        slug: r.slug as string,
        penName: r.pen_name,
        bio: r.bio,
        avatarUrl: r.avatar_url,
        createdAt: r.created_at,
        novelCount: novels.length,
        totalViews: novels.reduce((sum, n) => sum + (n.view_count ?? 0), 0),
      };
    })
    .sort((a, b) => b.totalViews - a.totalViews || b.novelCount - a.novelCount);
}

/** Top authors by total views (homepage hot-authors section). */
export async function getTopAuthors(limit = 6): Promise<PublicAuthorListItem[]> {
  return (await getPublicAuthors()).slice(0, limit);
}

export type PublicAuthorDetail = {
  id: string;
  slug: string;
  penName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

export async function getPublicAuthorBySlug(slug: string): Promise<PublicAuthorDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('authors')
    .select('id, slug, pen_name, bio, avatar_url, created_at, status')
    .eq('slug', decodeSlug(slug))
    .eq('status', 'active')
    .maybeSingle();
  if (!data) return null;
  const r = data as {
    id: string;
    slug: string;
    pen_name: string;
    bio: string | null;
    avatar_url: string | null;
    created_at: string;
  };
  return {
    id: r.id,
    slug: r.slug,
    penName: r.pen_name,
    bio: r.bio,
    avatarUrl: r.avatar_url,
    createdAt: r.created_at,
  };
}

export type AuthorPublicStats = { totalNovels: number; totalChapters: number; totalViews: number };

/** An author's published novels (RLS-gated) plus aggregate public stats. */
export async function getAuthorPublicData(
  authorId: string,
): Promise<{ novels: NovelListItem[]; stats: AuthorPublicStats }> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('novels')
    .select(
      'id, slug, title, description, cover_image_url, status, created_at, updated_at, view_count, authors(pen_name, slug), categories(name, slug)',
    )
    .eq('author_id', authorId)
    .order('updated_at', { ascending: false });

  const rows = (data ?? []) as unknown as (NovelListItem & { view_count: number | null })[];
  const totalViews = rows.reduce((sum, n) => sum + (n.view_count ?? 0), 0);

  let totalChapters = 0;
  const novelIds = rows.map((n) => n.id);
  if (novelIds.length > 0) {
    const { count } = await supabase
      .from('chapters')
      .select('id', { count: 'exact', head: true })
      .in('novel_id', novelIds)
      .eq('status', 'published');
    totalChapters = count ?? 0;
  }

  return {
    novels: rows as NovelListItem[],
    stats: { totalNovels: rows.length, totalChapters, totalViews },
  };
}

// =====================================================================
// Phase 6c — novel comments (RLS: "comments: public read visible" returns
// only status = 'visible' rows, so anonymous + logged-in callers alike see
// the public list; counts use the same gated read).
// =====================================================================

export type NovelComment = {
  id: string;
  userId: string;
  displayName: string;
  content: string;
  createdAt: string;
};

/** Visible comments for a novel, newest first. */
export async function getNovelComments(novelId: string): Promise<NovelComment[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('comments')
    .select('id, user_id, user_display_name, content, created_at, status')
    .eq('novel_id', novelId)
    .eq('status', 'visible')
    .order('created_at', { ascending: false });

  type Row = {
    id: string;
    user_id: string;
    user_display_name: string | null;
    content: string;
    created_at: string;
  };
  return ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    userId: r.user_id,
    displayName: r.user_display_name?.trim() || '读者',
    content: r.content,
    createdAt: r.created_at,
  }));
}

/** Count of visible comments for a novel (lightweight; no denormalized column). */
export async function getNovelCommentCount(novelId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('novel_id', novelId)
    .eq('status', 'visible');
  return count ?? 0;
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

// =====================================================================
// Phase 4c — bookshelf + reading progress
// =====================================================================

export type ReadingProgress = {
  chapterNumber: number;
  chapterTitle: string | null;
  total: number;
  percent: number; // 0–100, position of the read chapter within published chapters
};

export type ShelfItem = {
  novelSlug: string;
  novelTitle: string;
  coverImageUrl: string | null;
  authorName: string | null;
  categoryName: string | null;
  lastReadAt: string | null;
  progress: ReadingProgress | null;
};

/** Map of novelId -> ascending published chapter numbers (RLS: published only). */
async function publishedChapterNumbers(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  novelIds: string[],
): Promise<Map<string, number[]>> {
  const map = new Map<string, number[]>();
  if (novelIds.length === 0) return map;
  const { data } = await supabase
    .from('chapters')
    .select('novel_id, chapter_number')
    .in('novel_id', novelIds)
    .eq('status', 'published')
    .order('chapter_number', { ascending: true });
  for (const row of (data ?? []) as { novel_id: string; chapter_number: number }[]) {
    const arr = map.get(row.novel_id) ?? [];
    arr.push(row.chapter_number);
    map.set(row.novel_id, arr);
  }
  return map;
}

function computeProgress(
  chapterNumber: number | null,
  chapterTitle: string | null,
  chapterNumbers: number[] | undefined,
): ReadingProgress | null {
  if (chapterNumber == null || !chapterNumbers || chapterNumbers.length === 0) return null;
  const position = chapterNumbers.filter((n) => n <= chapterNumber).length;
  return {
    chapterNumber,
    chapterTitle,
    total: chapterNumbers.length,
    percent: Math.round((position / chapterNumbers.length) * 100),
  };
}

/** Reading progress for a single novel (used on the novel detail page). */
export async function getReadingProgressForNovel(novelId: string): Promise<ReadingProgress | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('reading_history')
    .select('chapters(chapter_number, title)')
    .eq('novel_id', novelId)
    .maybeSingle();
  const ch = (data as { chapters: { chapter_number: number; title: string } | null } | null)
    ?.chapters;
  if (!ch) return null;
  const nums = (await publishedChapterNumbers(supabase, [novelId])).get(novelId);
  return computeProgress(ch.chapter_number, ch.title, nums);
}

/** The current user's reading history (newest first) with progress per novel. */
export async function getReadingList(limit?: number): Promise<ShelfItem[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('reading_history')
    .select(
      'last_read_at, novel_id, chapters(chapter_number, title), novels!inner(slug, title, cover_image_url, authors(pen_name), categories(name))',
    )
    .order('last_read_at', { ascending: false });
  if (limit) query = query.limit(limit);
  const { data } = await query;

  type Row = {
    last_read_at: string;
    novel_id: string;
    chapters: { chapter_number: number; title: string } | null;
    novels: {
      slug: string;
      title: string;
      cover_image_url: string | null;
      authors: { pen_name: string } | null;
      categories: { name: string } | null;
    } | null;
  };
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.novels);
  const totals = await publishedChapterNumbers(supabase, [...new Set(rows.map((r) => r.novel_id))]);

  return rows.map((r) => ({
    novelSlug: r.novels!.slug,
    novelTitle: r.novels!.title,
    coverImageUrl: r.novels!.cover_image_url,
    authorName: r.novels!.authors?.pen_name ?? null,
    categoryName: r.novels!.categories?.name ?? null,
    lastReadAt: r.last_read_at,
    progress: computeProgress(
      r.chapters?.chapter_number ?? null,
      r.chapters?.title ?? null,
      totals.get(r.novel_id),
    ),
  }));
}

/** The current user's bookmarked novels with reading progress where available. */
export async function getBookmarksDetailed(): Promise<ShelfItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('bookmarks')
    .select(
      'created_at, novels!inner(id, slug, title, cover_image_url, authors(pen_name), categories(name))',
    )
    .order('created_at', { ascending: false });

  type Row = {
    novels: {
      id: string;
      slug: string;
      title: string;
      cover_image_url: string | null;
      authors: { pen_name: string } | null;
      categories: { name: string } | null;
    } | null;
  };
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.novels);
  const novelIds = rows.map((r) => r.novels!.id);

  const { data: hist } = await supabase
    .from('reading_history')
    .select('novel_id, last_read_at, chapters(chapter_number, title)');
  type HistRow = {
    novel_id: string;
    last_read_at: string;
    chapters: { chapter_number: number; title: string } | null;
  };
  const histByNovel = new Map<string, HistRow>();
  for (const h of (hist ?? []) as unknown as HistRow[]) histByNovel.set(h.novel_id, h);

  const totals = await publishedChapterNumbers(supabase, novelIds);

  return rows.map((r) => {
    const h = histByNovel.get(r.novels!.id);
    return {
      novelSlug: r.novels!.slug,
      novelTitle: r.novels!.title,
      coverImageUrl: r.novels!.cover_image_url,
      authorName: r.novels!.authors?.pen_name ?? null,
      categoryName: r.novels!.categories?.name ?? null,
      lastReadAt: h?.last_read_at ?? null,
      progress: computeProgress(
        h?.chapters?.chapter_number ?? null,
        h?.chapters?.title ?? null,
        totals.get(r.novels!.id),
      ),
    };
  });
}
