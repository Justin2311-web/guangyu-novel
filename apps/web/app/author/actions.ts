'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { NOVEL_SERIAL_STATUSES, CHAPTER_STATUSES, type NovelSerialStatus } from '@guangyu/database';
import { ensureMyAuthor } from '@/lib/author';
import { sanitizeChapterHtml, chapterPlainText } from '@/lib/chapter-content';
import type { AuthorFormState } from './types';

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9一-龥-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Resolve the active author context (blocks deleted/suspended/non-authors). */
async function authorContext(): Promise<
  { ok: true; authorId: string } | { ok: false; error: string }
> {
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: '请先登录。' };
  const profile = session.profile as { role?: string; deleted_at?: string | null; suspended?: boolean } | null;
  if (profile?.deleted_at || profile?.suspended) return { ok: false, error: '账户不可用。' };
  const role = profile?.role ?? 'reader';
  if (role !== 'author' && role !== 'admin' && role !== 'superadmin') {
    return { ok: false, error: '没有作者权限。' };
  }
  // Self-heal a missing authors row (e.g. promoted via the admin role dropdown).
  const author = await ensureMyAuthor();
  if (!author) return { ok: false, error: '尚未创建作者资料，请联系管理员。' };
  return { ok: true, authorId: author.id };
}

function parseNovel(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const slugRaw = String(formData.get('slug') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const coverImageUrl = String(formData.get('cover_image_url') ?? '').trim();
  const categoryId = String(formData.get('category_id') ?? '').trim();
  let secondaryCategoryId = String(formData.get('secondary_category_id') ?? '').trim();
  const statusRaw = String(formData.get('status') ?? '').trim();
  const intent = String(formData.get('intent') ?? 'draft');

  const fieldErrors: Record<string, string> = {};
  if (!title) fieldErrors.title = '请填写标题。';
  const slug = slugRaw ? slugify(slugRaw) : slugify(title);
  if (!slug) fieldErrors.slug = '别名不能为空（字母、数字或中文）。';

  // Dual category: primary required; secondary optional and must differ.
  if (!categoryId) fieldErrors.category_id = '请选择主分类。';
  if (secondaryCategoryId && secondaryCategoryId === categoryId) {
    fieldErrors.secondary_category_id = '副分类不能与主分类相同。';
  }
  if (!secondaryCategoryId) secondaryCategoryId = '';

  const status = (NOVEL_SERIAL_STATUSES as readonly string[]).includes(statusRaw)
    ? (statusRaw as NovelSerialStatus)
    : 'ongoing';
  const reviewStatus = intent === 'submit' ? 'pending_review' : 'draft';

  return {
    title,
    slug,
    description: description || null,
    coverImageUrl: coverImageUrl || null,
    categoryId: categoryId || null,
    secondaryCategoryId: secondaryCategoryId || null,
    status,
    reviewStatus,
    fieldErrors,
  };
}

export async function createNovelAction(
  _prev: AuthorFormState,
  formData: FormData,
): Promise<AuthorFormState> {
  const ctx = await authorContext();
  if (!ctx.ok) return { error: ctx.error };

  const f = parseNovel(formData);
  if (Object.keys(f.fieldErrors).length) return { fieldErrors: f.fieldErrors };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('novels').insert({
    author_id: ctx.authorId,
    category_id: f.categoryId,
    secondary_category_id: f.secondaryCategoryId,
    slug: f.slug,
    title: f.title,
    description: f.description,
    cover_image_url: f.coverImageUrl,
    status: f.status,
    review_status: f.reviewStatus, // draft or pending_review
    is_published: false, // authors never publish directly
  });

  if (error) {
    if (error.code === '23505') return { fieldErrors: { slug: '该别名已存在，请换一个。' } };
    return { error: error.message };
  }

  revalidatePath('/author/novels');
  redirect('/author/novels');
}

export async function updateNovelAction(
  id: string,
  _prev: AuthorFormState,
  formData: FormData,
): Promise<AuthorFormState> {
  const ctx = await authorContext();
  if (!ctx.ok) return { error: ctx.error };

  const f = parseNovel(formData);
  if (Object.keys(f.fieldErrors).length) return { fieldErrors: f.fieldErrors };

  const supabase = await createSupabaseServerClient();
  // RLS "novels: author write own" ensures the author can only update their own.
  const { data, error } = await supabase
    .from('novels')
    .update({
      category_id: f.categoryId,
      secondary_category_id: f.secondaryCategoryId,
      slug: f.slug,
      title: f.title,
      description: f.description,
      cover_image_url: f.coverImageUrl,
      status: f.status,
      review_status: f.reviewStatus,
    })
    .eq('id', id)
    .eq('author_id', ctx.authorId)
    .select('id');

  if (error) {
    if (error.code === '23505') return { fieldErrors: { slug: '该别名已存在，请换一个。' } };
    return { error: error.message };
  }
  if (!data || data.length === 0) return { error: '未找到可编辑的作品（或无权限）。' };

  revalidatePath('/author/novels');
  redirect('/author/novels');
}

function parseChapter(formData: FormData) {
  const novelId = String(formData.get('novel_id') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  // Sanitize rich-text HTML before it ever reaches the DB (defense also on render).
  const content = sanitizeChapterHtml(String(formData.get('content') ?? ''));
  const numberRaw = String(formData.get('chapter_number') ?? '').trim();
  const intent = String(formData.get('intent') ?? 'draft');

  const fieldErrors: Record<string, string> = {};
  if (!novelId) fieldErrors.novel_id = '请选择所属小说。';
  if (!title) fieldErrors.title = '请填写标题。';
  // Reject content that is visually empty after stripping formatting.
  if (!chapterPlainText(content)) fieldErrors.content = '正文不能为空。';
  const chapterNumber = Number(numberRaw);
  if (!Number.isInteger(chapterNumber) || chapterNumber < 1) {
    fieldErrors.chapter_number = '章节序号需为正整数。';
  }
  const status = intent === 'submit' ? 'pending_review' : 'draft';
  return { novelId, title, content, chapterNumber, status, fieldErrors };
}

/** Verify a novel belongs to the current author (RLS-backed). */
async function ownsNovel(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  authorId: string,
  novelId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('novels')
    .select('id')
    .eq('id', novelId)
    .eq('author_id', authorId)
    .maybeSingle();
  return !!data;
}

export async function createChapterAction(
  _prev: AuthorFormState,
  formData: FormData,
): Promise<AuthorFormState> {
  const ctx = await authorContext();
  if (!ctx.ok) return { error: ctx.error };

  const f = parseChapter(formData);
  if (Object.keys(f.fieldErrors).length) return { fieldErrors: f.fieldErrors };

  const supabase = await createSupabaseServerClient();
  if (!(await ownsNovel(supabase, ctx.authorId, f.novelId))) {
    return { fieldErrors: { novel_id: '只能为自己的作品添加章节。' } };
  }

  const { error } = await supabase.from('chapters').insert({
    novel_id: f.novelId,
    chapter_number: f.chapterNumber,
    title: f.title,
    content: f.content,
    status: (CHAPTER_STATUSES as readonly string[]).includes(f.status) ? f.status : 'draft',
  });

  if (error) {
    if (error.code === '23505') {
      return { fieldErrors: { chapter_number: '该小说下已存在相同序号的章节。' } };
    }
    return { error: error.message };
  }

  revalidatePath('/author/chapters');
  redirect(`/author/chapters?novel=${f.novelId}`);
}

export async function updateChapterAction(
  id: string,
  _prev: AuthorFormState,
  formData: FormData,
): Promise<AuthorFormState> {
  const ctx = await authorContext();
  if (!ctx.ok) return { error: ctx.error };

  const f = parseChapter(formData);
  if (Object.keys(f.fieldErrors).length) return { fieldErrors: f.fieldErrors };

  const supabase = await createSupabaseServerClient();
  if (!(await ownsNovel(supabase, ctx.authorId, f.novelId))) {
    return { fieldErrors: { novel_id: '只能编辑自己作品的章节。' } };
  }

  // RLS "chapters: author write own" enforces ownership via the parent novel.
  const { data, error } = await supabase
    .from('chapters')
    .update({
      chapter_number: f.chapterNumber,
      title: f.title,
      content: f.content,
      status: (CHAPTER_STATUSES as readonly string[]).includes(f.status) ? f.status : 'draft',
    })
    .eq('id', id)
    .select('id');

  if (error) {
    if (error.code === '23505') {
      return { fieldErrors: { chapter_number: '该小说下已存在相同序号的章节。' } };
    }
    return { error: error.message };
  }
  if (!data || data.length === 0) return { error: '未找到可编辑的章节（或无权限）。' };

  revalidatePath('/author/chapters');
  redirect('/author/chapters');
}
