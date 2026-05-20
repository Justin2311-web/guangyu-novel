import Link from 'next/link';
import { getCategories } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export const metadata = { title: '分类' };

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">全部分类</h1>
      {categories.length === 0 ? (
        <p className="text-stone-500">暂无分类。</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/novels?category=${encodeURIComponent(c.slug)}`}
              className="rounded-xl border border-stone-200 bg-white p-5 transition hover:border-brand"
            >
              <h2 className="text-lg font-medium text-stone-800">{c.name}</h2>
              {c.description && <p className="mt-1 text-sm text-stone-500">{c.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
