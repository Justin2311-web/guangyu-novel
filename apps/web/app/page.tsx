import Link from 'next/link';
import { getCurrentUser } from '@/lib/supabase/server';
import {
  getActiveBanners,
  getCategories,
  getReadingList,
  getLatestNovels,
  getSiteSettings,
} from '@/lib/queries';
import { NovelCard } from './novels/NovelCard';
import { HomeBanners } from './HomeBanners';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [banners, categories, latest, settings, session] = await Promise.all([
    getActiveBanners(),
    getCategories(),
    getLatestNovels(6),
    getSiteSettings(),
    getCurrentUser(),
  ]);
  const recentlyRead = session ? await getReadingList(5) : [];

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

      <form method="get" action="/novels" className="flex gap-2">
        <input
          type="text"
          name="q"
          placeholder="搜索书名、作者、分类…"
          className="flex-1 rounded-md border border-stone-300 px-4 py-2 text-sm focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          搜索
        </button>
      </form>

      {session && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold">最近阅读</h2>
            <Link href="/bookshelf" className="text-sm text-brand hover:underline">
              我的书架
            </Link>
          </div>
          {recentlyRead.length === 0 ? (
            <p className="text-sm text-stone-500">还没有阅读记录，去书库挑一本开始吧。</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recentlyRead.map((item) => (
                <Link
                  key={item.novelSlug}
                  href={
                    item.progress
                      ? `/novels/${item.novelSlug}/${item.progress.chapterNumber}`
                      : `/novels/${item.novelSlug}`
                  }
                  className="rounded-lg border border-stone-200 bg-white p-4 transition hover:border-brand"
                >
                  <div className="truncate font-medium text-stone-800">{item.novelTitle}</div>
                  <div className="mt-1 text-sm text-stone-500">
                    {item.progress
                      ? `第 ${item.progress.chapterNumber} 章 / 共 ${item.progress.total} 章 · ${item.progress.percent}%`
                      : '继续阅读'}
                  </div>
                </Link>
              ))}
            </div>
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
