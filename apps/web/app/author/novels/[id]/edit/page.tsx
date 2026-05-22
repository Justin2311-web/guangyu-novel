import { notFound } from 'next/navigation';
import { getCategories } from '@/lib/queries';
import { getMyAuthor, getMyNovel } from '@/lib/author';
import { updateNovelAction } from '../../../actions';
import { NovelForm } from '../../NovelForm';

export const dynamic = 'force-dynamic';

export default async function EditNovelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const author = await getMyAuthor();
  if (!author) notFound();

  const novel = await getMyNovel(author.id, id);
  if (!novel) notFound(); // not owned / not found

  const categories = await getCategories();
  const action = updateNovelAction.bind(null, novel.id);

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-medium">编辑小说</h2>
      <NovelForm
        action={action}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        defaults={{
          title: novel.title,
          slug: novel.slug,
          description: novel.description,
          cover_image_url: novel.cover_image_url,
          category_id: novel.category_id,
          status: novel.status,
        }}
      />
    </div>
  );
}
