import Link from 'next/link';
import { getCurrentUser } from '@/lib/supabase/server';
import {
  getActiveBanners,
  getCategories,
  getFeaturedNovels,
  getLatestNovels,
  getPopularNovels,
  getReadingList,
  getSiteSettings,
  getTopAuthors,
  type NovelListItem,
} from '@/lib/queries';
import { NovelCard } from './novels/NovelCard';
import { HomeBanners } from './HomeBanners';
import { SectionHeader } from './components/SectionHeader';
import { PosterCard } from './components/PosterCard';
import { CategoryGrid } from './components/CategoryGrid';
import { RankList } from './components/RankList';
import { AuthorAvatar } from './components/AuthorAvatar';
import { AuthorLevelBadge } from './components/AuthorLevelBadge';

export const dynamic = 'force-dynamic';

function FeaturedHero({ novel }: { novel: NovelListItem }) {
  return (
    <div className="gy-card overflow-hidden border-amber-100 bg-gradient-to-br from-amber-50 to-white">
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <Link
          href={`/novels/${encodeURIComponent(novel.slug)}`}
          className="mx-auto h-52 w-36 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-amber-100 to-stone-100 shadow-md sm:mx-0"
        >
          {novel.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={novel.cover_image_url} alt={novel.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-3 text-center font-serif text-xl text-brand/50">
              {novel.title}
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <span className="inline-block rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand-dark">
            本期推荐
          </span>
          <h1 className="mt-2 font-serif text-2xl font-bold text-stone-900">{novel.title}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {novel.authors?.pen_name ?? '佚名'}
            {novel.categories?.name ? ` · ${novel.categories.name}` : ''}
          </p>
          {novel.description && (
            <p className="mt-3 line-clamp-3 leading-relaxed text-stone-600">{novel.description}</p>
          )}
          <Link href={`/novels/${encodeURIComponent(novel.slug)}`} className="gy-btn-primary mt-4">
            立即阅读
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const [banners, categories, featured, latest, popular, topAuthors, settings, session] =
    await Promise.all([
      getActiveBanners(),
      getCategories(),
      getFeaturedNovels(6),
      getLatestNovels(6),
      getPopularNovels(8),
      getTopAuthors(6),
      getSiteSettings(),
      getCurrentUser(),
    ]);
  const recentlyRead = session ? await getReadingList(4) : [];

  return (
    <div className="space-y-10">
      {/* Hero: banners → featured novel → settings hero */}
      {banners.length > 0 ? (
        <HomeBanners banners={banners} />
      ) : featured.length > 0 ? (
        <FeaturedHero novel={featured[0]!} />
      ) : (
        <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-10 text-white shadow-sm">
          <h1 className="font-serif text-3xl font-bold">{settings['home.hero_title']}</h1>
          {settings['home.hero_subtitle'] && (
            <p className="mt-3 max-w-xl text-white/90">{settings['home.hero_subtitle']}</p>
          )}
        </div>
      )}

      {/* Search */}
      <form method="get" action="/novels" className="flex gap-2">
        <input
          type="text"
          name="q"
          placeholder="搜索书名、作者、分类…"
          className="flex-1 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
        />
        <button type="submit" className="gy-btn-primary px-6">搜索</button>
      </form>

      {/* Recently read (logged-in) */}
      {session && (
        <section>
          <SectionHeader title="最近阅读" href="/bookshelf" more="我的书架" />
          {recentlyRead.length === 0 ? (
            <p className="text-sm text-stone-500">还没有阅读记录，去书库挑一本开始吧。</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {recentlyRead.map((item) => (
                <Link
                  key={item.novelSlug}
                  href={item.progress ? `/novels/${item.novelSlug}/${item.progress.chapterNumber}` : `/novels/${item.novelSlug}`}
                  className="gy-card p-4 hover:border-brand"
                >
                  <div className="truncate font-serif font-medium text-stone-800">{item.novelTitle}</div>
                  <div className="mt-1 text-xs text-stone-500">
                    {item.progress
                      ? `第 ${item.progress.chapterNumber} 章 · ${item.progress.percent}%`
                      : '继续阅读'}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Categories */}
      <section>
        <SectionHeader title="分类" href="/categories" />
        <CategoryGrid categories={categories} />
      </section>

      {/* Recommended */}
      <section>
        <SectionHeader title="推荐小说" href="/novels" />
        {featured.length === 0 ? (
          <p className="text-sm text-stone-500">暂无推荐作品。</p>
        ) : (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {featured.map((n) => (
              <PosterCard key={n.id} novel={n} />
            ))}
          </div>
        )}
      </section>

      {/* Latest + Popular ranking */}
      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <SectionHeader title="最新更新" href="/novels?sort=updated" more="进入书库" />
          {latest.length === 0 ? (
            <p className="text-sm text-stone-500">暂无已发布的小说。</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {latest.map((n) => (
                <NovelCard key={n.id} novel={n} />
              ))}
            </div>
          )}
        </section>
        <section>
          <SectionHeader title="人气排行榜" />
          <RankList novels={popular} />
        </section>
      </div>

      {/* Hot authors */}
      {topAuthors.length > 0 && (
        <section>
          <SectionHeader title="热门作者" href="/authors/ranking" more="作者排行榜" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topAuthors.map((a) => (
              <Link
                key={a.id}
                href={`/authors/${encodeURIComponent(a.slug)}`}
                className="gy-card flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <AuthorAvatar src={a.avatarUrl} name={a.penName} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-stone-800">{a.penName}</span>
                    <AuthorLevelBadge totalViews={a.totalViews} />
                  </div>
                  <div className="mt-0.5 text-xs text-stone-400">
                    {a.novelCount} 部作品 · {a.totalViews.toLocaleString()} 阅读
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Author CTA */}
      <section className="overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-white p-6 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-xl font-bold text-stone-900">成为光羽作者</h2>
          <p className="mt-1 text-sm text-stone-600">在这里发布你的作品，让更多读者看到你的故事。</p>
        </div>
        <Link href="/account" className="gy-btn-primary mt-4 sm:mt-0">申请成为作者</Link>
      </section>
    </div>
  );
}
