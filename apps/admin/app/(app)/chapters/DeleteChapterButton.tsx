'use client';

import { deleteChapterAction } from './actions';

export function DeleteChapterButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteChapterAction}
      onSubmit={(e) => {
        if (!confirm(`确定删除章节「${title}」吗？此操作无法撤销。`)) {
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
