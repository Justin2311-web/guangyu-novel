'use server';

import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import {
  COMMENT_REPORT_DETAILS_MAX,
  COMMENT_REPORT_REASONS,
  type CommentReportReason,
} from '@guangyu/database';

export type CommentReportResult = { ok: true } | { ok: false; error: string };

/**
 * File a report against a (visible) comment. RLS policy
 * `comment_reports: reporter insert` enforces `reporter_id = auth.uid()`.
 * A partial unique index on (comment_id, reporter_id) WHERE status='open'
 * prevents duplicate open reports from the same user; we surface that as a
 * friendly message.
 */
export async function reportCommentAction(
  commentId: string,
  reason: string,
  rawDetails: string,
): Promise<CommentReportResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: '请先登录后再举报评论。' };
  if (session.profile?.deleted_at || session.profile?.suspended) {
    return { ok: false, error: '账户不可用，无法举报。' };
  }
  if (!commentId) return { ok: false, error: '参数无效。' };

  if (!(COMMENT_REPORT_REASONS as readonly string[]).includes(reason)) {
    return { ok: false, error: '请选择有效的举报理由。' };
  }
  const details = (rawDetails ?? '').trim().slice(0, COMMENT_REPORT_DETAILS_MAX) || null;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('comment_reports').insert({
    comment_id: commentId,
    reporter_id: session.user.id,
    reason: reason as CommentReportReason,
    details,
    status: 'open',
  });

  if (error) {
    // 23505 = unique_violation → user already has an open report on this comment.
    if (error.code === '23505') {
      return { ok: false, error: '你已举报过此评论，等待管理员处理。' };
    }
    return { ok: false, error: `举报失败：${error.message}` };
  }
  return { ok: true };
}
