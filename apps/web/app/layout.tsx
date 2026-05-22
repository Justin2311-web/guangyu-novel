import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/queries';
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

  return (
    <html lang="zh-CN">
      <body>
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-brand">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
              ) : (
                siteName
              )}
            </Link>
            <nav className="flex items-center gap-6 text-sm text-stone-600">
              <Link href="/" className="hover:text-brand">首页</Link>
              <Link href="/novels" className="hover:text-brand">小说</Link>
              <Link href="/categories" className="hover:text-brand">分类</Link>
              {session ? (
                <>
                  <Link href="/bookshelf" className="hover:text-brand">我的书架</Link>
                  <Link href="/account" className="hover:text-brand">我的账户</Link>
                  <span className="text-stone-500">
                    {session.profile?.display_name ?? session.user.email}
                  </span>
                  <form action="/logout" method="post">
                    <button className="hover:text-brand" type="submit">登出</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:text-brand">登录</Link>
                  <Link href="/register" className="hover:text-brand">注册</Link>
                </>
              )}
            </nav>
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
