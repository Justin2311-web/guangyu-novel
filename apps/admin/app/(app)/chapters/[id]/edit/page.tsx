import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Chapter } from '@guangyu/database';
import { updateChapterAction } from '../../actions';
import { ChapterForm } from '../../ChapterForm';
import { loadNovelOptions } from '../../data';

export const dynamic = 'force-dynamic';

export default async function EditChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('chapters')
    .select('id, novel_id, chapter_number, title, content, status')
    .eq('id', id)
    .maybeSingle();

  if (!data) notFound(); // also covers RLS-denied (author editing someone else's)
  const chapter = data as Pick<
    Chapter,
    'id' | 'novel_id' | 'chapter_number' | 'title' | 'content' | 'status'
  >;

  const novels = await loadNovelOptions();
  const action = updateChapterAction.bind(null, chapter.id);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">编辑章节</h1>
      <ChapterForm
        action={action}
        submitLabel="保存"
        novels={novels}
        lockNovel
        defaults={{
          novel_id: chapter.novel_id,
          chapter_number: chapter.chapter_number,
          title: chapter.title,
          content: chapter.content,
          status: chapter.status,
        }}
      />
    </section>
  );
}
