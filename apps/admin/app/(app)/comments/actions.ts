'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentAdminUser } from '@/lib/supabase/server';
import { canManageContent, type CommentStatus } from '@guangyu/database';

export type CommentModerationResult = { ok: true } | { ok: false; error: string };

async function requireModerator() {
  const session = await getCurrentAdminUser();
  if (!session) return { ok: false as const, error: '会话失效，请重新登录。' };
  if (!canManageContent(session.profile.role)) {
    return { ok: false as const, error: '没有评论管理权限。' };
  }
  return { ok: true as const };
}

async function setStatus(id: string, status: CommentStatus): Promise<CommentModerationResult> {
  const guard = await requireModerator();
  if (!guard.ok) return guard;
  if (!id) return { ok: false, error: '参数无效。' };

  const supabase = await createSupabaseServerClient();
  // RLS "comments: admin all" authorizes this update for admin/superadmin.
  const { data, error } = await supabase
    .from('comments')
    .update({ status })
    .eq('id', id)
    .select('id, novels(slug)');
  if (error) return { ok: false, error: `数据库错误：${error.code ?? ''} ${error.message}` };
  if (!data || data.length === 0) return { ok: false, error: '更新未生效（影响 0 行）。' };

  revalidatePath('/comments');
  // Best-effort: refresh the affected novel page on the reader app's domain
  // is out of scope (cross-app), but revalidating the same path here keeps
  // the admin list and any same-domain caches fresh.
  const novelSlug = (data[0] as { novels?: { slug?: string } | null })?.novels?.slug;
  if (novelSlug) revalidatePath(`/novels/${novelSlug}`);
  return { ok: true };
}

/** Hide a comment from the public list. */
export async function hideCommentAction(id: string): Promise<CommentModerationResult> {
  return setStatus(id, 'hidden');
}
/** Restore a hidden/deleted comment to visible. */
export async function restoreCommentAction(id: string): Promise<CommentModerationResult> {
  return setStatus(id, 'visible');
}
/** Soft-delete a comment (kept in DB, never shown publicly). */
export async function deleteCommentAction(id: string): Promise<CommentModerationResult> {
  return setStatus(id, 'deleted');
}
