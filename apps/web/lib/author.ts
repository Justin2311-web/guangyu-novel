import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { NovelReviewStatus, NovelSerialStatus, ChapterStatus } from '@guangyu/database';

export type MyAuthor = { id: string; pen_name: string; bio: string | null; status: string };

/** The authors row owned by the current user (null if none — e.g. admins). */
export async function getMyAuthor(): Promise<MyAuthor | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('authors')
    .select('id, pen_name, bio, status')
    .maybeSingle(); // RLS "authors: self manage" scopes to profile_id = auth.uid()
  return (data as MyAuthor | null) ?? null;
}

export type MyNovel = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  status: NovelSerialStatus;
  review_status: NovelReviewStatus;
  review_note: string | null;
  is_published: boolean;
  category_id: string | null;
  updated_at: string;
  categories: { name: string } | null;
};

const MY_NOVEL_SELECT =
  'id, slug, title, description, cover_image_url, status, review_status, review_note, is_published, category_id, updated_at, categories(name)';

/** Novels owned by an author (RLS also enforces ownership). */
export async function getMyNovels(authorId: string): Promise<MyNovel[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('novels')
    .select(MY_NOVEL_SELECT)
    .eq('author_id', authorId)
    .order('updated_at', { ascending: false });
  return (data ?? []) as unknown as MyNovel[];
}

/** A single novel owned by the author, or null. */
export async function getMyNovel(authorId: string, id: string): Promise<MyNovel | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('novels')
    .select(MY_NOVEL_SELECT)
    .eq('author_id', authorId)
    .eq('id', id)
    .maybeSingle();
  return (data as unknown as MyNovel) ?? null;
}

/** Lightweight list of the author's novels for select inputs. */
export async function getMyNovelOptions(authorId: string): Promise<{ id: string; title: string }[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('novels')
    .select('id, title')
    .eq('author_id', authorId)
    .order('updated_at', { ascending: false });
  return (data ?? []) as { id: string; title: string }[];
}

export type MyChapter = {
  id: string;
  novel_id: string;
  chapter_number: number;
  title: string;
  content: string;
  status: ChapterStatus;
  review_note: string | null;
  updated_at: string;
  novels: { title: string; slug: string } | null;
};

const MY_CHAPTER_SELECT =
  'id, novel_id, chapter_number, title, content, status, review_note, updated_at, novels(title, slug)';

/** All chapters across the author's novels (RLS enforces ownership). */
export async function getMyChapters(novelIds: string[]): Promise<MyChapter[]> {
  if (novelIds.length === 0) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('chapters')
    .select(MY_CHAPTER_SELECT)
    .in('novel_id', novelIds)
    .order('updated_at', { ascending: false });
  return (data ?? []) as unknown as MyChapter[];
}

export async function getMyChapter(novelIds: string[], id: string): Promise<MyChapter | null> {
  if (novelIds.length === 0) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('chapters')
    .select(MY_CHAPTER_SELECT)
    .in('novel_id', novelIds)
    .eq('id', id)
    .maybeSingle();
  return (data as unknown as MyChapter) ?? null;
}

export type AuthorStats = {
  totalNovels: number;
  publishedNovels: number;
  draftNovels: number;
  pendingNovels: number;
  totalChapters: number;
};

export function computeNovelStats(novels: MyNovel[]): Omit<AuthorStats, 'totalChapters'> {
  return {
    totalNovels: novels.length,
    publishedNovels: novels.filter((n) => n.review_status === 'published' || n.is_published).length,
    draftNovels: novels.filter((n) => n.review_status === 'draft').length,
    pendingNovels: novels.filter((n) => n.review_status === 'pending_review').length,
  };
}
