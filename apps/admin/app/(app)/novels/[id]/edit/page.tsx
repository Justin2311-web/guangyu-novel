import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Novel } from '@guangyu/database';
import { updateNovelAction } from '../../actions';
import { NovelForm } from '../../NovelForm';
import { loadNovelFormData } from '../../data';

export const dynamic = 'force-dynamic';

export default async function EditNovelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('novels')
    .select(
      'id, author_id, category_id, slug, title, description, cover_image_url, status, is_published',
    )
    .eq('id', id)
    .maybeSingle();

  if (!data) notFound(); // also covers RLS-denied (author editing someone else's)
  const novel = data as Pick<
    Novel,
    | 'id'
    | 'author_id'
    | 'category_id'
    | 'slug'
    | 'title'
    | 'description'
    | 'cover_image_url'
    | 'status'
    | 'is_published'
  >;

  const { categories, authors, showAuthorSelect } = await loadNovelFormData();
  const action = updateNovelAction.bind(null, novel.id);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">编辑小说</h1>
      <NovelForm
        action={action}
        submitLabel="保存"
        categories={categories}
        authors={authors}
        showAuthorSelect={showAuthorSelect}
        defaults={{
          title: novel.title,
          slug: novel.slug,
          description: novel.description,
          cover_image_url: novel.cover_image_url,
          category_id: novel.category_id,
          status: novel.status,
          is_published: novel.is_published,
          author_id: novel.author_id,
        }}
      />
    </section>
  );
}
