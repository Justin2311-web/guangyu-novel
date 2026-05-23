import { ensureMyAuthor, getMyNovelOptions } from '@/lib/author';
import { createChapterAction } from '../../actions';
import { ChapterForm } from '../ChapterForm';

export const dynamic = 'force-dynamic';

export default async function NewChapterPage({
  searchParams,
}: {
  searchParams: Promise<{ novel?: string }>;
}) {
  const author = await ensureMyAuthor();
  if (!author) return <p className="text-sm text-stone-500">未找到作者资料。</p>;

  const novels = await getMyNovelOptions(author.id);
  const { novel } = await searchParams;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-medium">新增章节</h2>
      <p className="text-sm text-stone-500">章节默认不公开，提交审核后由管理员发布。</p>
      <ChapterForm action={createChapterAction} novels={novels} lockNovel={false} defaults={{ novel_id: novel }} />
    </div>
  );
}
