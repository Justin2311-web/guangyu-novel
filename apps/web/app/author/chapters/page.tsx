import Link from 'next/link';
import { CHAPTER_STATUS_LABELS } from '@guangyu/database';
import { ensureMyAuthor, getMyNovels, getMyChapters } from '@/lib/author';
import { chapterPlainText } from '@/lib/chapter-content';

export const dynamic = 'force-dynamic';

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-stone-100 text-stone-600',
  pending_review: 'bg-amber-50 text-amber-700',
  published: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  archived: 'bg-stone-100 text-stone-500',
};

function chapterWordCount(content: string | null | undefined): number {
  return chapterPlainText(content).replace(/\s/g, '').length;
}

export default async function AuthorChaptersPage({
  searchParams,
}: {
  searchParams: Promise<{ novel?: string }>;
}) {
  const author = await ensureMyAuthor();
  if (!author) return <p className="text-sm text-stone-500">未找到作者资料。</p>;

  const novels = await getMyNovels(author.id);
  const sp = await searchParams;
  const novelFilter = novels.find((n) => n.id === sp.novel)?.id;

  const allChapters = await getMyChapters(novels.map((n) => n.id));
  const chapters = novelFilter ? allChapters.filter((c) => c.novel_id === novelFilter) : allChapters;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">章节管理</h2>
        <Link
          href={`/author/chapters/new${novelFilter ? `?novel=${novelFilter}` : ''}`}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          新增章节
        </Link>
      </div>

      {novels.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-12 text-center text-stone-500">
          请先创建一部小说，再添加章节。
        </div>
      ) : chapters.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-12 text-center text-stone-500">
          还没有章节，点击「新增章节」开始。
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">小说</th>
                <th className="px-4 py-3 font-medium">序号</th>
                <th className="px-4 py-3 font-medium">标题</th>
                <th className="px-4 py-3 font-medium">字数</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">更新时间</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {chapters.map((c) => {
                const wordCount = chapterWordCount(c.content);
                const readerHref = c.novels?.slug
                  ? `/novels/${encodeURIComponent(c.novels.slug)}/${c.chapter_number}`
                  : null;
                const canEdit = c.status === 'draft' || c.status === 'rejected';
                const isPending = c.status === 'pending_review';
                const isPublished = c.status === 'published';
                return (
                  <tr key={c.id} className="border-b border-stone-100 last:border-0 align-top">
                    <td className="px-4 py-3 text-stone-500">{c.novels?.title ?? '—'}</td>
                    <td className="px-4 py-3 text-stone-500">{c.chapter_number}</td>
                    <td className="px-4 py-3 font-medium text-stone-800">{c.title}</td>
                    <td className="px-4 py-3 text-stone-500">{wordCount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          STATUS_BADGE[c.status] ?? 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {CHAPTER_STATUS_LABELS[c.status]}
                      </span>
                      {c.status === 'rejected' && c.review_note && (
                        <div className="mt-1 max-w-[220px] text-xs text-red-600">
                          拒绝原因：{c.review_note}
                        </div>
                      )}
                      {isPending && (
                        <div className="mt-1 text-xs text-amber-600">
                          已提交，审核中暂不可编辑。
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-500">{c.updated_at.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        {canEdit && (
                          <Link
                            href={`/author/chapters/${c.id}/edit`}
                            className="text-brand hover:underline"
                          >
                            {c.status === 'rejected' ? '修改重提' : '编辑'}
                          </Link>
                        )}
                        {!canEdit && (
                          <Link
                            href={`/author/chapters/${c.id}/edit`}
                            className="text-stone-600 hover:text-brand"
                          >
                            查看
                          </Link>
                        )}
                        {isPublished && readerHref && (
                          <Link
                            href={readerHref}
                            target="_blank"
                            className="text-stone-600 hover:text-brand"
                          >
                            查看前台
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
