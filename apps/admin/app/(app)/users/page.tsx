import Link from 'next/link';
import { createSupabaseServerClient, getCurrentAdminUser } from '@/lib/supabase/server';
import { ROLES, USER_ROLE_LABELS, type Role } from '@guangyu/database';
import { RoleSelect } from './RoleSelect';
import { SuspendButton } from './SuspendButton';
import { DeleteRestoreButton } from './DeleteRestoreButton';
import { SendResetButton } from './SendResetButton';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '全部（不含已删除）' },
  { value: 'active', label: '正常' },
  { value: 'suspended', label: '已停用' },
  { value: 'deleted', label: '已删除' },
];

type UserRow = {
  id: string;
  email: string;
  role: Role;
  display_name: string | null;
  suspended: boolean;
  deleted_at: string | null;
  created_at: string;
  total_count: number;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const roleFilter = (ROLES as readonly string[]).includes(sp.role ?? '') ? (sp.role as Role) : '';
  const statusFilter = ['active', 'suspended', 'deleted'].includes(sp.status ?? '')
    ? (sp.status as string)
    : '';
  const page = Math.max(1, Number(sp.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const session = await getCurrentAdminUser();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('admin_list_users', {
    p_search: q || null,
    p_role: roleFilter || null,
    p_status: statusFilter || null,
    p_limit: PAGE_SIZE,
    p_offset: offset,
  });

  const rows = (data ?? []) as UserRow[];
  const total = rows[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (roleFilter) params.set('role', roleFilter);
    if (statusFilter) params.set('status', statusFilter);
    params.set('page', String(p));
    return `/users?${params.toString()}`;
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">用户管理</h1>
        <p className="text-sm text-stone-500">查看与管理所有用户（仅超级管理员）。</p>
      </header>

      <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-500">
        修改用户角色不会更改其密码：用户仍使用原密码登录，或通过「发送重置邮件」/前台「忘记密码」重置。
        系统不创建账号、不显示或修改密码（需邀请新用户时，请让对方在前台注册后于此处调整角色）。
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-xs text-stone-500">搜索（邮箱或昵称）</span>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="搜索…"
            className="mt-1 block w-56 rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs text-stone-500">角色</span>
          <select
            name="role"
            defaultValue={roleFilter}
            className="mt-1 block rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          >
            <option value="">全部角色</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {USER_ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-stone-500">状态</span>
          <select
            name="status"
            defaultValue={statusFilter}
            className="mt-1 block rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          搜索
        </button>
        {(q || roleFilter || statusFilter) && (
          <Link href="/users" className="px-2 py-2 text-sm text-stone-500 hover:text-brand">
            重置
          </Link>
        )}
      </form>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          加载失败：{error.message}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">邮箱</th>
              <th className="px-4 py-3 font-medium">昵称</th>
              <th className="px-4 py-3 font-medium">角色</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">注册时间</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                  未找到用户。
                </td>
              </tr>
            )}
            {rows.map((u) => {
              const isSelf = u.id === session?.user.id;
              const isDeleted = !!u.deleted_at;
              return (
                <tr key={u.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-stone-800">
                    {u.email}
                    {isSelf && <span className="ml-2 text-xs text-stone-400">(你)</span>}
                  </td>
                  <td className="px-4 py-3 text-stone-500">{u.display_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <RoleSelect id={u.id} role={u.role} disabled={isSelf || isDeleted} />
                  </td>
                  <td className="px-4 py-3">
                    {isDeleted ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                        已删除
                      </span>
                    ) : u.suspended ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                        已停用
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                        正常
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-500">{u.created_at.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-4">
                      {!isDeleted && (
                        <SuspendButton
                          id={u.id}
                          email={u.email}
                          suspended={u.suspended}
                          disabled={isSelf}
                        />
                      )}
                      <DeleteRestoreButton
                        id={u.id}
                        email={u.email}
                        deleted={isDeleted}
                        disabled={isSelf}
                      />
                      {!isDeleted && <SendResetButton email={u.email} />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>
          共 {total} 名用户 · 第 {page} / {totalPages} 页
        </span>
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} className="rounded-md border border-stone-300 px-3 py-1.5 hover:border-brand hover:text-brand">
              上一页
            </Link>
          ) : (
            <span className="rounded-md border border-stone-200 px-3 py-1.5 text-stone-300">上一页</span>
          )}
          {page < totalPages ? (
            <Link href={hrefFor(page + 1)} className="rounded-md border border-stone-300 px-3 py-1.5 hover:border-brand hover:text-brand">
              下一页
            </Link>
          ) : (
            <span className="rounded-md border border-stone-200 px-3 py-1.5 text-stone-300">下一页</span>
          )}
        </div>
      </div>
    </section>
  );
}
