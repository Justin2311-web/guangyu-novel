import Link from 'next/link';
import { NOVEL_SERIAL_STATUS_LABELS } from '@guangyu/database';
import type { NovelListItem } from '@/lib/queries';

export function NovelCard({ novel }: { novel: NovelListItem }) {
  return (
    <Link
      href={`/novels/${encodeURIComponent(novel.slug)}`}
      className="gy-card flex gap-4 p-4 hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
    >
      <div className="h-28 w-20 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-amber-100 to-stone-100">
        {novel.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={novel.cover_image_url}
            alt={novel.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-serif text-2xl text-brand/40">
            {novel.title.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-serif text-base font-semibold text-stone-800">{novel.title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
          <span>{novel.authors?.pen_name ?? '佚名'}</span>
          {novel.categories?.name && (
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-brand-dark">
              {novel.categories.name}
            </span>
          )}
          <span className="rounded bg-stone-100 px-1.5 py-0.5">
            {NOVEL_SERIAL_STATUS_LABELS[novel.status]}
          </span>
        </div>
        {novel.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-500">
            {novel.description}
          </p>
        )}
      </div>
    </Link>
  );
}
