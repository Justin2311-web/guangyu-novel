import Link from 'next/link';
import { getNovels, getCategories } from '@/lib/queries';
import { NovelCard } from './NovelCard';

export const dynamic = 'force-dynamic';

export const metadata = { title: '小说' };

export default async function NovelsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [novels, categories] = await Promise.all([getNovels(category), getCategories()]);
  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">小说书库</h1>
        {activeCategory && (
          <p className="mt-1 text-sm text-stone-500">分类：{activeCategory.name}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/novels"
          className={`rounded-full border px-3 py-1 text-sm ${
            !category ? 'border-brand text-brand' : 'border-stone-200 text-stone-600'
          }`}
        >
          全部
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/novels?category=${encodeURIComponent(c.slug)}`}
            className={`rounded-full border px-3 py-1 text-sm ${
              category === c.slug ? 'border-brand text-brand' : 'border-stone-200 text-stone-600'
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {novels.length === 0 ? (
        <p className="text-stone-500">暂无已发布的小说。</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {novels.map((n) => (
            <NovelCard key={n.id} novel={n} />
          ))}
        </div>
      )}
    </div>
  );
}
