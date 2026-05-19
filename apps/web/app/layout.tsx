import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '光羽小说',
    template: '%s | 光羽小说',
  },
  description: '光羽小说 — 阅读优质中文小说的开放平台。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-xl font-semibold text-brand">
              光羽小说
            </Link>
            <nav className="flex gap-6 text-sm text-stone-600">
              <Link href="/" className="hover:text-brand">首页</Link>
              <Link href="/novels" className="hover:text-brand">小说</Link>
              <Link href="/categories" className="hover:text-brand">分类</Link>
              <Link href="/login" className="hover:text-brand">登录</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-8rem)] max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-stone-500">
            © {new Date().getFullYear()} 光羽小说. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
