import { createSupabaseServerClient } from '@/lib/supabase/server';

export type NovelOption = { id: string; label: string };

/** Novels visible to the current user (RLS-scoped: authors see their own). */
export async function loadNovelOptions(): Promise<NovelOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('novels')
    .select('id, title')
    .order('created_at', { ascending: false });

  return (data ?? []).map((n) => ({ id: n.id, label: n.title }));
}
