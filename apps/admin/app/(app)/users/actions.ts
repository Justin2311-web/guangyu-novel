'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentAdminUser } from '@/lib/supabase/server';
import { isSuperadmin, ROLES, type Role } from '@guangyu/database';

export type UserActionResult = { ok: boolean; error?: string };

async function requireSuperadmin() {
  const session = await getCurrentAdminUser();
  if (!session) return { session: null, error: '会话失效，请重新登录。' as const };
  if (!isSuperadmin(session.profile.role)) {
    return { session: null, error: `无权限：当前角色为 ${session.profile.role}。` };
  }
  return { session, error: null };
}

export async function updateUserRoleAction(id: string, role: Role): Promise<UserActionResult> {
  const { session, error: authError } = await requireSuperadmin();
  if (!session) return { ok: false, error: authError ?? '无权限。' };

  if (!id || !(ROLES as readonly string[]).includes(role)) return { ok: false, error: '参数无效。' };
  if (id === session.user.id) return { ok: false, error: '不能修改自己的角色。' };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select('id, role'); // surfaces RLS 0-row writes and returns the persisted value

  if (error) return { ok: false, error: `数据库错误：${error.code ?? ''} ${error.message}` };
  if (!data || data.length === 0) {
    return { ok: false, error: '更新未生效（影响 0 行，可能被 RLS 拦截）。' };
  }

  revalidatePath('/users');
  return { ok: true };
}

export async function setUserSuspendedAction(
  id: string,
  suspended: boolean,
): Promise<UserActionResult> {
  const { session, error: authError } = await requireSuperadmin();
  if (!session) return { ok: false, error: authError ?? '无权限。' };

  if (!id) return { ok: false, error: '参数无效。' };
  if (id === session.user.id) return { ok: false, error: '不能停用自己。' };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({ suspended })
    .eq('id', id)
    .select('id, suspended');

  if (error) return { ok: false, error: `数据库错误：${error.code ?? ''} ${error.message}` };
  if (!data || data.length === 0) {
    return { ok: false, error: '更新未生效（影响 0 行，可能被 RLS 拦截）。' };
  }

  revalidatePath('/users');
  return { ok: true };
}
