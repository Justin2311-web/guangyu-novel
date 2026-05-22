import Link from 'next/link';
import type { ShelfItem } from '@/lib/queries';

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

export function ShelfCard({ item }: { item: ShelfItem }) {
  const href = item.progress
    ? `/novels/${item.novelSlug}/${item.progress.chapterNumber}`
    : `/novels/${item.novelSlug}`;

  return (
    <div className="flex gap-4 rounded-lg border border-stone-200 bg-white p-4">
      <Link href={`/novels/${item.novelSlug}`} className="shrink-0">
        <div className="h-28 w-20 overflow-hidden rounded-md bg-stone-100">
          {item.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.coverImageUrl} alt={item.novelTitle} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
              无封面
            </div>
          )}
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={`/novels/${item.novelSlug}`}
          className="truncate font-medium text-stone-800 hover:text-brand"
        >
          {item.novelTitle}
        </Link>
        <div className="mt-0.5 truncate text-sm text-stone-500">
          {item.authorName ?? '佚名'} · {item.categoryName ?? '未分类'}
        </div>

        {item.progress ? (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>
                第 {item.progress.chapterNumber} 章 / 共 {item.progress.total} 章
              </span>
              <span>{item.progress.percent}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-brand" style={{ width: `${item.progress.percent}%` }} />
            </div>
          </div>
        ) : (
          <div className="mt-2 text-xs text-stone-400">尚未开始阅读</div>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          {formatDate(item.lastReadAt) ? (
            <span className="text-xs text-stone-400">最近阅读 {formatDate(item.lastReadAt)}</span>
          ) : (
            <span />
          )}
          <Link
            href={href}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:border-brand hover:text-brand"
          >
            {item.progress ? `继续阅读 · 第 ${item.progress.chapterNumber} 章` : '开始阅读'}
          </Link>
        </div>
      </div>
    </div>
  );
}
