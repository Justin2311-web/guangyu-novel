import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/supabase/server';
import { getNovelBySlug, getPublishedChapters, getChapterContent } from '@/lib/queries';
import { RecordReading } from './RecordReading';
import { ChapterReader } from './ChapterReader';
import { SITE_NAME, clampText } from '@/lib/site';

export const dynamic = 'force-dynamic';

function parseChapterNumber(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>;
}): Promise<Metadata> {
  const { slug, chapter } = await params;
  const num = parseChapterNumber(chapter);
  if (num === null) return { title: '未找到', robots: { index: false, follow: false } };
  const novel = await getNovelBySlug(slug);
  if (!novel) return { title: '未找到', robots: { index: false, follow: false } };
  const current = await getChapterContent(novel.id, num);
  if (!current) return { title: '未找到', robots: { index: false, follow: false } };

  const canonical = `/novels/${encodeURIComponent(novel.slug)}/${current.chapter_number}`;
  const title = `${current.title} - ${novel.title}`;
  const description =
    clampText(current.content) ?? `${novel.title} 第${current.chapter_number}章 ${current.title}`;

  return {
    title,
    description,
    alternates: { canonical },
    // Published chapters are public reading content → allow indexing.
    robots: { index: true, follow: true },
    openGraph: {
      type: 'article',
      title: `${title} - ${SITE_NAME}`,
      description,
      url: canonical,
    },
    twitter: { card: 'summary', title: `${title} - ${SITE_NAME}`, description },
  };
}

export default async function ChapterReaderPage({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>;
}) {
  const { slug, chapter } = await params;
  const num = parseChapterNumber(chapter);
  if (num === null) notFound();

  const novel = await getNovelBySlug(slug);
  if (!novel) notFound();

  const current = await getChapterContent(novel.id, num);
  if (!current) notFound();

  const chapters = await getPublishedChapters(novel.id);
  const idx = chapters.findIndex((c) => c.chapter_number === num);
  const prev = idx > 0 ? chapters[idx - 1] : undefined;
  const next = idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : undefined;

  const session = await getCurrentUser();

  return (
    <div className="mx-auto max-w-2xl">
      {session && <RecordReading novelId={novel.id} chapterId={current.id} />}

      <nav className="mb-6 text-sm text-stone-500">
        <Link href="/novels" className="hover:text-brand">书库</Link>
        <span className="px-1.5">/</span>
        <Link href={`/novels/${novel.slug}`} className="hover:text-brand">{novel.title}</Link>
        <span className="px-1.5">/</span>
        <span className="text-stone-700">第 {current.chapter_number} 章</span>
      </nav>

      <ChapterReader
        title={current.title}
        content={current.content}
        novelTitle={novel.title}
        novelSlug={novel.slug}
        chapterNumber={current.chapter_number}
        prev={prev ? { chapter_number: prev.chapter_number } : null}
        next={next ? { chapter_number: next.chapter_number } : null}
      />
    </div>
  );
}
