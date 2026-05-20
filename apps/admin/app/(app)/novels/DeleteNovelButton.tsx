'use client';

import { deleteNovelAction } from './actions';

export function DeleteNovelButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteNovelAction}
      onSubmit={(e) => {
        if (!confirm(`确定删除小说「${title}」吗？其章节也会一并删除，且无法撤销。`)) {
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
