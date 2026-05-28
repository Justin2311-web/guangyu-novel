import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/queries';
import { getUnreadNotificationCount } from '@/lib/notifications';
import { SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION } from '@/lib/site';
import { SiteHeader } from './components/SiteHeader';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const name = s['site.name'] || SITE_NAME;
  const defaultTitle = s['seo.meta_title'] || DEFAULT_TITLE;
  const description = s['seo.meta_description'] || s['site.description'] || DEFAULT_DESCRIPTION;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: defaultTitle,
      template: `%s | ${name}`,
    },
    description,
    applicationName: name,
    keywords: s['seo.meta_keywords']
      ? s['seo.meta_keywords'].split(',').map((k) => k.trim())
      : ['小说', '在线阅读', '玄幻', '都市', '仙侠', '免费小说'],
    alternates: { canonical: '/' },
    robots: { index: true, follow: true },
    icons: s['site.favicon_url'] ? { icon: s['site.favicon_url'] } : undefined,
    openGraph: {
      type: 'website',
      siteName: name,
      title: defaultTitle,
      description,
      url: SITE_URL,
      locale: 'zh_CN',
    },
    twitter: {
      card: 'summary_large_image',
      title: defaultTitle,
      description,
    },
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

  const displayName = session?.profile?.display_name ?? session?.user.email ?? null;

  return (
    <html lang="zh-CN">
      <body>
        <SiteHeader
          siteName={siteName}
          logoUrl={logoUrl ?? null}
          isAuthenticated={!!session}
          isStaff={isStaff}
          displayName={displayName}
          unreadCount={unreadCount}
        />
        <main className="mx-auto min-h-[calc(100vh-8rem)] w-full max-w-6xl px-4 py-8">{children}</main>
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
