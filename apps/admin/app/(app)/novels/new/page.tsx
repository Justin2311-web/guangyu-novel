import { createNovelAction } from '../actions';
import { NovelForm } from '../NovelForm';
import { loadNovelFormData } from '../data';

export const dynamic = 'force-dynamic';

export default async function NewNovelPage() {
  const { categories, authors, showAuthorSelect } = await loadNovelFormData();

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">新建小说</h1>
      <NovelForm
        action={createNovelAction}
        submitLabel="创建"
        categories={categories}
        authors={authors}
        showAuthorSelect={showAuthorSelect}
      />
    </section>
  );
}
