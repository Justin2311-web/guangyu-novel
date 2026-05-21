import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getNovelBySlug, getPublishedChapters, getChapterContent } from '@/lib/queries';

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
  if (num === null) return { title: '未找到' };
  const novel = await getNovelBySlug(slug);
  if (!novel) return { title: '未找到' };
  const current = await getChapterContent(novel.id, num);
  if (!current) return { title: '未找到' };
  return { title: `${current.title} - ${novel.title}` };
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

  // Used for prev/next; relies on published chapters being contiguous-ordered, not contiguous-numbered.
  const chapters = await getPublishedChapters(novel.id);
  const idx = chapters.findIndex((c) => c.chapter_number === num);
  const prev = idx > 0 ? chapters[idx - 1] : undefined;
  const next = idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : undefined;

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <nav className="text-sm text-stone-500">
        <Link href={`/novels/${novel.slug}`} className="hover:text-brand">
          {novel.title}
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-stone-700">第 {current.chapter_number} 章</span>
      </nav>

      <header>
        <h1 className="text-xl font-semibold text-stone-900">{current.title}</h1>
      </header>

      <div className="whitespace-pre-line text-[15px] leading-8 text-stone-800">
        {current.content}
      </div>

      <nav className="flex items-center justify-between border-t border-stone-200 pt-4 text-sm">
        {prev ? (
          <Link href={`/novels/${novel.slug}/${prev.chapter_number}`} className="text-brand hover:underline">
            ← 上一章
          </Link>
        ) : (
          <span className="text-stone-300">← 上一章</span>
        )}
        <Link href={`/novels/${novel.slug}`} className="text-stone-600 hover:text-brand">
          目录
        </Link>
        {next ? (
          <Link href={`/novels/${novel.slug}/${next.chapter_number}`} className="text-brand hover:underline">
            下一章 →
          </Link>
        ) : (
          <span className="text-stone-300">下一章 →</span>
        )}
      </nav>
    </article>
  );
}
