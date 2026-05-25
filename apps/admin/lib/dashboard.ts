import { createSupabaseServerClient } from '@/lib/supabase/server';

export type PlatformStats = {
  total_novels: number;
  published_novels: number;
  draft_novels: number;
  pending_novels: number;
  rejected_novels: number;
  total_chapters: number;
  published_chapters: number;
  pending_chapters: number;
  total_users: number;
  readers: number;
  authors: number;
  admins: number;
  suspended_users: number;
  deleted_users: number;
  total_comments: number;
  visible_comments: number;
  hidden_deleted_comments: number;
  total_bookmarks: number;
  total_reading_history: number;
  total_views: number;
  pending_applications: number;
};

const ZERO_STATS: PlatformStats = {
  total_novels: 0, published_novels: 0, draft_novels: 0, pending_novels: 0, rejected_novels: 0,
  total_chapters: 0, published_chapters: 0, pending_chapters: 0,
  total_users: 0, readers: 0, authors: 0, admins: 0, suspended_users: 0, deleted_users: 0,
  total_comments: 0, visible_comments: 0, hidden_deleted_comments: 0,
  total_bookmarks: 0, total_reading_history: 0, total_views: 0, pending_applications: 0,
};

/** Aggregate platform counts via the admin-gated SECURITY DEFINER RPC. */
export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('admin_platform_stats');
  if (error || !data) return ZERO_STATS;
  const row = (Array.isArray(data) ? data[0] : data) as Partial<PlatformStats> | undefined;
  if (!row) return ZERO_STATS;
  // Coerce bigint-as-string/number into numbers.
  const out = { ...ZERO_STATS };
  for (const k of Object.keys(ZERO_STATS) as (keyof PlatformStats)[]) {
    out[k] = Number(row[k] ?? 0);
  }
  return out;
}

export type RecentNovel = { id: string; title: string; review_status: string; created_at: string; authors: { pen_name: string } | null };
export type RecentChapter = { id: string; title: string; status: string; created_at: string; novels: { title: string } | null };
export type RecentComment = { id: string; content: string; status: string; created_at: string; user_display_name: string | null; novels: { title: string } | null };
export type RecentUser = { id: string; display_name: string | null; role: string; created_at: string };
export type RecentApplication = { id: string; pen_name: string; status: string; created_at: string };

export type RecentActivity = {
  novels: RecentNovel[];
  chapters: RecentChapter[];
  comments: RecentComment[];
  users: RecentUser[];
  applications: RecentApplication[];
};

/** Recent rows for the dashboard activity panels (admin RLS allows reads). */
export async function getRecentActivity(): Promise<RecentActivity> {
  const supabase = await createSupabaseServerClient();
  const [novels, chapters, comments, users, applications] = await Promise.all([
    supabase.from('novels').select('id, title, review_status, created_at, authors(pen_name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('chapters').select('id, title, status, created_at, novels(title)').order('created_at', { ascending: false }).limit(5),
    supabase.from('comments').select('id, content, status, created_at, user_display_name, novels(title)').order('created_at', { ascending: false }).limit(5),
    supabase.from('profiles').select('id, display_name, role, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('author_applications').select('id, pen_name, status, created_at').order('created_at', { ascending: false }).limit(5),
  ]);
  return {
    novels: (novels.data ?? []) as unknown as RecentNovel[],
    chapters: (chapters.data ?? []) as unknown as RecentChapter[],
    comments: (comments.data ?? []) as unknown as RecentComment[],
    users: (users.data ?? []) as unknown as RecentUser[],
    applications: (applications.data ?? []) as unknown as RecentApplication[],
  };
}
