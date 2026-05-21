'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentAdminUser } from '@/lib/supabase/server';
import { isSuperadmin, ROLES, type Role } from '@guangyu/database';

async function requireSuperadmin() {
  const session = await getCurrentAdminUser();
  if (!session || !isSuperadmin(session.profile.role)) return null;
  return session;
}

export async function updateUserRoleAction(formData: FormData): Promise<void> {
  const session = await requireSuperadmin();
  if (!session) return;

  const id = String(formData.get('id') ?? '');
  const role = String(formData.get('role') ?? '') as Role;
  if (!id || !(ROLES as readonly string[]).includes(role)) return;
  // Guard against self-lockout: a superadmin can't demote themselves.
  if (id === session.user.id) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('profiles').update({ role }).eq('id', id); // RLS: superadmin only
  revalidatePath('/users');
}

export async function setUserSuspendedAction(formData: FormData): Promise<void> {
  const session = await requireSuperadmin();
  if (!session) return;

  const id = String(formData.get('id') ?? '');
  const suspended = String(formData.get('suspended') ?? '') === 'true';
  if (!id) return;
  // Guard against self-lockout: a superadmin can't suspend themselves.
  if (id === session.user.id) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('profiles').update({ suspended }).eq('id', id); // RLS: superadmin only
  revalidatePath('/users');
}
