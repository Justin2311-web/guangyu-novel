import Link from 'next/link';
import { NOVEL_SERIAL_STATUS_LABELS } from '@guangyu/database';
import { ensureMyAuthor, getMyNovels } from '@/lib/author';

export const dynamic = 'force-dynamic';

const REVIEW_BADGE: Record<string, { text: string; cls: string }> = {
  draft: { text: '草稿', cls: 'bg-stone-100 text-stone-500' },
  pending_review: { text: '待审核', cls: 'bg-amber-50 text-amber-700' },
  published: { text: '已发布', cls: 'bg-emerald-50 text-emerald-700' },
  rejected: { text: '已拒绝', cls: 'bg-red-50 text-red-700' },
  archived: { text: '已归档', cls: 'bg-stone-100 text-stone-500' },
};

export default async function AuthorNovelsPage() {
  const author = await ensureMyAuthor();
  if (!author) {
    return <p className="text-sm text-stone-500">未找到作者资料。</p>;
  }
  const novels = await getMyNovels(author.id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">我的作品</h2>
        <Link
          href="/author/novels/new"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          新增小说
        </Link>
      </div>

      {novels.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-12 text-center text-stone-500">
          还没有作品，点击「新增小说」创建你的第一部作品。
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">标题</th>
                <th className="px-4 py-3 font-medium">分类</th>
                <th className="px-4 py-3 font-medium">连载</th>
                <th className="px-4 py-3 font-medium">审核状态</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {novels.map((n) => {
                const fallback = { text: '草稿', cls: 'bg-stone-100 text-stone-500' };
                const b =
                  (n.is_published && n.review_status !== 'published'
                    ? REVIEW_BADGE.published
                    : REVIEW_BADGE[n.review_status]) ?? fallback;
                return (
                  <tr key={n.id} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-stone-800">{n.title}</td>
                    <td className="px-4 py-3 text-stone-500">{n.categories?.name ?? '未分类'}</td>
                    <td className="px-4 py-3 text-stone-500">{NOVEL_SERIAL_STATUS_LABELS[n.status]}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${b.cls}`}>{b.text}</span>
                      {n.review_status === 'rejected' && n.review_note && (
                        <div className="mt-1 max-w-[200px] text-xs text-red-600">
                          拒绝原因：{n.review_note}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <Link href={`/author/novels/${n.id}/edit`} className="text-brand hover:underline">
                          编辑
                        </Link>
                        <Link
                          href={`/author/chapters?novel=${n.id}`}
                          className="text-stone-600 hover:text-brand"
                        >
                          章节
                        </Link>
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
