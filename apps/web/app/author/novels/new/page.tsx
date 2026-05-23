import { getCategories } from '@/lib/queries';
import { createNovelAction } from '../../actions';
import { NovelForm } from '../NovelForm';

export const dynamic = 'force-dynamic';

export default async function NewNovelPage() {
  const categories = await getCategories();
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-medium">新增小说</h2>
      <p className="text-sm text-stone-500">
        新作品默认不公开。「保存草稿」可稍后继续编辑；「提交审核」后由管理员审核发布。
      </p>
      <NovelForm action={createNovelAction} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
