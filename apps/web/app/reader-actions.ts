'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import type { BookmarkToggleResult } from './reader-types';

/**
 * Record/refresh the current user's progress for a novel. No-op for
 * logged-out users. One row per (user, novel) — upsert keeps the latest
 * chapter and timestamp.
 */
export async function recordReadingProgressAction(
  novelId: string,
  chapterId: string,
): Promise<void> {
  const session = await getCurrentUser();
  if (!session || session.profile?.deleted_at) return; // only active logged-in users
  if (!novelId || !chapterId) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('reading_history').upsert(
    {
      user_id: session.user.id,
      novel_id: novelId,
      chapter_id: chapterId,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,novel_id' },
  ); // RLS: owner-only
}

/** Toggle a bookmark for the current user. Asks logged-out users to sign in. */
export async function toggleBookmarkAction(novelId: string): Promise<BookmarkToggleResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, needLogin: true };
  if (session.profile?.deleted_at) return { ok: false, error: '账户不可用。' };
  if (!novelId) return { ok: false, error: '参数无效。' };

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('novel_id', novelId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('bookmarks').delete().eq('id', existing.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/bookmarks');
    return { ok: true, bookmarked: false };
  }

  const { error } = await supabase
    .from('bookmarks')
    .insert({ user_id: session.user.id, novel_id: novelId });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/bookmarks');
  return { ok: true, bookmarked: true };
}
