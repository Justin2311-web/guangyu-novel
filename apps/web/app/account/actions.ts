'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import type { AuthorApplication } from '@guangyu/database';
import type { ApplyActionState } from './types';

function parse(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? '').trim();
  const penName = get('pen_name');
  const bio = get('bio');
  const genre = get('genre');
  const contactEmail = get('contact_email');
  const contactPhone = get('contact_phone');
  const socialLink = get('social_link');
  const sampleText = get('sample_text');
  const agreed = formData.get('agreement') != null;

  const fieldErrors: Record<string, string> = {};
  if (!penName) fieldErrors.pen_name = '请填写笔名。';
  if (!bio) fieldErrors.bio = '请填写作者简介。';
  if (!genre) fieldErrors.genre = '请填写擅长的题材/分类。';
  if (!contactEmail) fieldErrors.contact_email = '请填写联系邮箱。';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
    fieldErrors.contact_email = '邮箱格式不正确。';
  if (!agreed) fieldErrors.agreement = '请确认您拥有作品的合法权利。';

  return {
    penName,
    bio,
    genre,
    contactEmail,
    contactPhone: contactPhone || null,
    socialLink: socialLink || null,
    sampleText: sampleText || null,
    fieldErrors,
  };
}

export async function submitAuthorApplicationAction(
  _prev: ApplyActionState,
  formData: FormData,
): Promise<ApplyActionState> {
  const session = await getCurrentUser();
  if (!session) return { error: '请先登录。' };
  if (session.profile?.deleted_at) return { error: '账户不可用。' };

  const role = session.profile?.role;
  if (role && role !== 'reader') {
    return { error: '您已是作者或管理员，无需申请。' };
  }

  const f = parse(formData);
  if (Object.keys(f.fieldErrors).length) return { fieldErrors: f.fieldErrors };

  const supabase = await createSupabaseServerClient();

  // Look at the user's latest application to decide insert vs resubmit.
  const { data: latest } = await supabase
    .from('author_applications')
    .select('id, status')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const existing = latest as Pick<AuthorApplication, 'id' | 'status'> | null;

  if (existing?.status === 'pending') {
    return { error: '您已有一份待审核的申请，请耐心等待。' };
  }
  if (existing?.status === 'approved') {
    return { error: '您的申请已通过，您已是作者。' };
  }

  const payload = {
    pen_name: f.penName,
    bio: f.bio,
    genre: f.genre,
    contact_email: f.contactEmail,
    contact_phone: f.contactPhone,
    social_link: f.socialLink,
    sample_text: f.sampleText,
    status: 'pending' as const,
    admin_note: null,
    reviewed_by: null,
    reviewed_at: null,
  };

  // Resubmit a rejected/revision application, otherwise create a new one.
  if (existing && (existing.status === 'rejected' || existing.status === 'revision_requested')) {
    const { error } = await supabase
      .from('author_applications')
      .update(payload)
      .eq('id', existing.id)
      .select('id');
    if (error) return { error: `提交失败：${error.message}` };
  } else {
    const { error } = await supabase
      .from('author_applications')
      .insert({ user_id: session.user.id, ...payload });
    if (error) {
      if (error.code === '23505') return { error: '您已有一份待审核的申请。' };
      return { error: `提交失败：${error.message}` };
    }
  }

  revalidatePath('/account');
  return { ok: true };
}
