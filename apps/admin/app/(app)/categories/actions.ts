'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient, getCurrentAdminUser } from '@/lib/supabase/server';
import { canManageContent } from '@guangyu/database';

export type CategoryFormState = { error?: string; fieldErrors?: Record<string, string> };

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9一-龥-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function assertCanManage() {
  const session = await getCurrentAdminUser();
  if (!session || !canManageContent(session.profile.role)) {
    return false;
  }
  return true;
}

function parseForm(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const slugRaw = String(formData.get('slug') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const sortOrderRaw = String(formData.get('sort_order') ?? '').trim();

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = '名称为必填项。';

  const slug = slugRaw ? slugify(slugRaw) : slugify(name);
  if (!slug) fieldErrors.slug = '别名不能为空（请使用字母、数字或中文）。';

  let sortOrder = 0;
  if (sortOrderRaw) {
    const n = Number(sortOrderRaw);
    if (Number.isNaN(n)) fieldErrors.sort_order = '排序必须是数字。';
    else sortOrder = Math.trunc(n);
  }

  return {
    name,
    slug,
    description: description || null,
    sortOrder,
    fieldErrors,
  };
}

export async function createCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  if (!(await assertCanManage())) return { error: '没有权限管理分类。' };

  const { name, slug, description, sortOrder, fieldErrors } = parseForm(formData);
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('categories')
    .insert({ name, slug, description, sort_order: sortOrder });

  if (error) {
    if (error.code === '23505') {
      return { fieldErrors: { slug: '该别名已存在，请换一个。' } };
    }
    return { error: error.message };
  }

  revalidatePath('/categories');
  redirect('/categories');
}

export async function updateCategoryAction(
  id: string,
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  if (!(await assertCanManage())) return { error: '没有权限管理分类。' };

  const { name, slug, description, sortOrder, fieldErrors } = parseForm(formData);
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('categories')
    .update({ name, slug, description, sort_order: sortOrder })
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      return { fieldErrors: { slug: '该别名已存在，请换一个。' } };
    }
    return { error: error.message };
  }

  revalidatePath('/categories');
  redirect('/categories');
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  if (!(await assertCanManage())) return;
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from('categories').delete().eq('id', id);
  revalidatePath('/categories');
}
