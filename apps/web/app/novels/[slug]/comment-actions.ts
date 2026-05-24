'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { COMMENT_MIN_LENGTH, COMMENT_MAX_LENGTH } from '@guangyu/database';

export type CommentActionResult = { ok: true } | { ok: false; error: string };

/** Post a comment on a novel. Logged-in users only; content is validated + trimmed. */
export async function postCommentAction(
  novelId: string,
  novelSlug: string,
  rawContent: string,
): Promise<CommentActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: '请先登录后再评论。' };
  if (session.profile?.deleted_at || session.profile?.suspended) {
    return { ok: false, error: '账户不可用，无法评论。' };
  }
  if (!novelId) return { ok: false, error: '参数无效。' };

  const content = (rawContent ?? '').trim();
  if (content.length < COMMENT_MIN_LENGTH) return { ok: false, error: '评论至少需要 2 个字符。' };
  if (content.length > COMMENT_MAX_LENGTH) return { ok: false, error: '评论不能超过 500 个字符。' };

  const displayName =
    (session.profile?.display_name as string | null | undefined)?.trim() ||
    session.user.email?.split('@')[0] ||
    '读者';

  const supabase = await createSupabaseServerClient();
  // RLS "comments: owner insert" requires user_id = auth.uid().
  const { error } = await supabase.from('comments').insert({
    novel_id: novelId,
    user_id: session.user.id,
    user_display_name: displayName,
    content,
    status: 'visible',
  });
  if (error) return { ok: false, error: `评论失败：${error.message}` };

  revalidatePath(`/novels/${novelSlug}`);
  return { ok: true };
}

/** Soft-delete the caller's own comment (status -> 'deleted'). */
export async function deleteCommentAction(
  commentId: string,
  novelSlug: string,
): Promise<CommentActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: '请先登录。' };
  if (!commentId) return { ok: false, error: '参数无效。' };

  const supabase = await createSupabaseServerClient();
  // RLS "comments: owner update visible" scopes this to the caller's own
  // visible comment; .eq(user_id) is belt-and-suspenders.
  const { data, error } = await supabase
    .from('comments')
    .update({ status: 'deleted' })
    .eq('id', commentId)
    .eq('user_id', session.user.id)
    .select('id');
  if (error) return { ok: false, error: `删除失败：${error.message}` };
  if (!data || data.length === 0) return { ok: false, error: '无法删除该评论。' };

  revalidatePath(`/novels/${novelSlug}`);
  return { ok: true };
}
