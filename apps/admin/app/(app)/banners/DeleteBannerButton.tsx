'use client';

import { deleteBannerAction } from './actions';

export function DeleteBannerButton({ id, label }: { id: string; label: string }) {
  return (
    <form
      action={deleteBannerAction}
      onSubmit={(e) => {
        if (!confirm(`确定删除横幅「${label}」吗？此操作无法撤销。`)) {
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
