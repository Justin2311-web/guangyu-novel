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
  getNovelComments,
  getNovelCommentCount,
  isBookmarked,
} from '@/lib/queries';
import { BookmarkButton } from './BookmarkButton';
import { LocalContinueButton } from './LocalContinueButton';
import { CommentSection } from './CommentSection';
import { ShareButtons } from './ShareButtons';
import { SectionHeader } from '../../components/SectionHeader';
import { PosterCard } from '../../components/PosterCard';
import { SITE_NAME, absoluteUrl, clampText } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const novel = await getNovelBySlug(slug);
  if (!novel) return { title: '未找到', robots: { index: false, follow: false } };

  const canonical = `/novels/${encodeURIComponent(novel.slug)}`;
  const description =
    clampText(novel.description) ?? `《${novel.title}》- 在${SITE_NAME}免费在线阅读。`;
  const images = novel.cover_image_url ? [{ url: novel.cover_image_url }] : undefined;

  return {
    title: novel.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'book',
      title: `${novel.title} - ${SITE_NAME}`,
      description,
      url: canonical,
      images,
      ...(novel.authors?.pen_name ? { authors: [novel.authors.pen_name] } : {}),
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title: `${novel.title} - ${SITE_NAME}`,
      description,
      ...(images ? { images: [novel.cover_image_url as string] } : {}),
    },
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

  const [comments, commentCount] = await Promise.all([
    getNovelComments(novel.id),
    getNovelCommentCount(novel.id),
  ]);

  const related = novel.categories?.slug
    ? (await getNovels({ categorySlug: novel.categories.slug }))
        .filter((n) => n.id !== novel.id)
        .slice(0, 6)
    : [];

  const novelUrl = absoluteUrl(`/novels/${encodeURIComponent(novel.slug)}`);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: novel.title,
    url: novelUrl,
    ...(novel.description ? { description: clampText(novel.description, 300) } : {}),
    ...(novel.cover_image_url ? { image: novel.cover_image_url } : {}),
    ...(novel.authors?.pen_name
      ? { author: { '@type': 'Person', name: novel.authors.pen_name } }
      : {}),
    inLanguage: 'zh-CN',
    publisher: { '@type': 'Organization', name: SITE_NAME },
  };

  return (
    <article className="space-y-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
              {novel.secondaryCategory && (
                <Link
                  href={`/novels?category=${encodeURIComponent(novel.secondaryCategory.slug)}`}
                  className="rounded bg-amber-50 px-2 py-0.5 text-xs text-brand-dark hover:bg-amber-100"
                >
                  {novel.secondaryCategory.name}
                </Link>
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
                  <>
                    {/* Anonymous / non-DB local progress, when available, replaces "开始阅读". */}
                    <LocalContinueButton
                      novelSlug={novel.slug}
                      maxChapterNumber={chapters[chapters.length - 1]?.chapter_number ?? firstChapter.chapter_number}
                    />
                    <Link
                      href={`/novels/${novel.slug}/${firstChapter.chapter_number}`}
                      className="gy-btn-primary"
                    >
                      开始阅读
                    </Link>
                  </>
                )
              ) : (
                <button type="button" disabled className="gy-btn-ghost cursor-not-allowed opacity-60">
                  暂无章节
                </button>
              )}
              <BookmarkButton novelId={novel.id} isLoggedIn={isLoggedIn} initialBookmarked={bookmarked} />
            </div>

            <div className="pt-1">
              <ShareButtons url={novelUrl} title={`${novel.title} - ${SITE_NAME}`} />
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
                  <span className="min-w-0 flex-1 truncate text-stone-800">{c.title}</span>
                  {c.date && (
                    <span className="shrink-0 text-xs text-stone-400">
                      {c.date.slice(0, 10)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Comments */}
      <CommentSection
        novelId={novel.id}
        novelSlug={novel.slug}
        comments={comments}
        count={commentCount}
        isLoggedIn={isLoggedIn}
        currentUserId={session?.user.id ?? null}
      />

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
