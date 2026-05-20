import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { NOVEL_SERIAL_STATUS_LABELS } from '@guangyu/database';
import { getNovelBySlug } from '@/lib/queries';

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
          <div className="pt-2">
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-md bg-stone-200 px-4 py-2 text-sm text-stone-500"
              title="章节将在后续阶段开放"
            >
              开始阅读（即将开放）
            </button>
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
        <p className="text-sm text-stone-500">章节列表将在 Phase 3c 开放。</p>
      </section>
    </article>
  );
}
