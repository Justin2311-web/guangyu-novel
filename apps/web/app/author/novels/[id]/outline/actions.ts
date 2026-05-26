'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMyAuthor, getMyNovel } from '@/lib/author';
import {
  SECTION_TYPES,
  type OutlineSectionType,
  type OutlineStatus,
} from './constants';

export type OutlineActionResult = { ok: true } | { ok: false; error: string };

const VALID_TYPES = new Set(SECTION_TYPES.map((s) => s.value));
const VALID_STATUS = new Set<OutlineStatus>(['active', 'resolved', 'archived']);

/** Verify the current author owns this novel (RLS also enforces, this is belt+braces). */
async function ownsNovel(novelId: string): Promise<{ ok: true; authorId: string } | { ok: false }> {
  const author = await getMyAuthor();
  if (!author) return { ok: false };
  const novel = await getMyNovel(author.id, novelId);
  if (!novel) return { ok: false };
  return { ok: true, authorId: author.id };
}

export async function createOutlineItemAction(
  novelId: string,
  formData: FormData,
): Promise<OutlineActionResult> {
  const owner = await ownsNovel(novelId);
  if (!owner.ok) return { ok: false, error: '无权操作该作品。' };

  const sectionType = String(formData.get('section_type') ?? '') as OutlineSectionType;
  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  const statusRaw = String(formData.get('status') ?? 'active') as OutlineStatus;

  if (!VALID_TYPES.has(sectionType)) return { ok: false, error: '类型无效。' };
  if (!title) return { ok: false, error: '请填写标题。' };
  const status = VALID_STATUS.has(statusRaw) ? statusRaw : 'active';

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('novel_outlines').insert({
    novel_id: novelId,
    author_id: owner.authorId,
    section_type: sectionType,
    title,
    content: content || null,
    status,
  });
  if (error) return { ok: false, error: `保存失败：${error.message}` };

  revalidatePath(`/author/novels/${novelId}/outline`);
  return { ok: true };
}

export async function updateOutlineItemAction(
  novelId: string,
  itemId: string,
  formData: FormData,
): Promise<OutlineActionResult> {
  const owner = await ownsNovel(novelId);
  if (!owner.ok) return { ok: false, error: '无权操作该作品。' };

  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  const statusRaw = String(formData.get('status') ?? 'active') as OutlineStatus;
  if (!title) return { ok: false, error: '请填写标题。' };
  const status = VALID_STATUS.has(statusRaw) ? statusRaw : 'active';

  const supabase = await createSupabaseServerClient();
  // RLS scopes to the owning author; also constrain by novel_id.
  const { data, error } = await supabase
    .from('novel_outlines')
    .update({ title, content: content || null, status })
    .eq('id', itemId)
    .eq('novel_id', novelId)
    .select('id');
  if (error) return { ok: false, error: `保存失败：${error.message}` };
  if (!data || data.length === 0) return { ok: false, error: '未找到该大纲条目。' };

  revalidatePath(`/author/novels/${novelId}/outline`);
  return { ok: true };
}

export async function deleteOutlineItemAction(
  novelId: string,
  itemId: string,
): Promise<OutlineActionResult> {
  const owner = await ownsNovel(novelId);
  if (!owner.ok) return { ok: false, error: '无权操作该作品。' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('novel_outlines')
    .delete()
    .eq('id', itemId)
    .eq('novel_id', novelId);
  if (error) return { ok: false, error: `删除失败：${error.message}` };

  revalidatePath(`/author/novels/${novelId}/outline`);
  return { ok: true };
}
