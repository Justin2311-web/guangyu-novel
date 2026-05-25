import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCategories, getNovels, type NovelSort } from '@/lib/queries';
import { PosterCard } from '../../components/PosterCard';

export const dynamic = 'force-dynamic';

const TABS: { value: string; label: string; sort: NovelSort; finished?: boolean }[] = [
  { value: 'latest', label: '最新', sort: 'updated' },
  { value: 'popular', label: '人气', sort: 'popular' },
  { value: 'finished', label: '完结', sort: 'updated', finished: true },
  { value: 'new', label: '新书', sort: 'created' },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = (await getCategories()).find((c) => c.slug === decodeURIComponent(slug));
  if (!cat) return { title: '分类', robots: { index: false, follow: false } };
  return {
    title: `${cat.name}小说`,
    description: cat.description?.trim() || `浏览光羽小说「${cat.name}」分类下的全部作品。`,
    alternates: { canonical: `/categories/${encodeURIComponent(cat.slug)}` },
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const category = (await getCategories()).find((c) => c.slug === decoded);
  if (!category) notFound();

  const sp = await searchParams;
  const tabValue = TABS.some((t) => t.value === sp.tab) ? sp.tab! : 'latest';
  const tab = TABS.find((t) => t.value === tabValue)!;

  const novels = await getNovels({
    categorySlug: category.slug,
    sort: tab.sort,
    status: tab.finished ? 'completed' : undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-stone-500">
          <Link href="/categories" className="hover:text-brand">分类</Link>
          <span className="px-1.5">/</span>
          <span className="text-stone-700">{category.name}</span>
        </nav>
        <h1 className="mt-2 font-serif text-2xl font-bold text-stone-900">{category.name}</h1>
        {category.description && (
          <p className="mt-1 text-sm text-stone-500">{category.description}</p>
        )}
      </div>

      <div className="flex gap-2 border-b border-stone-200">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/categories/${encodeURIComponent(category.slug)}?tab=${t.value}`}
            className={
              t.value === tabValue
                ? '-mb-px border-b-2 border-brand px-3 py-2 text-sm font-medium text-brand'
                : 'px-3 py-2 text-sm text-stone-500 hover:text-brand'
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      {novels.length === 0 ? (
        <div className="gy-card px-4 py-16 text-center text-stone-500">
          {tab.finished ? '该分类暂无已完结作品。' : '该分类暂无作品。'}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {novels.map((n) => (
            <PosterCard key={n.id} novel={n} />
          ))}
        </div>
      )}
    </div>
  );
}
