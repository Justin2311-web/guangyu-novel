'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toggleBookmarkAction } from '@/app/reader-actions';

export function BookmarkButton({
  novelId,
  isLoggedIn,
  initialBookmarked,
}: {
  novelId: string;
  isLoggedIn: boolean;
  initialBookmarked: boolean;
}) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!isLoggedIn) {
      router.push('/login?next=' + encodeURIComponent(window.location.pathname));
      return;
    }
    setError(undefined);
    const previous = bookmarked;
    setBookmarked(!previous); // optimistic
    startTransition(async () => {
      const res = await toggleBookmarkAction(novelId);
      if (!res.ok) {
        setBookmarked(previous);
        if (res.needLogin) router.push('/login');
        else setError(res.error ?? '操作失败，请重试。');
      } else {
        setBookmarked(!!res.bookmarked);
      }
    });
  }

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={bookmarked}
        className={
          bookmarked
            ? 'inline-flex items-center gap-1 rounded-md border border-brand bg-brand/5 px-4 py-2 text-sm font-medium text-brand disabled:opacity-60'
            : 'inline-flex items-center gap-1 rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:border-brand hover:text-brand disabled:opacity-60'
        }
      >
        {bookmarked ? '★ 已收藏' : '☆ 收藏'}
      </button>
      {error && <span className="mt-1 text-xs text-red-600">{error}</span>}
    </span>
  );
}
