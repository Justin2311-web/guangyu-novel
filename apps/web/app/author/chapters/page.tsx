import Link from 'next/link';
import { CHAPTER_STATUS_LABELS } from '@guangyu/database';
import { getMyAuthor, getMyNovels, getMyChapters } from '@/lib/author';

export const dynamic = 'force-dynamic';

export default async function AuthorChaptersPage({
  searchParams,
}: {
  searchParams: Promise<{ novel?: string }>;
}) {
  const author = await getMyAuthor();
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
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">小说</th>
                <th className="px-4 py-3 font-medium">序号</th>
                <th className="px-4 py-3 font-medium">标题</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {chapters.map((c) => (
                <tr key={c.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 text-stone-500">{c.novels?.title ?? '—'}</td>
                  <td className="px-4 py-3 text-stone-500">{c.chapter_number}</td>
                  <td className="px-4 py-3 font-medium text-stone-800">{c.title}</td>
                  <td className="px-4 py-3 text-stone-500">
                    {CHAPTER_STATUS_LABELS[c.status]}
                    {c.status === 'rejected' && c.review_note && (
                      <div className="mt-1 max-w-[200px] text-xs text-red-600">
                        拒绝原因：{c.review_note}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/author/chapters/${c.id}/edit`} className="text-brand hover:underline">
                      编辑
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
