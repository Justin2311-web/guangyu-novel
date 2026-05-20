import { createSupabaseServerClient, getCurrentAdminUser } from '@/lib/supabase/server';
import { canManageContent, type Role } from '@guangyu/database';
import type { Option } from './NovelForm';

export type NovelFormData = {
  role: Role;
  showAuthorSelect: boolean;
  categories: Option[];
  authors: Option[];
};

export async function loadNovelFormData(): Promise<NovelFormData> {
  const session = await getCurrentAdminUser();
  const role = (session?.profile.role ?? 'author') as Role;
  const showAuthorSelect = canManageContent(role);

  const supabase = await createSupabaseServerClient();
  const { data: cats } = await supabase
    .from('categories')
    .select('id, name')
    .order('sort_order', { ascending: true });

  let authors: Option[] = [];
  if (showAuthorSelect) {
    const { data: auth } = await supabase
      .from('authors')
      .select('id, pen_name')
      .order('pen_name', { ascending: true });
    authors = (auth ?? []).map((a) => ({ id: a.id, label: a.pen_name }));
  }

  return {
    role,
    showAuthorSelect,
    categories: (cats ?? []).map((c) => ({ id: c.id, label: c.name })),
    authors,
  };
}
