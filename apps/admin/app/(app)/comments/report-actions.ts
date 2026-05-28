'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentAdminUser } from '@/lib/supabase/server';
import { canManageContent, type CommentReportStatus } from '@guangyu/database';

export type ReportActionResult = { ok: true } | { ok: false; error: string };

/**
 * Close all OPEN reports on a comment with the given terminal status.
 * `resolved` = report led to a moderation action; `dismissed` = ignored.
 * Admin-only via RLS `comment_reports: admin all`.
 */
export async function closeReportsForCommentAction(
  commentId: string,
  status: Exclude<CommentReportStatus, 'open'>,
): Promise<ReportActionResult> {
  const session = await getCurrentAdminUser();
  if (!session) return { ok: false, error: '会话失效，请重新登录。' };
  if (!canManageContent(session.profile.role)) {
    return { ok: false, error: '没有评论管理权限。' };
  }
  if (!commentId) return { ok: false, error: '参数无效。' };
  if (status !== 'resolved' && status !== 'dismissed') {
    return { ok: false, error: '参数无效。' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('comment_reports')
    .update({
      status,
      resolved_by: session.user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq('comment_id', commentId)
    .eq('status', 'open');
  if (error) return { ok: false, error: `数据库错误：${error.message}` };

  revalidatePath('/comments');
  return { ok: true };
}
