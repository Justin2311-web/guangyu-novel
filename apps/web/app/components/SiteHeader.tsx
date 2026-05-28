'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export type SiteHeaderProps = {
  siteName: string;
  logoUrl: string | null;
  isAuthenticated: boolean;
  isStaff: boolean;
  displayName: string | null;
  unreadCount: number;
};

type NavItem = { href: string; label: string };

const PRIMARY_LINKS: NavItem[] = [
  { href: '/', label: '首页' },
  { href: '/novels', label: '小说' },
  { href: '/rankings', label: '排行榜' },
];

const SECONDARY_LINKS: NavItem[] = [
  { href: '/categories', label: '分类' },
  { href: '/authors', label: '作者' },
];

const ACCOUNT_LINKS: NavItem[] = [
  { href: '/bookshelf', label: '我的书架' },
  { href: '/account', label: '我的账户' },
];

function BellIcon({ unreadCount }: { unreadCount: number }) {
  return (
    <span className="relative inline-flex">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.8 23.8 0 0 0 5.454-1.31A8.97 8.97 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.97 8.97 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m6.714 0a3 3 0 1 1-6.714 0m6.714 0a23.9 23.9 0 0 1-6.714 0"
        />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -right-1.5 -top-1 min-w-[16px] rounded-full bg-brand px-1 text-center text-[10px] font-medium leading-4 text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </span>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
      aria-hidden
    >
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
      )}
    </svg>
  );
}

export function SiteHeader(props: SiteHeaderProps) {
  const { siteName, logoUrl, isAuthenticated, isStaff, displayName, unreadCount } = props;
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer whenever the route changes (covers Link navigations).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Lock body scroll while drawer is open on mobile.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const allMobileLinks: NavItem[] = [
    ...PRIMARY_LINKS,
    ...SECONDARY_LINKS,
    ...(isStaff ? [{ href: '/author/dashboard', label: '作者中心' }] : []),
    ...(isAuthenticated ? ACCOUNT_LINKS : []),
  ];

  const Logo = (
    <Link href="/" className="flex min-w-0 items-center gap-2 text-xl font-bold text-brand">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
      ) : (
        <>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-dark font-serif text-white">
            羽
          </span>
          <span className="truncate font-serif">{siteName}</span>
        </>
      )}
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-amber-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 md:gap-6">
        {Logo}

        {/* Desktop nav (md+) */}
        <nav className="hidden flex-1 items-center gap-4 text-sm text-stone-600 md:flex md:gap-6">
          {PRIMARY_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand">
              {l.label}
            </Link>
          ))}
          {SECONDARY_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand">
              {l.label}
            </Link>
          ))}
          {isStaff && (
            <Link href="/author/dashboard" className="hover:text-brand">
              作者中心
            </Link>
          )}
          {isAuthenticated && (
            <>
              <Link href="/bookshelf" className="hover:text-brand">
                我的书架
              </Link>
              <Link href="/account" className="hover:text-brand">
                我的账户
              </Link>
            </>
          )}
        </nav>

        {/* Desktop auth (md+) */}
        <div className="hidden items-center gap-3 text-sm md:flex">
          {isAuthenticated ? (
            <>
              <Link
                href="/notifications"
                aria-label="通知"
                className="relative text-stone-500 hover:text-brand"
              >
                <BellIcon unreadCount={unreadCount} />
              </Link>
              <span className="max-w-[12rem] truncate text-stone-500">
                {displayName ?? ''}
              </span>
              <form action="/logout" method="post">
                <button className="text-stone-500 hover:text-brand" type="submit">
                  登出
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-stone-600 hover:text-brand">
                登录
              </Link>
              <Link href="/register" className="gy-btn-primary !px-3 !py-1.5">
                注册
              </Link>
            </>
          )}
        </div>

        {/* Mobile right cluster: bell + hamburger */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          {isAuthenticated && (
            <Link
              href="/notifications"
              aria-label="通知"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-stone-500 hover:text-brand"
            >
              <BellIcon unreadCount={unreadCount} />
            </Link>
          )}
          <button
            type="button"
            aria-label={open ? '关闭菜单' : '打开菜单'}
            aria-expanded={open}
            aria-controls="mobile-drawer"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 hover:text-brand"
          >
            <HamburgerIcon open={open} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="关闭菜单"
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-[57px] z-20 bg-black/30 md:hidden"
          />
          {/* Panel */}
          <div
            id="mobile-drawer"
            className="absolute inset-x-0 top-full z-30 border-b border-amber-100 bg-white shadow-lg md:hidden"
          >
            <nav className="mx-auto flex max-w-6xl flex-col px-4 py-3 text-sm">
              {allMobileLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="border-b border-stone-100 py-3 text-stone-700 last:border-0 hover:text-brand"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-stone-100 pt-3">
                {isAuthenticated ? (
                  <>
                    <span className="min-w-0 flex-1 truncate text-stone-500">
                      {displayName ?? ''}
                    </span>
                    <form action="/logout" method="post">
                      <button
                        type="submit"
                        className="rounded-md border border-stone-300 px-3 py-1.5 text-stone-600 hover:border-brand hover:text-brand"
                      >
                        登出
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex w-full items-center justify-end gap-3">
                    <Link href="/login" className="text-stone-600 hover:text-brand">
                      登录
                    </Link>
                    <Link href="/register" className="gy-btn-primary !px-3 !py-1.5">
                      注册
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
