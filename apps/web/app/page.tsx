import Link from 'next/link';
import { getCategories } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <section className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-10 text-white shadow-sm">
        <h1 className="text-3xl font-semibold">欢迎来到 光羽小说</h1>
        <p className="mt-3 max-w-xl text-white/90">
          阅读优质中文小说。后续阶段将接入推荐、最新更新与作者后台等功能。
        </p>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">分类</h2>
          <Link href="/categories" className="text-sm text-brand hover:underline">
            查看全部
          </Link>
        </div>
        {categories.length === 0 ? (
          <p className="text-sm text-stone-500">暂无分类。</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/novels?category=${encodeURIComponent(c.slug)}`}
                className="rounded-full border border-stone-200 bg-white px-4 py-1.5 text-sm text-stone-700 transition hover:border-brand hover:text-brand"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {['推荐作品', '最新更新', '热门小说'].map((title) => (
          <div key={title} className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-medium">{title}</h2>
            <p className="mt-2 text-sm text-stone-500">数据将在后续阶段接入。</p>
          </div>
        ))}
      </div>
    </section>
  );
}
