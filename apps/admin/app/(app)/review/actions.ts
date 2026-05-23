'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentAdminUser } from '@/lib/supabase/server';
import { canManageContent } from '@guangyu/database';
import type { ReviewActionResult } from './types';

async function requireReviewer() {
  const session = await getCurrentAdminUser();
  if (!session) return { ok: false as const, error: '会话失效，请重新登录。' };
  if (!canManageContent(session.profile.role)) {
    return { ok: false as const, error: '没有审核权限。' };
  }
  return { ok: true as const };
}

function revalidateReview() {
  revalidatePath('/review/novels');
  revalidatePath('/review/chapters');
}

/** Approve a novel → published + publicly visible. */
export async function approveNovelAction(id: string): Promise<ReviewActionResult> {
  const guard = await requireReviewer();
  if (!guard.ok) return guard;
  if (!id) return { ok: false, error: '参数无效。' };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('novels')
    .update({ review_status: 'published', is_published: true, review_note: null })
    .eq('id', id)
    .select('id'); // RLS "novels: admin all"
  if (error) return { ok: false, error: `数据库错误：${error.code ?? ''} ${error.message}` };
  if (!data || data.length === 0) return { ok: false, error: '更新未生效（影响 0 行）。' };

  revalidateReview();
  return { ok: true };
}

/** Reject a novel with a reason → not published, reason stored. */
export async function rejectNovelAction(id: string, note: string): Promise<ReviewActionResult> {
  const guard = await requireReviewer();
  if (!guard.ok) return guard;
  if (!id) return { ok: false, error: '参数无效。' };
  const reason = note.trim();
  if (!reason) return { ok: false, error: '请填写拒绝原因。' };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('novels')
    .update({ review_status: 'rejected', is_published: false, review_note: reason })
    .eq('id', id)
    .select('id');
  if (error) return { ok: false, error: `数据库错误：${error.code ?? ''} ${error.message}` };
  if (!data || data.length === 0) return { ok: false, error: '更新未生效（影响 0 行）。' };

  revalidateReview();
  return { ok: true };
}

/** Approve a chapter → published (publicly visible if the novel is published). */
export async function approveChapterAction(id: string): Promise<ReviewActionResult> {
  const guard = await requireReviewer();
  if (!guard.ok) return guard;
  if (!id) return { ok: false, error: '参数无效。' };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('chapters')
    .update({ status: 'published', review_note: null })
    .eq('id', id)
    .select('id'); // RLS "chapters: admin all"
  if (error) return { ok: false, error: `数据库错误：${error.code ?? ''} ${error.message}` };
  if (!data || data.length === 0) return { ok: false, error: '更新未生效（影响 0 行）。' };

  revalidateReview();
  return { ok: true };
}

/** Reject a chapter with a reason. */
export async function rejectChapterAction(id: string, note: string): Promise<ReviewActionResult> {
  const guard = await requireReviewer();
  if (!guard.ok) return guard;
  if (!id) return { ok: false, error: '参数无效。' };
  const reason = note.trim();
  if (!reason) return { ok: false, error: '请填写拒绝原因。' };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('chapters')
    .update({ status: 'rejected', review_note: reason })
    .eq('id', id)
    .select('id');
  if (error) return { ok: false, error: `数据库错误：${error.code ?? ''} ${error.message}` };
  if (!data || data.length === 0) return { ok: false, error: '更新未生效（影响 0 行）。' };

  revalidateReview();
  return { ok: true };
}
