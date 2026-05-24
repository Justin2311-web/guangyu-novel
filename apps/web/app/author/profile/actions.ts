'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ensureMyAuthor } from '@/lib/author';
import type { ProfileActionState } from './types';

function isValidUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function updateAuthorProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  // ensureMyAuthor resolves (and self-heals) the current user's authors row;
  // it returns null for anyone without author access.
  const author = await ensureMyAuthor();
  if (!author) return { error: '未找到作者资料，无法保存。' };

  const get = (k: string) => String(formData.get(k) ?? '').trim();
  const penName = get('pen_name');
  const bio = get('bio');
  const avatarUrl = get('avatar_url');

  const fieldErrors: Record<string, string> = {};
  if (!penName) fieldErrors.pen_name = '请填写笔名。';
  else if (penName.length > 50) fieldErrors.pen_name = '笔名请控制在 50 字以内。';
  if (bio.length > 1000) fieldErrors.bio = '简介请控制在 1000 字以内。';
  if (avatarUrl && !isValidUrl(avatarUrl)) fieldErrors.avatar_url = '请填写有效的图片链接（http/https）。';
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createSupabaseServerClient();
  // RLS "authors: self manage" scopes this update to the caller's own row.
  const { error } = await supabase
    .from('authors')
    .update({
      pen_name: penName,
      bio: bio || null,
      avatar_url: avatarUrl || null,
    })
    .eq('id', author.id)
    .select('id');

  if (error) return { error: `保存失败：${error.message}` };

  revalidatePath('/author/profile');
  revalidatePath('/author/dashboard');
  if (author.slug) revalidatePath(`/authors/${author.slug}`);
  revalidatePath('/authors');
  return { ok: true };
}
