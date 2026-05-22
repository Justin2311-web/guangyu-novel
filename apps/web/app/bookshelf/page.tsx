import Link from 'next/link';
import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/supabase/server';
import { getReadingList, getBookmarksDetailed, type ShelfItem } from '@/lib/queries';
import { ShelfCard } from './ShelfCard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '我的书架' };

type Tab = 'continue' | 'bookmarks' | 'history';

const TABS: { key: Tab; label: string }[] = [
  { key: 'continue', label: '继续阅读' },
  { key: 'bookmarks', label: '收藏' },
  { key: 'history', label: '阅读历史' },
];

export default async function BookshelfPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getCurrentUser();

  if (!session) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">我的书架</h1>
        <p className="text-stone-600">登录后即可使用书架、收藏与阅读进度。</p>
        <Link
          href="/login?next=/bookshelf"
          className="inline-flex rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          去登录
        </Link>
      </section>
    );
  }

  const sp = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === sp.tab) ? (sp.tab as Tab) : 'continue';

  // Fetch both lists (small per-user data); pick what each tab needs.
  const [history, bookmarks] = await Promise.all([getReadingList(), getBookmarksDetailed()]);

  let items: ShelfItem[];
  let emptyText: string;
  if (tab === 'bookmarks') {
    items = bookmarks;
    emptyText = '还没有收藏。浏览书库，点击「☆ 收藏」即可加入。';
  } else if (tab === 'history') {
    items = history;
    emptyText = '还没有阅读历史。打开任意章节即可开始记录。';
  } else {
    // continue: in-progress novels (not yet finished)
    items = history.filter((i) => !i.progress || i.progress.percent < 100);
    emptyText = '没有正在阅读的小说。去书库挑一本开始吧。';
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">我的书架</h1>
        <span className="text-sm text-stone-500">收藏 {bookmarks.length} · 在读 {history.length}</span>
      </div>

      <div className="flex gap-2 border-b border-stone-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/bookshelf?tab=${t.key}`}
            className={
              t.key === tab
                ? '-mb-px border-b-2 border-brand px-3 py-2 text-sm font-medium text-brand'
                : 'px-3 py-2 text-sm text-stone-500 hover:text-brand'
            }
          >
            {t.label}
            {t.key === 'bookmarks' && bookmarks.length > 0 ? ` (${bookmarks.length})` : ''}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-12 text-center text-stone-500">
          {emptyText}
          <div className="mt-3">
            <Link href="/novels" className="text-brand hover:underline">
              前往书库
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <ShelfCard key={item.novelSlug} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
