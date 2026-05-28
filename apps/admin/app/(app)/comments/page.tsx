import Link from 'next/link';
import { redirect } from 'next/navigation';
import { COMMENT_STATUS_LABELS, canManageContent, type CommentStatus } from '@guangyu/database';
import { createSupabaseServerClient, getCurrentAdminUser } from '@/lib/supabase/server';
import { CommentModerationButtons } from './CommentModerationButtons';

export const dynamic = 'force-dynamic';

const STATUS_BADGE: Record<CommentStatus, string> = {
  visible: 'bg-emerald-50 text-emerald-700',
  hidden: 'bg-amber-50 text-amber-700',
  deleted: 'bg-red-50 text-red-700',
};

const TABS: { value: string; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'reported', label: '被举报' },
  { value: 'visible', label: '显示中' },
  { value: 'hidden', label: '已隐藏' },
  { value: 'deleted', label: '已删除' },
];

type Row = {
  id: string;
  content: string;
  status: CommentStatus;
  user_display_name: string | null;
  created_at: string;
  novels: { title: string; slug: string } | null;
};

type ReportRow = { comment_id: string };

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  // Authors can reach the admin shell; comment moderation is admin/superadmin only.
  const session = await getCurrentAdminUser();
  if (!session || !canManageContent(session.profile.role)) redirect('/');

  const sp = await searchParams;
  const status = TABS.some((t) => t.value === sp.status) ? sp.status! : 'all';
  const q = (sp.q ?? '').trim();
  const needle = q.toLowerCase();

  const supabase = await createSupabaseServerClient();

  // Aggregate open-report counts per comment (one query, admin RLS authorizes read).
  // Falls back to empty Map if comment_reports table has not yet been applied
  // (migration 0020), so the page still renders cleanly pre-migration.
  const openReports = new Map<string, number>();
  let reportsAvailable = true;
  {
    const { data, error } = await supabase
      .from('comment_reports')
      .select('comment_id')
      .eq('status', 'open');
    if (error) {
      reportsAvailable = false;
    } else {
      for (const row of (data ?? []) as ReportRow[]) {
        openReports.set(row.comment_id, (openReports.get(row.comment_id) ?? 0) + 1);
      }
    }
  }

  let query = supabase
    .from('comments')
    .select('id, content, status, user_display_name, created_at, novels(title, slug)')
    .order('created_at', { ascending: false })
    .limit(500);
  if (status === 'reported') {
    const reportedIds = Array.from(openReports.keys());
    if (reportedIds.length === 0) {
      // No reports → empty result without hitting the DB with an .in(empty) call.
      query = query.in('id', ['00000000-0000-0000-0000-000000000000']);
    } else {
      query = query.in('id', reportedIds);
    }
  } else if (status !== 'all') {
    query = query.eq('status', status);
  }
  const { data, error } = await query;

  let rows = (data ?? []) as unknown as Row[];
  if (needle) {
    rows = rows.filter(
      (r) =>
        r.content.toLowerCase().includes(needle) ||
        (r.user_display_name ?? '').toLowerCase().includes(needle) ||
        (r.novels?.title ?? '').toLowerCase().includes(needle),
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">评论管理</h1>
        <p className="text-sm text-stone-500">
          隐藏、恢复或删除读者评论。隐藏/删除后将不再公开显示。
          {!reportsAvailable && (
            <span className="ml-2 text-amber-600">（举报功能待迁移 0020_comment_reports.sql 后启用）</span>
          )}
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 border-b border-stone-200">
          {TABS.map((t) => (
            <Link
              key={t.value}
              href={`/comments?status=${t.value}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className={
                t.value === status
                  ? '-mb-px border-b-2 border-brand px-3 py-2 text-sm font-medium text-brand'
                  : 'px-3 py-2 text-sm text-stone-500 hover:text-brand'
              }
            >
              {t.label}
              {t.value === 'reported' && openReports.size > 0 && (
                <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                  {openReports.size}
                </span>
              )}
            </Link>
          ))}
        </div>
        <form method="get" className="flex gap-2">
          <input type="hidden" name="status" value={status} />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="搜索内容、用户或小说标题…"
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
          />
          <button type="submit" className="rounded-md bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark">
            搜索
          </button>
        </form>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          加载失败：{error.message}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">评论</th>
              <th className="px-4 py-3 font-medium">用户</th>
              <th className="px-4 py-3 font-medium">小说</th>
              <th className="px-4 py-3 font-medium">时间</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">举报</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-stone-400">
                  没有符合条件的评论。
                </td>
              </tr>
            )}
            {rows.map((c) => {
              const reportCount = openReports.get(c.id) ?? 0;
              return (
                <tr key={c.id} className="border-b border-stone-100 align-top last:border-0">
                  <td className="max-w-sm px-4 py-3 text-stone-800">
                    <p className="whitespace-pre-line break-words">{c.content}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-500">{c.user_display_name ?? '—'}</td>
                  <td className="px-4 py-3 text-stone-500">
                    {c.novels ? (
                      <span className="break-words">{c.novels.title}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-500">{c.created_at.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[c.status]}`}>
                      {COMMENT_STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {reportCount > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        {reportCount} 起待处理
                      </span>
                    ) : (
                      <span className="text-xs text-stone-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <CommentModerationButtons
                      id={c.id}
                      status={c.status}
                      openReportCount={reportCount}
                    />
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
