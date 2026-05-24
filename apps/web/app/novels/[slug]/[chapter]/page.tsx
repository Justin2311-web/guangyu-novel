import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/supabase/server';
import { getNovelBySlug, getPublishedChapters, getChapterContent } from '@/lib/queries';
import { RecordReading } from './RecordReading';

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

  const chapters = await getPublishedChapters(novel.id);
  const idx = chapters.findIndex((c) => c.chapter_number === num);
  const prev = idx > 0 ? chapters[idx - 1] : undefined;
  const next = idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : undefined;

  const session = await getCurrentUser();

  const PagedNav = ({ border }: { border?: boolean }) => (
    <nav
      className={`flex items-center justify-between gap-3 text-sm ${
        border ? 'border-t border-stone-200 pt-5' : ''
      }`}
    >
      {prev ? (
        <Link href={`/novels/${novel.slug}/${prev.chapter_number}`} className="gy-btn-ghost">
          ← 上一章
        </Link>
      ) : (
        <span className="gy-btn-ghost cursor-not-allowed opacity-40">← 上一章</span>
      )}
      <Link href={`/novels/${novel.slug}`} className="text-stone-500 hover:text-brand">
        目录
      </Link>
      {next ? (
        <Link href={`/novels/${novel.slug}/${next.chapter_number}`} className="gy-btn-ghost">
          下一章 →
        </Link>
      ) : (
        <span className="gy-btn-ghost cursor-not-allowed opacity-40">下一章 →</span>
      )}
    </nav>
  );

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

      <article className="gy-card border-amber-100 bg-[#fdfbf6] px-6 py-8 sm:px-10 sm:py-10">
        <header className="mb-6 text-center">
          <h1 className="font-serif text-2xl font-bold text-stone-900">{current.title}</h1>
          <p className="mt-2 text-xs text-stone-400">
            {novel.title} · 第 {current.chapter_number} 章
          </p>
        </header>

        <div className="whitespace-pre-line font-serif text-[17px] leading-9 tracking-wide text-stone-800">
          {current.content}
        </div>
      </article>

      <div className="mt-6">
        <PagedNav />
      </div>
    </div>
  );
}
