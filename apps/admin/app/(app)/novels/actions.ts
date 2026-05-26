'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient, getCurrentAdminUser } from '@/lib/supabase/server';
import {
  canManageContent,
  NOVEL_SERIAL_STATUSES,
  type NovelSerialStatus,
  type Role,
} from '@guangyu/database';

export type NovelFormState = { error?: string; fieldErrors?: Record<string, string> };

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9一-龥-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

type Session = NonNullable<Awaited<ReturnType<typeof getCurrentAdminUser>>>;

async function requireSession(): Promise<Session | null> {
  const session = await getCurrentAdminUser();
  if (!session) return null;
  const role = session.profile.role;
  if (role !== 'superadmin' && role !== 'admin' && role !== 'author') return null;
  return session;
}

/** Resolve the authors.id for the current author user (null if none). */
async function ownAuthorId(profileId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('authors')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle();
  return data?.id ?? null;
}

function parseForm(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const slugRaw = String(formData.get('slug') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const coverImageUrl = String(formData.get('cover_image_url') ?? '').trim();
  const categoryId = String(formData.get('category_id') ?? '').trim();
  const secondaryCategoryId = String(formData.get('secondary_category_id') ?? '').trim();
  const statusRaw = String(formData.get('status') ?? '').trim();
  const isPublished = formData.get('is_published') != null;
  const authorIdRaw = String(formData.get('author_id') ?? '').trim();

  const fieldErrors: Record<string, string> = {};
  if (!title) fieldErrors.title = '标题为必填项。';

  const slug = slugRaw ? slugify(slugRaw) : slugify(title);
  if (!slug) fieldErrors.slug = '别名不能为空（请使用字母、数字或中文）。';

  if (!categoryId) fieldErrors.category_id = '请选择主分类。';
  if (secondaryCategoryId && secondaryCategoryId === categoryId) {
    fieldErrors.secondary_category_id = '副分类不能与主分类相同。';
  }

  const status = (NOVEL_SERIAL_STATUSES as readonly string[]).includes(statusRaw)
    ? (statusRaw as NovelSerialStatus)
    : 'ongoing';

  return {
    title,
    slug,
    description: description || null,
    coverImageUrl: coverImageUrl || null,
    categoryId: categoryId || null,
    secondaryCategoryId: secondaryCategoryId || null,
    status,
    isPublished,
    authorIdRaw: authorIdRaw || null,
    fieldErrors,
  };
}

export async function createNovelAction(
  _prev: NovelFormState,
  formData: FormData,
): Promise<NovelFormState> {
  const session = await requireSession();
  if (!session) return { error: '没有权限管理小说。' };
  const role = session.profile.role as Role;

  const f = parseForm(formData);

  // Resolve author_id by role.
  let authorId: string | null;
  if (role === 'author') {
    authorId = await ownAuthorId(session.user.id);
    if (!authorId) {
      return { error: '尚未创建作者资料，请联系管理员为你创建作者档案。' };
    }
  } else {
    authorId = f.authorIdRaw;
    if (!authorId) f.fieldErrors.author_id = '请选择作者。';
  }

  if (Object.keys(f.fieldErrors).length) return { fieldErrors: f.fieldErrors };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('novels').insert({
    author_id: authorId,
    category_id: f.categoryId,
    secondary_category_id: f.secondaryCategoryId,
    slug: f.slug,
    title: f.title,
    description: f.description,
    cover_image_url: f.coverImageUrl,
    status: f.status,
    is_published: f.isPublished,
  });

  if (error) {
    if (error.code === '23505') return { fieldErrors: { slug: '该别名已存在，请换一个。' } };
    return { error: error.message };
  }

  revalidatePath('/novels');
  redirect('/novels');
}

export async function updateNovelAction(
  id: string,
  _prev: NovelFormState,
  formData: FormData,
): Promise<NovelFormState> {
  const session = await requireSession();
  if (!session) return { error: '没有权限管理小说。' };
  const role = session.profile.role as Role;

  const f = parseForm(formData);
  // title/slug/category errors always block (author_id only matters on create).
  if (f.fieldErrors.title || f.fieldErrors.slug || f.fieldErrors.category_id || f.fieldErrors.secondary_category_id) {
    return { fieldErrors: f.fieldErrors };
  }

  const update: Record<string, unknown> = {
    category_id: f.categoryId,
    secondary_category_id: f.secondaryCategoryId,
    slug: f.slug,
    title: f.title,
    description: f.description,
    cover_image_url: f.coverImageUrl,
    status: f.status,
    is_published: f.isPublished,
  };
  // Only admins may reassign the author. RLS also blocks authors from
  // moving a novel to a different author.
  if (canManageContent(role) && f.authorIdRaw) {
    update.author_id = f.authorIdRaw;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('novels').update(update).eq('id', id);

  if (error) {
    if (error.code === '23505') return { fieldErrors: { slug: '该别名已存在，请换一个。' } };
    return { error: error.message };
  }

  revalidatePath('/novels');
  revalidatePath(`/novels/${id}/edit`);
  redirect('/novels');
}

export async function deleteNovelAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  if (!session) return;
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('novels').delete().eq('id', id); // RLS enforces ownership
  revalidatePath('/novels');
}
