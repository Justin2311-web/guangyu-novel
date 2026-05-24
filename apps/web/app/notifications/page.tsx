import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getNotifications } from '@/lib/notifications';
import { NotificationList } from './NotificationList';

export const dynamic = 'force-dynamic';

export const metadata = { title: '通知' };

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getCurrentUser();
  if (!session) redirect('/login?next=/notifications');

  const tab = (await searchParams).tab === 'unread' ? 'unread' : 'all';
  const items = await getNotifications(tab === 'unread');

  const TabLink = ({ value, label }: { value: string; label: string }) => (
    <Link
      href={`/notifications?tab=${value}`}
      className={
        value === tab
          ? '-mb-px border-b-2 border-brand px-3 py-2 text-sm font-medium text-brand'
          : 'px-3 py-2 text-sm text-stone-500 hover:text-brand'
      }
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-2xl font-bold text-stone-900">通知中心</h1>

      <div className="flex gap-2 border-b border-stone-200">
        <TabLink value="all" label="全部" />
        <TabLink value="unread" label="未读" />
      </div>

      <NotificationList items={items} hasUnread={items.some((n) => !n.isRead)} />
    </div>
  );
}
