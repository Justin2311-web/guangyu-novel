import Link from 'next/link';
import { getActiveBanners, getCategories, getLatestNovels, getSiteSettings } from '@/lib/queries';
import { NovelCard } from './novels/NovelCard';
import { HomeBanners } from './HomeBanners';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [banners, categories, latest, settings] = await Promise.all([
    getActiveBanners(),
    getCategories(),
    getLatestNovels(6),
    getSiteSettings(),
  ]);

  return (
    <section className="space-y-8">
      {banners.length > 0 ? (
        <HomeBanners banners={banners} />
      ) : (
        <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-10 text-white shadow-sm">
          <h1 className="text-3xl font-semibold">{settings['home.hero_title']}</h1>
          {settings['home.hero_subtitle'] && (
            <p className="mt-3 max-w-xl text-white/90">{settings['home.hero_subtitle']}</p>
          )}
          {settings['home.hero_cta_text'] && settings['home.hero_cta_link'] && (
            <Link
              href={settings['home.hero_cta_link']}
              className="mt-5 inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-brand hover:bg-white/90"
            >
              {settings['home.hero_cta_text']}
            </Link>
          )}
        </div>
      )}

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

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">最新作品</h2>
          <Link href="/novels" className="text-sm text-brand hover:underline">
            进入书库
          </Link>
        </div>
        {latest.length === 0 ? (
          <p className="text-sm text-stone-500">暂无已发布的小说。</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {latest.map((n) => (
              <NovelCard key={n.id} novel={n} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
