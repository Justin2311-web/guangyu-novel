import { createCategoryAction } from '../actions';
import { CategoryForm } from '../CategoryForm';

export default function NewCategoryPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">新建分类</h1>
      <CategoryForm action={createCategoryAction} submitLabel="创建" />
    </section>
  );
}
