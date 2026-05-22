import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NOVEL_SERIAL_STATUS_LABELS } from '@guangyu/database';
import { getCurrentUser } from '@/lib/supabase/server';
import {
  getNovelBySlug,
  getPublishedChapters,
  getReadingProgressForNovel,
  isBookmarked,
} from '@/lib/queries';
import { BookmarkButton } from './BookmarkButton';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const novel = await getNovelBySlug(slug);
  if (!novel) return { title: '未找到' };
  return {
    title: novel.title,
    description: novel.description ?? undefined,
  };
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

  return (
    <article className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="h-64 w-44 shrink-0 overflow-hidden rounded-lg bg-stone-100">
          {novel.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={novel.cover_image_url}
              alt={novel.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-stone-400">
              无封面
            </div>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <h1 className="text-2xl font-semibold text-stone-900">{novel.title}</h1>
          <dl className="space-y-1 text-sm text-stone-600">
            <div className="flex gap-2">
              <dt className="text-stone-400">作者</dt>
              <dd>{novel.authors?.pen_name ?? '佚名'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-stone-400">分类</dt>
              <dd>
                {novel.categories ? (
                  <Link
                    href={`/novels?category=${encodeURIComponent(novel.categories.slug)}`}
                    className="text-brand hover:underline"
                  >
                    {novel.categories.name}
                  </Link>
                ) : (
                  '未分类'
                )}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-stone-400">状态</dt>
              <dd>{NOVEL_SERIAL_STATUS_LABELS[novel.status]}</dd>
            </div>
          </dl>
          {progress && (
            <div className="max-w-xs pt-1">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>
                  第 {progress.chapterNumber} 章 / 共 {progress.total} 章
                </span>
                <span>{progress.percent}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {firstChapter ? (
              progress ? (
                <>
                  <Link
                    href={`/novels/${novel.slug}/${progress.chapterNumber}`}
                    className="inline-flex rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
                  >
                    继续阅读 · 第 {progress.chapterNumber} 章
                  </Link>
                  <Link
                    href={`/novels/${novel.slug}/${firstChapter.chapter_number}`}
                    className="inline-flex rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:border-brand hover:text-brand"
                  >
                    从头开始
                  </Link>
                </>
              ) : (
                <Link
                  href={`/novels/${novel.slug}/${firstChapter.chapter_number}`}
                  className="inline-flex rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
                >
                  开始阅读
                </Link>
              )
            ) : (
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-md bg-stone-200 px-4 py-2 text-sm text-stone-500"
              >
                暂无章节
              </button>
            )}
            <BookmarkButton
              novelId={novel.id}
              isLoggedIn={isLoggedIn}
              initialBookmarked={bookmarked}
            />
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-medium">简介</h2>
        <p className="whitespace-pre-line leading-relaxed text-stone-700">
          {novel.description ?? '暂无简介。'}
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium">目录</h2>
        {chapters.length === 0 ? (
          <p className="text-sm text-stone-500">暂无章节。</p>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
            {chapters.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/novels/${novel.slug}/${c.chapter_number}`}
                  className="flex items-baseline gap-3 px-4 py-3 text-sm hover:bg-stone-50"
                >
                  <span className="text-stone-400">第 {c.chapter_number} 章</span>
                  <span className="text-stone-800">{c.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
