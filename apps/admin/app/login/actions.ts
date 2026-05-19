'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type AdminAuthState = { error?: string };

export async function adminLoginAction(
  _prev: AdminAuthState,
  formData: FormData,
): Promise<AdminAuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/');

  if (!email || !password) return { error: '请输入邮箱和密码。' };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  // Verify the user actually has admin-level role.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user!.id)
    .maybeSingle();
  const role = profile?.role;

  if (role !== 'superadmin' && role !== 'admin' && role !== 'author') {
    await supabase.auth.signOut();
    return { error: '该账号没有后台访问权限。' };
  }

  redirect(next || '/');
}
