'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient, getCurrentAdminUser } from '@/lib/supabase/server';
import { canManageContent } from '@guangyu/database';

export type BannerFormState = { error?: string; fieldErrors?: Record<string, string> };

async function assertCanManage() {
  const session = await getCurrentAdminUser();
  return !!session && canManageContent(session.profile.role);
}

function parseForm(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const imageUrl = String(formData.get('image_url') ?? '').trim();
  const mobileImageUrl = String(formData.get('mobile_image_url') ?? '').trim();
  const linkUrl = String(formData.get('link_url') ?? '').trim();
  const buttonLabel = String(formData.get('button_label') ?? '').trim();
  const sortOrderRaw = String(formData.get('sort_order') ?? '').trim();
  const active = formData.get('active') != null;

  const fieldErrors: Record<string, string> = {};
  if (!imageUrl) fieldErrors.image_url = '桌面端图片 URL 为必填项。';

  let sortOrder = 0;
  if (sortOrderRaw) {
    const n = Number(sortOrderRaw);
    if (Number.isNaN(n)) fieldErrors.sort_order = '排序必须是数字。';
    else sortOrder = Math.trunc(n);
  }

  return {
    title: title || null,
    imageUrl,
    mobileImageUrl: mobileImageUrl || null,
    linkUrl: linkUrl || null,
    buttonLabel: buttonLabel || null,
    sortOrder,
    active,
    fieldErrors,
  };
}

export async function createBannerAction(
  _prev: BannerFormState,
  formData: FormData,
): Promise<BannerFormState> {
  if (!(await assertCanManage())) return { error: '没有权限管理横幅。' };

  const f = parseForm(formData);
  if (Object.keys(f.fieldErrors).length) return { fieldErrors: f.fieldErrors };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('banners').insert({
    title: f.title,
    image_url: f.imageUrl,
    mobile_image_url: f.mobileImageUrl,
    link_url: f.linkUrl,
    button_label: f.buttonLabel,
    sort_order: f.sortOrder,
    active: f.active,
  });

  if (error) return { error: error.message };

  revalidatePath('/banners');
  redirect('/banners');
}

export async function updateBannerAction(
  id: string,
  _prev: BannerFormState,
  formData: FormData,
): Promise<BannerFormState> {
  if (!(await assertCanManage())) return { error: '没有权限管理横幅。' };

  const f = parseForm(formData);
  if (Object.keys(f.fieldErrors).length) return { fieldErrors: f.fieldErrors };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('banners')
    .update({
      title: f.title,
      image_url: f.imageUrl,
      mobile_image_url: f.mobileImageUrl,
      link_url: f.linkUrl,
      button_label: f.buttonLabel,
      sort_order: f.sortOrder,
      active: f.active,
    })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/banners');
  redirect('/banners');
}

export async function deleteBannerAction(formData: FormData): Promise<void> {
  if (!(await assertCanManage())) return;
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('banners').delete().eq('id', id);
  revalidatePath('/banners');
}
