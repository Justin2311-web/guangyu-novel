import Link from 'next/link';
import { NOVEL_SERIAL_STATUS_LABELS } from '@guangyu/database';
import type { NovelListItem } from '@/lib/queries';

export function NovelCard({ novel }: { novel: NovelListItem }) {
  return (
    <Link
      href={`/novels/${encodeURIComponent(novel.slug)}`}
      className="flex gap-4 rounded-xl border border-stone-200 bg-white p-4 transition hover:border-brand"
    >
      <div className="h-28 w-20 shrink-0 overflow-hidden rounded-md bg-stone-100">
        {novel.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={novel.cover_image_url}
            alt={novel.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
            无封面
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-medium text-stone-800">{novel.title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
          <span>{novel.authors?.pen_name ?? '佚名'}</span>
          {novel.categories?.name && (
            <span className="rounded bg-stone-100 px-1.5 py-0.5">{novel.categories.name}</span>
          )}
          <span>{NOVEL_SERIAL_STATUS_LABELS[novel.status]}</span>
        </div>
        {novel.description && (
          <p className="mt-2 line-clamp-2 text-sm text-stone-500">{novel.description}</p>
        )}
      </div>
    </Link>
  );
}
