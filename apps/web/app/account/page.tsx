import Link from 'next/link';
import type { Metadata } from 'next';
import {
  AUTHOR_APPLICATION_STATUS_LABELS,
  USER_ROLE_LABELS,
  type AuthorApplication,
  type Role,
} from '@guangyu/database';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { ApplyForm } from './ApplyForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '我的账户' };

export default async function AccountPage() {
  const session = await getCurrentUser();

  if (!session) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">我的账户</h1>
        <p className="text-stone-600">请登录后查看账户与作者申请。</p>
        <Link
          href="/login?next=/account"
          className="inline-flex rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          去登录
        </Link>
      </section>
    );
  }

  const role = (session.profile?.role ?? 'reader') as Role;
  const deleted = !!session.profile?.deleted_at;
  const isAuthorOrAbove = role === 'author' || role === 'admin' || role === 'superadmin';

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('author_applications')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const app = data as AuthorApplication | null;

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">我的账户</h1>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5 text-sm">
        <dl className="space-y-1.5">
          <div className="flex gap-3">
            <dt className="w-20 text-stone-400">邮箱</dt>
            <dd className="text-stone-700">{session.user.email}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-20 text-stone-400">昵称</dt>
            <dd className="text-stone-700">{session.profile?.display_name ?? '—'}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-20 text-stone-400">身份</dt>
            <dd className="text-stone-700">{USER_ROLE_LABELS[role]}</dd>
          </div>
        </dl>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">作者申请</h2>

        {isAuthorOrAbove ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
            <div className="font-medium">您已是作者 ✓</div>
            <p className="mt-1 text-emerald-700/80">在作者中心创建小说、上传章节并提交审核。</p>
            <Link
              href="/author/dashboard"
              className="mt-3 inline-flex rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              进入作者中心
            </Link>
          </div>
        ) : deleted ? (
          <p className="text-sm text-stone-500">账户不可用，无法提交申请。</p>
        ) : app && app.status === 'pending' ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            申请状态：{AUTHOR_APPLICATION_STATUS_LABELS[app.status]}。我们会尽快审核。
          </div>
        ) : app && app.status === 'approved' ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            申请已通过，您现在是作者。
          </div>
        ) : (
          <>
            {app && (app.status === 'rejected' || app.status === 'revision_requested') && (
              <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-sm">
                <div className="font-medium text-stone-700">
                  上次申请状态：{AUTHOR_APPLICATION_STATUS_LABELS[app.status]}
                </div>
                {app.admin_note && (
                  <div className="mt-1 text-stone-500">管理员备注：{app.admin_note}</div>
                )}
              </div>
            )}
            {!app && (
              <div className="rounded-md border border-amber-100 bg-amber-50/60 px-4 py-4 text-sm text-stone-600">
                <div className="font-medium text-stone-800">成为光羽作者</div>
                <p className="mt-1">通过作者申请后，您可以：</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-stone-600">
                  <li>创建并管理自己的小说</li>
                  <li>使用富文本编辑器撰写并上传章节</li>
                  <li>提交作品给管理员审核</li>
                  <li>审核通过后，作品将在前台公开展示</li>
                </ul>
                <p className="mt-2 text-stone-500">填写下面的表单即可申请。</p>
              </div>
            )}
            <ApplyForm
              submitLabel={app ? '修改后重新提交' : '申请成为作者'}
              defaults={
                app
                  ? {
                      pen_name: app.pen_name,
                      bio: app.bio ?? '',
                      genre: app.genre ?? '',
                      contact_email: app.contact_email ?? '',
                      contact_phone: app.contact_phone ?? '',
                      social_link: app.social_link ?? '',
                      sample_text: app.sample_text ?? '',
                    }
                  : undefined
              }
            />
          </>
        )}
      </div>
    </section>
  );
}
