import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/queries';
import { getUnreadNotificationCount } from '@/lib/notifications';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const name = s['site.name'] || '光羽小说';
  return {
    title: {
      default: s['seo.meta_title'] || name,
      template: `%s | ${name}`,
    },
    description: s['seo.meta_description'] || s['site.description'] || undefined,
    keywords: s['seo.meta_keywords'] ? s['seo.meta_keywords'].split(',').map((k) => k.trim()) : undefined,
    icons: s['site.favicon_url'] ? { icon: s['site.favicon_url'] } : undefined,
  };
}

const SOCIALS: { key: keyof Awaited<ReturnType<typeof getSiteSettings>>; label: string }[] = [
  { key: 'social.facebook', label: 'Facebook' },
  { key: 'social.instagram', label: 'Instagram' },
  { key: 'social.tiktok', label: 'TikTok' },
  { key: 'social.youtube', label: 'YouTube' },
  { key: 'social.discord', label: 'Discord' },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, settings] = await Promise.all([getCurrentUser(), getSiteSettings()]);
  const siteName = settings['site.name'] || '光羽小说';
  const logoUrl = settings['site.logo_url'];
  const socials = SOCIALS.filter((s) => settings[s.key]);

  const isStaff = ['author', 'admin', 'superadmin'].includes(session?.profile?.role ?? '');
  const unreadCount = session ? await getUnreadNotificationCount() : 0;

  return (
    <html lang="zh-CN">
      <body>
        <header className="sticky top-0 z-30 border-b border-amber-100 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-brand">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
              ) : (
                <>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-dark font-serif text-white">
                    羽
                  </span>
                  <span className="font-serif">{siteName}</span>
                </>
              )}
            </Link>
            <nav className="flex flex-1 flex-wrap items-center gap-4 text-sm text-stone-600 sm:gap-6">
              <Link href="/" className="hover:text-brand">首页</Link>
              <Link href="/novels" className="hover:text-brand">小说</Link>
              <Link href="/rankings" className="hover:text-brand">排行榜</Link>
              <Link href="/categories" className="hover:text-brand">分类</Link>
              <Link href="/authors" className="hover:text-brand">作者</Link>
              {isStaff && (
                <Link href="/author/dashboard" className="hover:text-brand">作者中心</Link>
              )}
              <Link href="/bookshelf" className="hover:text-brand">我的书架</Link>
              <Link href="/account" className="hover:text-brand">我的账户</Link>
            </nav>
            <div className="flex items-center gap-3 text-sm">
              {session ? (
                <>
                  <Link
                    href="/notifications"
                    aria-label="通知"
                    className="relative text-stone-500 hover:text-brand"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.8 23.8 0 0 0 5.454-1.31A8.97 8.97 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.97 8.97 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m6.714 0a3 3 0 1 1-6.714 0m6.714 0a23.9 23.9 0 0 1-6.714 0" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -right-2 -top-1.5 min-w-[16px] rounded-full bg-brand px-1 text-center text-[10px] font-medium leading-4 text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <span className="hidden text-stone-500 sm:inline">
                    {session.profile?.display_name ?? session.user.email}
                  </span>
                  <form action="/logout" method="post">
                    <button className="text-stone-500 hover:text-brand" type="submit">登出</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-stone-600 hover:text-brand">登录</Link>
                  <Link href="/register" className="gy-btn-primary !px-3 !py-1.5">注册</Link>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-8rem)] max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 text-sm text-stone-500">
            {settings['footer.about'] && (
              <p className="max-w-2xl leading-relaxed">{settings['footer.about']}</p>
            )}

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {socials.map((s) => (
                <a
                  key={s.key}
                  href={settings[s.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand"
                >
                  {s.label}
                </a>
              ))}
            </div>

            {(settings['contact.email'] ||
              settings['contact.phone'] ||
              settings['contact.address']) && (
              <div className="space-y-0.5">
                {settings['contact.email'] && <div>邮箱：{settings['contact.email']}</div>}
                {settings['contact.phone'] && <div>电话：{settings['contact.phone']}</div>}
                {settings['contact.address'] && <div>地址：{settings['contact.address']}</div>}
              </div>
            )}

            <div className="border-t border-stone-100 pt-4 text-stone-400">
              {settings['footer.copyright'] || `© ${siteName}. All rights reserved.`}
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
