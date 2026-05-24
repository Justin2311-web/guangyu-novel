import Link from 'next/link';
import { NOVEL_SERIAL_STATUS_LABELS } from '@guangyu/database';
import type { RankingNovel } from '@/lib/queries';

const RANK_COLOR: Record<number, string> = {
  1: 'bg-amber-400 text-white',
  2: 'bg-stone-300 text-white',
  3: 'bg-orange-300 text-white',
};

/** A single ranked novel row used by the discovery / ranking pages. */
export function RankingRow({
  rank,
  novel,
  metric,
}: {
  rank: number;
  novel: RankingNovel;
  metric?: 'views' | 'bookmarks';
}) {
  const href = `/novels/${encodeURIComponent(novel.slug)}`;
  const metricValue =
    metric === 'bookmarks'
      ? `${(novel.bookmarkCount ?? 0).toLocaleString()} 收藏`
      : `${novel.viewCount.toLocaleString()} 阅读`;

  return (
    <li className="flex gap-4 px-4 py-3">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-full text-sm font-bold ${
          RANK_COLOR[rank] ?? 'bg-stone-100 text-stone-500'
        }`}
      >
        {rank}
      </span>

      <Link href={href} className="h-24 w-16 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-amber-100 to-stone-100">
        {novel.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={novel.cover_image_url} alt={novel.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-1 text-center font-serif text-xs text-brand/50">
            {novel.title}
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href={href} className="truncate font-serif font-medium text-stone-800 hover:text-brand">
            {novel.title}
          </Link>
          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-500">
            {NOVEL_SERIAL_STATUS_LABELS[novel.status]}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-stone-500">
          {novel.authors?.slug ? (
            <Link href={`/authors/${encodeURIComponent(novel.authors.slug)}`} className="hover:text-brand">
              {novel.authors.pen_name}
            </Link>
          ) : (
            (novel.authors?.pen_name ?? '佚名')
          )}
          {novel.categories?.name ? ` · ${novel.categories.name}` : ''}
        </div>
        {novel.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500">{novel.description}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-stone-400">
          <span className="text-brand-dark">{metricValue}</span>
          <span>{novel.chapterCount} 章</span>
          <Link href={href} className="text-brand hover:underline">
            开始阅读 →
          </Link>
        </div>
      </div>
    </li>
  );
}
