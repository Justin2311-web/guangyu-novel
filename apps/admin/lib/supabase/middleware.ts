import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Role } from '@guangyu/database';

const PUBLIC_PATHS = new Set(['/login', '/auth/callback']);

// Which roles may access each gated section. Longest-prefix match wins.
// Paths not listed here (e.g. '/' overview) are open to any non-reader role.
const SECTION_ACCESS: { prefix: string; roles: Role[] }[] = [
  { prefix: '/users', roles: ['superadmin'] },
  { prefix: '/settings', roles: ['superadmin'] },
  { prefix: '/authors', roles: ['superadmin', 'admin'] },
  { prefix: '/categories', roles: ['superadmin', 'admin'] },
  { prefix: '/banners', roles: ['superadmin', 'admin'] },
  { prefix: '/novels', roles: ['superadmin', 'admin', 'author'] },
  { prefix: '/chapters', roles: ['superadmin', 'admin', 'author'] },
];

function allowedRolesFor(pathname: string): Role[] | null {
  const match = SECTION_ACCESS.find(
    (s) => pathname === s.prefix || pathname.startsWith(`${s.prefix}/`),
  );
  return match ? match.roles : null;
}

export async function updateAdminSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(items) {
          for (const { name, value } of items) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of items) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (!user) {
    if (isPublic) return response;
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated — fetch role + suspension/deletion state.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, suspended, deleted_at')
    .eq('id', user.id)
    .maybeSingle();
  const role = (profile?.role ?? 'reader') as Role;

  // Soft-deleted or suspended users are locked out of the admin entirely.
  if (profile?.deleted_at || profile?.suspended) {
    if (pathname === '/login') return response;
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('error', profile?.deleted_at ? 'deleted' : 'suspended');
    return NextResponse.redirect(url);
  }

  // Readers may not enter the admin app at all.
  if (role === 'reader') {
    if (pathname === '/login') return response; // already at destination — don't loop
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('error', 'forbidden');
    return NextResponse.redirect(url);
  }

  // Section-level authorization for admin/author (superadmin passes everything).
  const allowed = allowedRolesFor(pathname);
  if (allowed && !allowed.includes(role)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('error', 'forbidden');
    return NextResponse.redirect(url);
  }

  if (isPublic) {
    // Already signed in — bounce off the login page.
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return response;
}
