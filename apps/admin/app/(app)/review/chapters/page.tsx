import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ReviewButtons } from '../ReviewButtons';

export const dynamic = 'force-dynamic';

const BADGE: Record<string, { text: string; cls: string }> = {
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

type Row = {
  id: string;
  chapter_number: number;
  title: string;
  status: string;
  review_note: string | null;
  updated_at: string;
  novels: { title: string; authors: { pen_name: string } | null } | null;
};

export default async function ReviewChaptersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = TABS.some((t) => t.value === sp.status) ? sp.status! : 'pending_review';

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('chapters')
    .select('id, chapter_number, title, status, review_note, updated_at, novels(title, authors(pen_name))')
    .order('updated_at', { ascending: false });
  if (status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  const rows = (data ?? []) as unknown as Row[];

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">审核中心 · 章节</h1>
        <p className="text-sm text-stone-500">审核作者提交的章节，批准后将在已发布的小说中公开。</p>
      </header>

      <div className="flex gap-2 border-b border-stone-200">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/review/chapters?status=${t.value}`}
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
              <th className="px-4 py-3 font-medium">章节</th>
              <th className="px-4 py-3 font-medium">所属小说</th>
              <th className="px-4 py-3 font-medium">作者</th>
              <th className="px-4 py-3 font-medium">序号</th>
              <th className="px-4 py-3 font-medium">更新时间</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-stone-400">
                  没有符合条件的章节。
                </td>
              </tr>
            )}
            {rows.map((c) => {
              const b = BADGE[c.status] ?? { text: '草稿', cls: 'bg-stone-100 text-stone-500' };
              return (
                <tr key={c.id} className="border-b border-stone-100 align-top last:border-0">
                  <td className="px-4 py-3 font-medium text-stone-800">{c.title}</td>
                  <td className="px-4 py-3 text-stone-500">{c.novels?.title ?? '—'}</td>
                  <td className="px-4 py-3 text-stone-500">{c.novels?.authors?.pen_name ?? '—'}</td>
                  <td className="px-4 py-3 text-stone-500">{c.chapter_number}</td>
                  <td className="px-4 py-3 text-stone-500">{c.updated_at.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${b.cls}`}>{b.text}</span>
                    {c.status === 'rejected' && c.review_note && (
                      <div className="mt-1 max-w-[180px] text-xs text-stone-400">原因：{c.review_note}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ReviewButtons id={c.id} kind="chapter" status={c.status} />
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
