import Link from 'next/link';
import { getCurrentAdminUser } from '@/lib/supabase/server';
import type { Role } from '@guangyu/database';

type NavItem = { href: string; label: string; roles: Role[] };

const NAV: NavItem[] = [
  { href: '/', label: '概览', roles: ['superadmin', 'admin'] },
  { href: '/novels', label: '小说', roles: ['superadmin', 'admin', 'author'] },
  { href: '/chapters', label: '章节', roles: ['superadmin', 'admin', 'author'] },
  { href: '/review/novels', label: '审核 · 小说', roles: ['superadmin', 'admin'] },
  { href: '/review/chapters', label: '审核 · 章节', roles: ['superadmin', 'admin'] },
  { href: '/authors', label: '作者申请', roles: ['superadmin', 'admin'] },
  { href: '/comments', label: '评论管理', roles: ['superadmin', 'admin'] },
  { href: '/categories', label: '分类', roles: ['superadmin', 'admin'] },
  { href: '/banners', label: '横幅', roles: ['superadmin', 'admin'] },
  { href: '/users', label: '用户', roles: ['superadmin'] },
  { href: '/settings', label: '站点设置', roles: ['superadmin'] },
];

const ROLE_LABEL: Record<Role, string> = {
  superadmin: '超级管理员',
  admin: '管理员',
  author: '作者',
  reader: '读者',
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Middleware guarantees we are authenticated with a non-reader role here.
  const session = await getCurrentAdminUser();
  const role = (session?.profile.role ?? 'author') as Role;
  const items = NAV.filter((item) => item.roles.includes(role));

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-stone-200 bg-white">
        <div className="px-5 py-5">
          <Link href="/" className="text-lg font-semibold text-brand">
            光羽 · 后台
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-stone-200 px-4 py-4 text-xs text-stone-500">
          <div className="font-medium text-stone-700">
            {session?.profile.display_name ?? session?.user.email}
          </div>
          <div className="mt-0.5">{ROLE_LABEL[role]}</div>
          <form action="/logout" method="post" className="mt-3">
            <button type="submit" className="text-stone-600 hover:text-brand">
              登出
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 px-8 py-6">{children}</main>
    </div>
  );
}
