import Link from 'next/link';
import { NOVEL_SERIAL_STATUS_LABELS } from '@guangyu/database';
import type { NovelListItem } from '@/lib/queries';

/** Vertical "poster" card for grids (recommended, library). */
export function PosterCard({ novel }: { novel: NovelListItem }) {
  return (
    <Link href={`/novels/${encodeURIComponent(novel.slug)}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-stone-200 bg-gradient-to-br from-amber-100 to-stone-100 shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-md">
        {novel.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={novel.cover_image_url}
            alt={novel.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-2 text-center font-serif text-lg text-brand/50">
            {novel.title}
          </div>
        )}
        <span className="absolute left-2 top-2 rounded bg-black/45 px-1.5 py-0.5 text-[11px] text-white backdrop-blur">
          {NOVEL_SERIAL_STATUS_LABELS[novel.status]}
        </span>
      </div>
      <h3 className="mt-2 truncate font-serif text-sm font-medium text-stone-800 group-hover:text-brand">
        {novel.title}
      </h3>
      <p className="truncate text-xs text-stone-500">
        {novel.authors?.pen_name ?? '佚名'}
        {novel.categories?.name ? ` · ${novel.categories.name}` : ''}
      </p>
    </Link>
  );
}
