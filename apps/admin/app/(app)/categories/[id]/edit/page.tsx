import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Category } from '@guangyu/database';
import { updateCategoryAction } from '../../actions';
import { CategoryForm } from '../../CategoryForm';

export const dynamic = 'force-dynamic';

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('categories')
    .select('id, slug, name, description, sort_order, created_at')
    .eq('id', id)
    .maybeSingle();

  if (!data) notFound();
  const category = data as Category;

  // Bind the id so the form action matches (prev, formData) signature.
  const action = updateCategoryAction.bind(null, category.id);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">编辑分类</h1>
      <CategoryForm
        action={action}
        submitLabel="保存"
        defaults={{
          name: category.name,
          slug: category.slug,
          description: category.description,
          sort_order: category.sort_order,
        }}
      />
    </section>
  );
}
