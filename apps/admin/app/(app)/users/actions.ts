'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentAdminUser } from '@/lib/supabase/server';
import { isSuperadmin, ROLES, type Role } from '@guangyu/database';
import type { UserActionResult } from './types';

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function requireSuperadmin() {
  const session = await getCurrentAdminUser();
  if (!session) return { session: null, error: '会话失效，请重新登录。' as const };
  if (!isSuperadmin(session.profile.role)) {
    return { session: null, error: `无权限：当前角色为 ${session.profile.role}。` };
  }
  return { session, error: null };
}

/** A user's role + status, used by the safety guards. */
async function getTarget(supabase: Supabase, id: string) {
  const { data } = await supabase
    .from('profiles')
    .select('id, role, suspended, deleted_at, display_name')
    .eq('id', id)
    .maybeSingle();
  return data as
    | { id: string; role: Role; suspended: boolean; deleted_at: string | null; display_name: string | null }
    | null;
}

/** Ensure a promoted author has a matching authors row (the portal needs it). */
async function ensureAuthorRow(supabase: Supabase, profileId: string, displayName: string | null) {
  const { data: existing } = await supabase
    .from('authors')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle();
  if (existing) return;
  await supabase
    .from('authors')
    .insert({ profile_id: profileId, pen_name: displayName?.trim() || '新作者', status: 'active' });
}

/** Count of OTHER active superadmins (not this id, not deleted, not suspended). */
async function otherActiveSuperadmins(supabase: Supabase, excludeId: string): Promise<number> {
  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'superadmin')
    .eq('suspended', false)
    .is('deleted_at', null)
    .neq('id', excludeId);
  return count ?? 0;
}

export async function updateUserRoleAction(id: string, role: Role): Promise<UserActionResult> {
  const { session, error: authError } = await requireSuperadmin();
  if (!session) return { ok: false, error: authError ?? '无权限。' };

  if (!id || !(ROLES as readonly string[]).includes(role)) return { ok: false, error: '参数无效。' };
  if (id === session.user.id) return { ok: false, error: '不能修改自己的角色。' };

  const supabase = await createSupabaseServerClient();
  const target = await getTarget(supabase, id);
  if (!target) return { ok: false, error: '用户不存在。' };
  // Last-superadmin protection: don't demote the only remaining active superadmin.
  if (target.role === 'superadmin' && role !== 'superadmin') {
    if ((await otherActiveSuperadmins(supabase, id)) === 0) {
      return { ok: false, error: '不能降级最后一个超级管理员。' };
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select('id, role');

  if (error) return { ok: false, error: `数据库错误：${error.code ?? ''} ${error.message}` };
  if (!data || data.length === 0) {
    return { ok: false, error: '更新未生效（影响 0 行，可能被 RLS 拦截）。' };
  }

  // Promoting to author must also create the authors profile the portal needs.
  if (role === 'author') {
    await ensureAuthorRow(supabase, id, target.display_name);
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
  const target = await getTarget(supabase, id);
  if (!target) return { ok: false, error: '用户不存在。' };
  // Last-superadmin protection: don't suspend the only remaining active superadmin.
  if (suspended && target.role === 'superadmin') {
    if ((await otherActiveSuperadmins(supabase, id)) === 0) {
      return { ok: false, error: '不能停用最后一个超级管理员。' };
    }
  }

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

/** Soft-delete a user (reversible). The auth.users row is not removed. */
export async function deleteUserAction(id: string): Promise<UserActionResult> {
  const { session, error: authError } = await requireSuperadmin();
  if (!session) return { ok: false, error: authError ?? '无权限。' };

  if (!id) return { ok: false, error: '参数无效。' };
  if (id === session.user.id) return { ok: false, error: '不能删除自己。' };

  const supabase = await createSupabaseServerClient();
  const target = await getTarget(supabase, id);
  if (!target) return { ok: false, error: '用户不存在。' };
  if (target.deleted_at) return { ok: false, error: '该用户已被删除。' };
  // Last-superadmin protection.
  if (target.role === 'superadmin' && (await otherActiveSuperadmins(supabase, id)) === 0) {
    return { ok: false, error: '不能删除最后一个超级管理员。' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: session.user.id,
      deleted_reason: '由超级管理员删除',
    })
    .eq('id', id)
    .select('id, deleted_at');

  if (error) return { ok: false, error: `数据库错误：${error.code ?? ''} ${error.message}` };
  if (!data || data.length === 0) {
    return { ok: false, error: '删除未生效（影响 0 行，可能被 RLS 拦截）。' };
  }

  revalidatePath('/users');
  return { ok: true };
}

/** Restore a previously soft-deleted user. */
export async function restoreUserAction(id: string): Promise<UserActionResult> {
  const { session, error: authError } = await requireSuperadmin();
  if (!session) return { ok: false, error: authError ?? '无权限。' };
  if (!id) return { ok: false, error: '参数无效。' };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({ deleted_at: null, deleted_by: null, deleted_reason: null })
    .eq('id', id)
    .select('id, deleted_at');

  if (error) return { ok: false, error: `数据库错误：${error.code ?? ''} ${error.message}` };
  if (!data || data.length === 0) {
    return { ok: false, error: '恢复未生效（影响 0 行，可能被 RLS 拦截）。' };
  }

  revalidatePath('/users');
  return { ok: true };
}
