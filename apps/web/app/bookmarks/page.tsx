import Link from 'next/link';
import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/supabase/server';
import { getBookmarks } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: '我的收藏' };

export default async function BookmarksPage() {
  const session = await getCurrentUser();

  if (!session) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">我的收藏</h1>
        <p className="text-stone-600">登录后即可收藏喜欢的小说。</p>
        <Link
          href="/login?next=/bookmarks"
          className="inline-flex rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          去登录
        </Link>
      </section>
    );
  }

  const bookmarks = await getBookmarks();

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">我的收藏</h1>

      {bookmarks.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-10 text-center text-stone-500">
          还没有收藏。浏览书库，点击「☆ 收藏」即可加入。
          <div className="mt-3">
            <Link href="/novels" className="text-brand hover:underline">
              前往书库
            </Link>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white">
          {bookmarks.map((b) => (
            <li key={b.novelSlug} className="flex items-center justify-between gap-4 px-4 py-4">
              <div className="min-w-0">
                <Link href={`/novels/${b.novelSlug}`} className="font-medium text-stone-800 hover:text-brand">
                  {b.novelTitle}
                </Link>
                <div className="mt-0.5 text-sm text-stone-500">
                  {b.authorName ?? '佚名'} · {b.categoryName ?? '未分类'}
                </div>
              </div>
              {b.continueChapterNumber ? (
                <Link
                  href={`/novels/${b.novelSlug}/${b.continueChapterNumber}`}
                  className="shrink-0 rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:border-brand hover:text-brand"
                >
                  继续阅读 · 第 {b.continueChapterNumber} 章
                </Link>
              ) : (
                <Link
                  href={`/novels/${b.novelSlug}`}
                  className="shrink-0 rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:border-brand hover:text-brand"
                >
                  查看详情
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
