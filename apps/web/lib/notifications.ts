import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { NotificationType } from '@guangyu/database';

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  targetUrl: string | null;
  isRead: boolean;
  createdAt: string;
};

/** The current user's notifications, newest first. RLS scopes to auth.uid(). */
export async function getNotifications(onlyUnread = false): Promise<NotificationItem[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('notifications')
    .select('id, type, title, body, target_url, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (onlyUnread) query = query.is('read_at', null);
  const { data } = await query;

  type Row = {
    id: string;
    type: NotificationType;
    title: string;
    body: string | null;
    target_url: string | null;
    read_at: string | null;
    created_at: string;
  };
  return ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    targetUrl: r.target_url,
    isRead: r.read_at != null,
    createdAt: r.created_at,
  }));
}

/** Count of unread notifications for the current user (0 when logged out). */
export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);
  return count ?? 0;
}
