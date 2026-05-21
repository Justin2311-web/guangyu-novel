import { createChapterAction } from '../actions';
import { ChapterForm } from '../ChapterForm';
import { loadNovelOptions } from '../data';

export const dynamic = 'force-dynamic';

export default async function NewChapterPage({
  searchParams,
}: {
  searchParams: Promise<{ novel?: string }>;
}) {
  const { novel: novelId } = await searchParams;
  const novels = await loadNovelOptions();

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">新建章节</h1>
      <ChapterForm
        action={createChapterAction}
        submitLabel="创建"
        novels={novels}
        lockNovel={false}
        defaults={{ novel_id: novelId }}
      />
    </section>
  );
}
