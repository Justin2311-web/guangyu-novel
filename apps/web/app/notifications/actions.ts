'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';

export type NotificationActionResult = { ok: true } | { ok: false; error: string };

/** Mark a single notification read (owner-scoped by RLS + explicit user filter). */
export async function markNotificationReadAction(id: string): Promise<NotificationActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: '请先登录。' };
  if (!id) return { ok: false, error: '参数无效。' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', session.user.id)
    .is('read_at', null);
  if (error) return { ok: false, error: `操作失败：${error.message}` };

  revalidatePath('/notifications');
  return { ok: true };
}

/** Mark every unread notification of the current user read. */
export async function markAllNotificationsReadAction(): Promise<NotificationActionResult> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: '请先登录。' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', session.user.id)
    .is('read_at', null);
  if (error) return { ok: false, error: `操作失败：${error.message}` };

  revalidatePath('/notifications');
  return { ok: true };
}
