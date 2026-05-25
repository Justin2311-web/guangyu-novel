import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ReviewButtons } from '../ReviewButtons';

export const dynamic = 'force-dynamic';

const REVIEW_BADGE: Record<string, { text: string; cls: string }> = {
  draft: { text: '草稿', cls: 'bg-stone-100 text-stone-500' },
  pending_review: { text: '待审核', cls: 'bg-amber-50 text-amber-700' },
  published: { text: '已批准', cls: 'bg-emerald-50 text-emerald-700' },
  rejected: { text: '已拒绝', cls: 'bg-red-50 text-red-700' },
  archived: { text: '已归档', cls: 'bg-stone-100 text-stone-500' },
};

const TABS: { value: string; label: string }[] = [
  { value: 'pending_review', label: '待审核' },
  { value: 'published', label: '已批准' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'all', label: '全部' },
];

const READER_URL = process.env.NEXT_PUBLIC_READER_URL ?? 'https://guangyu-reader.vercel.app';

type Row = {
  id: string;
  slug: string;
  title: string;
  cover_image_url: string | null;
  review_status: string;
  review_note: string | null;
  updated_at: string;
  authors: { pen_name: string; slug: string | null } | null;
};

export default async function ReviewNovelsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = TABS.some((t) => t.value === sp.status) ? sp.status! : 'pending_review';

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('novels')
    .select('id, slug, title, cover_image_url, review_status, review_note, updated_at, authors(pen_name, slug)')
    .order('updated_at', { ascending: false });
  if (status !== 'all') query = query.eq('review_status', status);
  const { data, error } = await query;
  const rows = (data ?? []) as unknown as Row[];

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">审核中心 · 小说</h1>
        <p className="text-sm text-stone-500">审核作者提交的小说，批准后将公开展示。</p>
      </header>

      <div className="flex gap-2 border-b border-stone-200">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/review/novels?status=${t.value}`}
            className={
              t.value === status
                ? '-mb-px border-b-2 border-brand px-3 py-2 text-sm font-medium text-brand'
                : 'px-3 py-2 text-sm text-stone-500 hover:text-brand'
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          加载失败：{error.message}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">封面</th>
              <th className="px-4 py-3 font-medium">小说</th>
              <th className="px-4 py-3 font-medium">作者</th>
              <th className="px-4 py-3 font-medium">更新时间</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-stone-400">
                  没有符合条件的小说。
                </td>
              </tr>
            )}
            {rows.map((n) => {
              const b = REVIEW_BADGE[n.review_status] ?? { text: '草稿', cls: 'bg-stone-100 text-stone-500' };
              return (
                <tr key={n.id} className="border-b border-stone-100 align-top last:border-0">
                  <td className="px-4 py-3">
                    <div className="h-14 w-10 overflow-hidden rounded bg-stone-100">
                      {n.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={n.cover_image_url} alt={n.title} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-800">{n.title}</td>
                  <td className="px-4 py-3 text-stone-500">{n.authors?.pen_name ?? '—'}</td>
                  <td className="px-4 py-3 text-stone-500">{n.updated_at.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${b.cls}`}>{b.text}</span>
                    {n.review_status === 'rejected' && n.review_note && (
                      <div className="mt-1 max-w-[180px] text-xs text-stone-400">原因：{n.review_note}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      <Link href={`/novels/${n.id}/edit`} className="block text-sm text-brand hover:underline">
                        查看
                      </Link>
                      {n.review_status === 'published' && (
                        <a
                          href={`${READER_URL}/novels/${encodeURIComponent(n.slug)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-stone-500 hover:text-brand"
                        >
                          前台详情
                        </a>
                      )}
                      {n.authors?.slug && (
                        <a
                          href={`${READER_URL}/authors/${encodeURIComponent(n.authors.slug)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-stone-500 hover:text-brand"
                        >
                          作者主页
                        </a>
                      )}
                      <ReviewButtons id={n.id} kind="novel" status={n.review_status} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
