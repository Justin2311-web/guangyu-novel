import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  AUTHOR_APPLICATION_STATUS_LABELS,
  USER_ROLE_LABELS,
  type AuthorApplicationStatus,
  type Role,
} from '@guangyu/database';
import { ReviewButtons } from './ReviewButtons';

export const dynamic = 'force-dynamic';

const STATUS_TABS: { value: string; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'revision_requested', label: '需修改' },
];

type AppRow = {
  id: string;
  user_id: string;
  email: string;
  pen_name: string;
  bio: string | null;
  genre: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  social_link: string | null;
  sample_text: string | null;
  status: AuthorApplicationStatus;
  admin_note: string | null;
  reviewer_email: string | null;
  reviewed_at: string | null;
  applicant_role: Role;
  created_at: string;
  total_count: number;
};

const STATUS_BADGE: Record<AuthorApplicationStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  revision_requested: 'bg-blue-50 text-blue-700',
};

export default async function AdminAuthorApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const status = STATUS_TABS.some((t) => t.value === sp.status && t.value) ? (sp.status as string) : '';

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('admin_list_author_applications', {
    p_search: q || null,
    p_status: status || null,
    p_limit: 100,
    p_offset: 0,
  });
  const rows = (data ?? []) as AppRow[];

  const tabHref = (s: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (s) params.set('status', s);
    const qs = params.toString();
    return qs ? `/authors?${qs}` : '/authors';
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">作者申请</h1>
        <p className="text-sm text-stone-500">审核读者的作者申请（管理员 / 超级管理员）。</p>
      </header>

      <form method="get" className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="搜索邮箱、笔名、题材…"
          className="w-64 rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        {status && <input type="hidden" name="status" value={status} />}
        <button type="submit" className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
          搜索
        </button>
      </form>

      <div className="flex flex-wrap gap-2 border-b border-stone-200">
        {STATUS_TABS.map((t) => (
          <Link
            key={t.value || 'all'}
            href={tabHref(t.value)}
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

      {rows.length === 0 ? (
        <p className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-10 text-center text-stone-400">
          暂无申请。
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((a) => (
            <div key={a.id} className="rounded-lg border border-stone-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-stone-800">{a.pen_name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[a.status]}`}>
                      {AUTHOR_APPLICATION_STATUS_LABELS[a.status]}
                    </span>
                  </div>
                  <div className="mt-0.5 text-sm text-stone-500">
                    {a.email} · 当前身份：{USER_ROLE_LABELS[a.applicant_role]}
                  </div>
                </div>
                <span className="text-xs text-stone-400">{a.created_at.slice(0, 10)}</span>
              </div>

              <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                <Field label="题材" value={a.genre} />
                <Field label="联系邮箱" value={a.contact_email} />
                <Field label="联系电话" value={a.contact_phone} />
                <Field label="社交链接" value={a.social_link} />
              </dl>
              {a.bio && (
                <p className="mt-2 text-sm text-stone-600">
                  <span className="text-stone-400">简介：</span>
                  {a.bio}
                </p>
              )}
              {a.sample_text && (
                <p className="mt-2 whitespace-pre-line rounded-md bg-stone-50 px-3 py-2 text-sm text-stone-600">
                  {a.sample_text}
                </p>
              )}

              {(a.reviewer_email || a.admin_note) && (
                <div className="mt-2 text-xs text-stone-400">
                  {a.reviewer_email && <span>审核人：{a.reviewer_email} </span>}
                  {a.reviewed_at && <span>· {a.reviewed_at.slice(0, 10)} </span>}
                  {a.admin_note && <span>· 备注：{a.admin_note}</span>}
                </div>
              )}

              <div className="mt-3 border-t border-stone-100 pt-3">
                <ReviewButtons id={a.id} status={a.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex gap-2">
      <dt className="text-stone-400">{label}</dt>
      <dd className="text-stone-700">{value || '—'}</dd>
    </div>
  );
}
