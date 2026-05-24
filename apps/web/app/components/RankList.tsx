import Link from 'next/link';
import type { NovelListItem } from '@/lib/queries';

const MEDAL = ['bg-brand text-white', 'bg-amber-400 text-white', 'bg-amber-300 text-white'];

export function RankList({ novels }: { novels: NovelListItem[] }) {
  if (novels.length === 0) {
    return <p className="text-sm text-stone-500">暂无排行数据。</p>;
  }
  return (
    <ol className="gy-card divide-y divide-stone-100 overflow-hidden">
      {novels.map((n, i) => (
        <li key={n.id}>
          <Link
            href={`/novels/${encodeURIComponent(n.slug)}`}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50/60"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold ${
                MEDAL[i] ?? 'bg-stone-100 text-stone-500'
              }`}
            >
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800">
              {n.title}
            </span>
            <span className="shrink-0 truncate text-xs text-stone-400">
              {n.authors?.pen_name ?? '佚名'}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
