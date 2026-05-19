import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Role } from '@guangyu/database';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(items) {
          try {
            for (const { name, value, options } of items) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // ignored — middleware refreshes the session
          }
        },
      },
    },
  );
}

export type CurrentAdminUser = {
  user: { id: string; email: string | null };
  profile: { id: string; role: Role; display_name: string | null };
};

export async function getCurrentAdminUser(): Promise<CurrentAdminUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, display_name')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile) return null;
  return {
    user: { id: user.id, email: user.email ?? null },
    profile: profile as CurrentAdminUser['profile'],
  };
}
