import { authorLevel } from '@/lib/author-level';

const STYLE: Record<number, string> = {
  1: 'bg-stone-100 text-stone-600',
  2: 'bg-sky-50 text-sky-700',
  3: 'bg-violet-50 text-violet-700',
  4: 'bg-amber-50 text-amber-700',
  5: 'bg-gradient-to-r from-amber-200 to-yellow-100 text-amber-800 ring-1 ring-amber-300',
};

/** Compact "LvN 名称" pill derived from cumulative views. */
export function AuthorLevelBadge({ totalViews }: { totalViews: number }) {
  const { level, name } = authorLevel(totalViews);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STYLE[level]}`}
    >
      <span className="font-semibold">Lv{level}</span>
      {name}
    </span>
  );
}
