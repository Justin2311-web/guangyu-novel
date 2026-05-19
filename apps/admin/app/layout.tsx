import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: '光羽小说 管理后台',
  description: '光羽小说 — 管理后台与作者中心。',
};

const navItems: { href: string; label: string }[] = [
  { href: '/', label: '概览' },
  { href: '/users', label: '用户' },
  { href: '/authors', label: '作者' },
  { href: '/novels', label: '小说' },
  { href: '/chapters', label: '章节' },
  { href: '/categories', label: '分类' },
  { href: '/banners', label: '横幅' },
  { href: '/settings', label: '站点设置' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="flex min-h-screen">
          <aside className="w-56 shrink-0 border-r border-stone-200 bg-white">
            <div className="px-5 py-5">
              <Link href="/" className="text-lg font-semibold text-brand">
                光羽 · 后台
              </Link>
            </div>
            <nav className="space-y-1 px-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 hover:text-brand"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 px-8 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
