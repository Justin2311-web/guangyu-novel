import Link from 'next/link';
import type { Category } from '@guangyu/database';

// Decorative icon per known category slug (falls back to the first char).
const ICONS: Record<string, string> = {
  xuanhuan: '🐉',
  dushi: '🏙️',
  xianxia: '⚔️',
  lishi: '📜',
  youxi: '🎮',
  kehuan: '🚀',
  xuanyi: '🕵️',
  nvsheng: '🌸',
};

export function CategoryGrid({ categories }: { categories: Category[] }) {
  if (categories.length === 0) {
    return <p className="text-sm text-stone-500">暂无分类。</p>;
  }
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/categories/${encodeURIComponent(c.slug)}`}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-stone-200 bg-white py-4 text-center transition hover:-translate-y-0.5 hover:border-brand hover:shadow-sm"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-xl">
            {ICONS[c.slug] ?? c.name.slice(0, 1)}
          </span>
          <span className="text-xs font-medium text-stone-700">{c.name}</span>
        </Link>
      ))}
    </div>
  );
}
