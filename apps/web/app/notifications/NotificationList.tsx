'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { NotificationItem } from '@/lib/notifications';
import { markNotificationReadAction, markAllNotificationsReadAction } from './actions';

export function NotificationList({
  items,
  hasUnread,
}: {
  items: NotificationItem[];
  hasUnread: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function open(n: NotificationItem) {
    setError(undefined);
    startTransition(async () => {
      if (!n.isRead) await markNotificationReadAction(n.id);
      if (n.targetUrl) router.push(n.targetUrl);
      else router.refresh();
    });
  }

  function markOneRead(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setError(undefined);
    startTransition(async () => {
      const res = await markNotificationReadAction(id);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  function markAll() {
    setError(undefined);
    startTransition(async () => {
      const res = await markAllNotificationsReadAction();
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  if (items.length === 0) {
    return (
      <div className="gy-card px-4 py-16 text-center text-sm text-stone-500">暂无通知</div>
    );
  }

  return (
    <div className="space-y-3">
      {hasUnread && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={markAll}
            disabled={pending}
            className="text-sm text-brand hover:underline disabled:opacity-50"
          >
            全部标记为已读
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="gy-card divide-y divide-stone-100">
        {items.map((n) => (
          <li
            key={n.id}
            onClick={() => open(n)}
            className={`flex cursor-pointer gap-3 px-4 py-3 transition hover:bg-amber-50/60 ${
              n.isRead ? '' : 'bg-amber-50/40'
            }`}
          >
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                n.isRead ? 'bg-transparent' : 'bg-brand'
              }`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className={`truncate text-sm ${n.isRead ? 'text-stone-600' : 'font-medium text-stone-800'}`}>
                  {n.title}
                </span>
                <span className="shrink-0 text-xs text-stone-400">{n.createdAt.slice(0, 10)}</span>
              </div>
              {n.body && (
                <p className="mt-0.5 line-clamp-2 break-words text-xs leading-relaxed text-stone-500">
                  {n.body}
                </p>
              )}
            </div>
            {!n.isRead && (
              <button
                type="button"
                onClick={(e) => markOneRead(e, n.id)}
                disabled={pending}
                className="shrink-0 self-center text-xs text-stone-400 hover:text-brand disabled:opacity-50"
              >
                标记已读
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
