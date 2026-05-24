import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/author/dashboard', label: '概览' },
  { href: '/author/novels', label: '我的作品' },
  { href: '/author/chapters', label: '章节管理' },
  { href: '/author/profile', label: '作者资料' },
  { href: '/author/analytics', label: '数据中心' },
];

export default async function AuthorLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();

  // Must be logged in.
  if (!session) redirect('/login?next=/author/dashboard');

  // Deleted or suspended users are blocked from the author portal.
  const profile = session.profile as
    | { role?: string; deleted_at?: string | null; suspended?: boolean }
    | null;
  if (profile?.deleted_at || profile?.suspended) redirect('/account');

  // Readers without author access are sent to the application page.
  const role = profile?.role ?? 'reader';
  if (role !== 'author' && role !== 'admin' && role !== 'superadmin') {
    redirect('/account');
  }

  return (
    <section className="space-y-6">
      <header className="border-b border-stone-200 pb-3">
        <h1 className="text-2xl font-semibold">作者中心</h1>
        <nav className="mt-2 flex gap-4 text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-stone-600 hover:text-brand">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </section>
  );
}
