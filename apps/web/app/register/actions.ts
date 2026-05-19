'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type RegisterState = { error?: string; info?: string };

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const displayName = String(formData.get('display_name') ?? '').trim();

  if (!email || !password) return { error: '请输入邮箱和密码。' };
  if (password.length < 8) return { error: '密码至少 8 位。' };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || undefined },
    },
  });
  if (error) return { error: error.message };

  // If email confirmation is enabled, no session is created yet.
  if (!data.session) {
    return { info: '注册成功！请到邮箱确认链接后登录。' };
  }

  redirect('/');
}
