import { notFound } from 'next/navigation';
import { getMyAuthor, getMyNovels, getMyChapter, getMyNovelOptions } from '@/lib/author';
import { updateChapterAction } from '../../../actions';
import { ChapterForm } from '../../ChapterForm';

export const dynamic = 'force-dynamic';

export default async function EditChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const author = await getMyAuthor();
  if (!author) notFound();

  const novels = await getMyNovels(author.id);
  const chapter = await getMyChapter(novels.map((n) => n.id), id);
  if (!chapter) notFound();

  const options = await getMyNovelOptions(author.id);
  const action = updateChapterAction.bind(null, chapter.id);

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-medium">编辑章节</h2>
      {chapter.status === 'rejected' && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="font-medium">审核未通过</div>
          {chapter.review_note && <div className="mt-1">拒绝原因：{chapter.review_note}</div>}
          <div className="mt-1 text-red-600/80">修改后可重新「提交审核」。</div>
        </div>
      )}
      <ChapterForm
        action={action}
        novels={options}
        lockNovel
        defaults={{
          novel_id: chapter.novel_id,
          chapter_number: chapter.chapter_number,
          title: chapter.title,
          content: chapter.content,
        }}
      />
    </div>
  );
}
