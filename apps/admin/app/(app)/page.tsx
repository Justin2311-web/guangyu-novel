import Link from 'next/link';
import { redirect } from 'next/navigation';
import { canManageContent } from '@guangyu/database';
import { getCurrentAdminUser } from '@/lib/supabase/server';
import { getPlatformStats, getRecentActivity } from '@/lib/dashboard';

export const dynamic = 'force-dynamic';

const READER_URL = process.env.NEXT_PUBLIC_READER_URL ?? 'https://guangyu-reader.vercel.app';

const fmt = (n: number) => n.toLocaleString();

function Metric({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-lg border bg-white p-4 ${accent ? 'border-amber-300' : 'border-stone-200'}`}>
      <div className="text-2xl font-semibold text-stone-800">{fmt(value)}</div>
      <div className="mt-1 text-xs text-stone-500">{label}</div>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  draft: '草稿',
  pending_review: '待审核',
  published: '已发布',
  rejected: '已拒绝',
  archived: '已归档',
  visible: '显示中',
  hidden: '已隐藏',
  deleted: '已删除',
  pending: '待审核',
  approved: '已通过',
};

function Panel({ title, action, children }: { title: string; action?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white">
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-stone-700">{title}</h2>
        {action && (
          <Link href={action.href} className="text-xs text-brand hover:underline">
            {action.label} →
          </Link>
        )}
      </div>
      <div className="divide-y divide-stone-100">{children}</div>
    </div>
  );
}

function Row({ main, meta, badge }: { main: string; meta?: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
      <span className="min-w-0 flex-1 truncate text-stone-700">{main}</span>
      {meta && <span className="shrink-0 text-xs text-stone-400">{meta}</span>}
      {badge && <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">{STATUS_LABEL[badge] ?? badge}</span>}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getCurrentAdminUser();
  // Analytics are admin/superadmin only; authors are sent to their content area.
  if (!session || !canManageContent(session.profile.role)) redirect('/novels');

  const [s, recent] = await Promise.all([getPlatformStats(), getRecentActivity()]);

  const quickActions: { href: string; label: string; count?: number; external?: boolean }[] = [
    { href: '/review/novels', label: '审核小说', count: s.pending_novels },
    { href: '/review/chapters', label: '审核章节', count: s.pending_chapters },
    { href: '/comments', label: '评论管理', count: s.total_comments },
    { href: '/users', label: '用户管理', count: s.total_users },
    { href: '/authors', label: '作者管理', count: s.pending_applications },
    { href: '/novels', label: '小说管理', count: s.total_novels },
    { href: READER_URL, label: '前台首页', external: true },
  ];

  const empty = (text: string) => <div className="px-4 py-4 text-xs text-stone-400">{text}</div>;

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">概览</h1>
        <p className="text-sm text-stone-500">平台内容、用户、互动与待办一览。</p>
      </header>

      {/* Moderation / to-do */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="待审核小说" value={s.pending_novels} accent={s.pending_novels > 0} />
        <Metric label="待审核章节" value={s.pending_chapters} accent={s.pending_chapters > 0} />
        <Metric label="待处理作者申请" value={s.pending_applications} accent={s.pending_applications > 0} />
        <Metric label="隐藏/删除评论" value={s.hidden_deleted_comments} />
      </div>

      {/* Content */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-stone-600">内容</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="小说总数" value={s.total_novels} />
          <Metric label="已发布小说" value={s.published_novels} />
          <Metric label="草稿小说" value={s.draft_novels} />
          <Metric label="已拒绝小说" value={s.rejected_novels} />
          <Metric label="章节总数" value={s.total_chapters} />
          <Metric label="已发布章节" value={s.published_chapters} />
          <Metric label="待审核章节" value={s.pending_chapters} />
          <Metric label="总阅读量" value={s.total_views} />
        </div>
      </div>

      {/* Users */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-stone-600">用户</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="用户总数" value={s.total_users} />
          <Metric label="读者" value={s.readers} />
          <Metric label="作者" value={s.authors} />
          <Metric label="管理员" value={s.admins} />
          <Metric label="已停用" value={s.suspended_users} />
          <Metric label="已删除" value={s.deleted_users} />
        </div>
      </div>

      {/* Engagement */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-stone-600">互动</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="评论总数" value={s.total_comments} />
          <Metric label="显示中评论" value={s.visible_comments} />
          <Metric label="收藏总数" value={s.total_bookmarks} />
          <Metric label="阅读记录" value={s.total_reading_history} />
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-stone-600">快捷操作</h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {quickActions.map((a) =>
            a.external ? (
              <a
                key={a.label}
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 hover:border-brand hover:text-brand"
              >
                {a.label} ↗
              </a>
            ) : (
              <Link
                key={a.label}
                href={a.href}
                className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 hover:border-brand hover:text-brand"
              >
                <span>{a.label}</span>
                {typeof a.count === 'number' && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-brand-dark">{fmt(a.count)}</span>
                )}
              </Link>
            ),
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="最新提交小说" action={{ href: '/review/novels', label: '审核' }}>
          {recent.novels.length === 0
            ? empty('暂无')
            : recent.novels.map((n) => (
                <Row key={n.id} main={n.title} meta={n.authors?.pen_name ?? '—'} badge={n.review_status} />
              ))}
        </Panel>
        <Panel title="最新提交章节" action={{ href: '/review/chapters', label: '审核' }}>
          {recent.chapters.length === 0
            ? empty('暂无')
            : recent.chapters.map((c) => (
                <Row key={c.id} main={c.title} meta={c.novels?.title ?? '—'} badge={c.status} />
              ))}
        </Panel>
        <Panel title="最新评论" action={{ href: '/comments', label: '管理' }}>
          {recent.comments.length === 0
            ? empty('暂无')
            : recent.comments.map((c) => (
                <Row key={c.id} main={c.content} meta={c.user_display_name ?? '—'} badge={c.status} />
              ))}
        </Panel>
        <Panel title="最新用户">
          {recent.users.length === 0
            ? empty('暂无')
            : recent.users.map((u) => (
                <Row key={u.id} main={u.display_name ?? '(未命名)'} meta={u.created_at.slice(0, 10)} badge={u.role} />
              ))}
        </Panel>
        <Panel title="最新作者申请" action={{ href: '/authors', label: '查看' }}>
          {recent.applications.length === 0
            ? empty('暂无')
            : recent.applications.map((a) => (
                <Row key={a.id} main={a.pen_name} meta={a.created_at.slice(0, 10)} badge={a.status} />
              ))}
        </Panel>
      </div>
    </section>
  );
}
