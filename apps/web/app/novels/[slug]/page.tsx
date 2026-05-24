import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NOVEL_SERIAL_STATUS_LABELS } from '@guangyu/database';
import { getCurrentUser } from '@/lib/supabase/server';
import {
  getNovelBySlug,
  getPublishedChapters,
  getReadingProgressForNovel,
  getNovels,
  isBookmarked,
} from '@/lib/queries';
import { BookmarkButton } from './BookmarkButton';
import { SectionHeader } from '../../components/SectionHeader';
import { PosterCard } from '../../components/PosterCard';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const novel = await getNovelBySlug(slug);
  if (!novel) return { title: '未找到' };
  return { title: novel.title, description: novel.description ?? undefined };
}

export default async function NovelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const novel = await getNovelBySlug(slug);
  if (!novel) notFound();

  const chapters = await getPublishedChapters(novel.id);
  const firstChapter = chapters[0];

  const session = await getCurrentUser();
  const isLoggedIn = !!session;
  const [progress, bookmarked] = isLoggedIn
    ? await Promise.all([getReadingProgressForNovel(novel.id), isBookmarked(novel.id)])
    : [null, false];

  const related = novel.categories?.slug
    ? (await getNovels({ categorySlug: novel.categories.slug }))
        .filter((n) => n.id !== novel.id)
        .slice(0, 6)
    : [];

  return (
    <article className="space-y-8">
      {/* Hero */}
      <div className="gy-card overflow-hidden border-amber-100 bg-gradient-to-br from-amber-50 to-white">
        <div className="flex flex-col gap-6 p-6 sm:flex-row">
          <div className="mx-auto h-64 w-44 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-amber-100 to-stone-100 shadow-md sm:mx-0">
            {novel.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={novel.cover_image_url} alt={novel.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-3 text-center font-serif text-2xl text-brand/50">
                {novel.title}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <h1 className="font-serif text-2xl font-bold text-stone-900">{novel.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {novel.authors?.slug ? (
                <Link
                  href={`/authors/${encodeURIComponent(novel.authors.slug)}`}
                  className="text-brand-dark hover:text-brand hover:underline"
                >
                  {novel.authors.pen_name}
                </Link>
              ) : (
                <span className="text-stone-600">{novel.authors?.pen_name ?? '佚名'}</span>
              )}
              {novel.categories ? (
                <Link
                  href={`/novels?category=${encodeURIComponent(novel.categories.slug)}`}
                  className="rounded bg-amber-50 px-2 py-0.5 text-xs text-brand-dark hover:bg-amber-100"
                >
                  {novel.categories.name}
                </Link>
              ) : (
                <span className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-500">未分类</span>
              )}
              <span className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                {NOVEL_SERIAL_STATUS_LABELS[novel.status]}
              </span>
            </div>

            {progress && (
              <div className="max-w-xs">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>第 {progress.chapterNumber} 章 / 共 {progress.total} 章</span>
                  <span>{progress.percent}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-200/70">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${progress.percent}%` }} />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {firstChapter ? (
                progress ? (
                  <>
                    <Link href={`/novels/${novel.slug}/${progress.chapterNumber}`} className="gy-btn-primary">
                      继续阅读 · 第 {progress.chapterNumber} 章
                    </Link>
                    <Link href={`/novels/${novel.slug}/${firstChapter.chapter_number}`} className="gy-btn-ghost">
                      从头开始
                    </Link>
                  </>
                ) : (
                  <Link href={`/novels/${novel.slug}/${firstChapter.chapter_number}`} className="gy-btn-primary">
                    开始阅读
                  </Link>
                )
              ) : (
                <button type="button" disabled className="gy-btn-ghost cursor-not-allowed opacity-60">
                  暂无章节
                </button>
              )}
              <BookmarkButton novelId={novel.id} isLoggedIn={isLoggedIn} initialBookmarked={bookmarked} />
            </div>
          </div>
        </div>
      </div>

      {/* Intro */}
      <section>
        <h2 className="gy-heading mb-3">简介</h2>
        <div className="gy-card p-5">
          <p className="whitespace-pre-line leading-loose text-stone-700">
            {novel.description ?? '暂无简介。'}
          </p>
        </div>
      </section>

      {/* Chapters */}
      <section>
        <h2 className="gy-heading mb-3">目录 <span className="text-sm font-normal text-stone-400">（{chapters.length} 章）</span></h2>
        {chapters.length === 0 ? (
          <div className="gy-card px-4 py-10 text-center text-sm text-stone-500">暂无章节。</div>
        ) : (
          <ul className="gy-card max-h-96 divide-y divide-stone-100 overflow-y-auto">
            {chapters.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/novels/${novel.slug}/${c.chapter_number}`}
                  className="flex items-baseline gap-3 px-4 py-3 text-sm hover:bg-amber-50/60"
                >
                  <span className="shrink-0 text-stone-400">第 {c.chapter_number} 章</span>
                  <span className="truncate text-stone-800">{c.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section>
          <SectionHeader title="同类推荐" />
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {related.map((n) => (
              <PosterCard key={n.id} novel={n} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
