'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient, getCurrentAdminUser } from '@/lib/supabase/server';
import { CHAPTER_STATUSES, type ChapterStatus } from '@guangyu/database';

export type ChapterFormState = { error?: string; fieldErrors?: Record<string, string> };

async function requireSession(): Promise<boolean> {
  const session = await getCurrentAdminUser();
  if (!session) return false;
  const role = session.profile.role;
  return role === 'superadmin' || role === 'admin' || role === 'author';
}

function parseForm(formData: FormData) {
  const novelId = String(formData.get('novel_id') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  const numberRaw = String(formData.get('chapter_number') ?? '').trim();
  const statusRaw = String(formData.get('status') ?? '').trim();

  const fieldErrors: Record<string, string> = {};
  if (!novelId) fieldErrors.novel_id = '请选择所属小说。';
  if (!title) fieldErrors.title = '标题为必填项。';
  if (!content) fieldErrors.content = '正文不能为空。';

  const chapterNumber = Number(numberRaw);
  if (!Number.isInteger(chapterNumber) || chapterNumber < 1) {
    fieldErrors.chapter_number = '章节序号需为正整数。';
  }

  const status = (CHAPTER_STATUSES as readonly string[]).includes(statusRaw)
    ? (statusRaw as ChapterStatus)
    : 'draft';

  return { novelId, title, content, chapterNumber, status, fieldErrors };
}

export async function createChapterAction(
  _prev: ChapterFormState,
  formData: FormData,
): Promise<ChapterFormState> {
  if (!(await requireSession())) return { error: '没有权限管理章节。' };

  const f = parseForm(formData);
  if (Object.keys(f.fieldErrors).length) return { fieldErrors: f.fieldErrors };

  const supabase = await createSupabaseServerClient();
  // RLS enforces that authors can only insert chapters under novels they own.
  const { error } = await supabase.from('chapters').insert({
    novel_id: f.novelId,
    chapter_number: f.chapterNumber,
    title: f.title,
    content: f.content,
    status: f.status,
  });

  if (error) {
    if (error.code === '23505') {
      return { fieldErrors: { chapter_number: '该小说下已存在相同序号的章节。' } };
    }
    return { error: error.message };
  }

  revalidatePath('/chapters');
  redirect(`/chapters?novel=${f.novelId}`);
}

export async function updateChapterAction(
  id: string,
  _prev: ChapterFormState,
  formData: FormData,
): Promise<ChapterFormState> {
  if (!(await requireSession())) return { error: '没有权限管理章节。' };

  const f = parseForm(formData);
  if (Object.keys(f.fieldErrors).length) return { fieldErrors: f.fieldErrors };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('chapters')
    .update({
      chapter_number: f.chapterNumber,
      title: f.title,
      content: f.content,
      status: f.status,
    })
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      return { fieldErrors: { chapter_number: '该小说下已存在相同序号的章节。' } };
    }
    return { error: error.message };
  }

  revalidatePath('/chapters');
  revalidatePath(`/chapters/${id}/edit`);
  redirect(`/chapters?novel=${f.novelId}`);
}

export async function deleteChapterAction(formData: FormData): Promise<void> {
  if (!(await requireSession())) return;
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('chapters').delete().eq('id', id); // RLS enforces ownership
  revalidatePath('/chapters');
}
