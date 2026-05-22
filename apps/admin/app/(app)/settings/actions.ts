'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentAdminUser } from '@/lib/supabase/server';
import { canManageContent, SITE_SETTING_KEYS } from '@guangyu/database';
import type { SettingsActionResult } from './fields';

export async function saveSiteSettingsAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const session = await getCurrentAdminUser();
  if (!session || !canManageContent(session.profile.role)) {
    return { ok: false, error: '没有权限修改站点设置。' };
  }

  // Collect every known key from the form (missing → empty string).
  const rows = SITE_SETTING_KEYS.map((key) => ({
    key,
    value: String(formData.get(key) ?? '').trim(),
  }));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('site_settings')
    .upsert(rows, { onConflict: 'key' }); // RLS: admin/superadmin only

  if (error) return { ok: false, error: `保存失败：${error.code ?? ''} ${error.message}` };

  // Revalidate this admin route. The reader site reads settings dynamically
  // (cookie-based Supabase client → no full-route cache), so it reflects
  // changes on the next request without a cross-app revalidation.
  revalidatePath('/settings');
  return { ok: true };
}
