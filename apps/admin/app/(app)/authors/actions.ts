'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentAdminUser } from '@/lib/supabase/server';
import { canManageContent } from '@guangyu/database';
import type { ReviewResult } from './types';

const VALID = ['approved', 'rejected', 'revision_requested'];

export async function reviewApplicationAction(
  id: string,
  status: string,
  note: string,
): Promise<ReviewResult> {
  const session = await getCurrentAdminUser();
  if (!session || !canManageContent(session.profile.role)) {
    return { ok: false, error: '没有权限审核申请。' };
  }
  if (!id || !VALID.includes(status)) return { ok: false, error: '参数无效。' };
  if ((status === 'rejected' || status === 'revision_requested') && !note.trim()) {
    return { ok: false, error: '请填写备注说明。' };
  }

  const supabase = await createSupabaseServerClient();
  // Security-definer RPC performs the role promotion + author profile creation
  // atomically and enforces its own admin/superadmin + safety checks.
  const { error } = await supabase.rpc('review_author_application', {
    p_app_id: id,
    p_status: status,
    p_note: note.trim() || null,
  });

  if (error) return { ok: false, error: `操作失败：${error.code ?? ''} ${error.message}` };

  revalidatePath('/authors');
  return { ok: true };
}
