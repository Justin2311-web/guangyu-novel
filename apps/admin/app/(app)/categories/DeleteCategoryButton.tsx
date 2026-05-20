'use client';

import { deleteCategoryAction } from './actions';

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteCategoryAction}
      onSubmit={(e) => {
        if (!confirm(`确定删除分类「${name}」吗？此操作无法撤销。`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-sm text-red-600 hover:underline">
        删除
      </button>
    </form>
  );
}
