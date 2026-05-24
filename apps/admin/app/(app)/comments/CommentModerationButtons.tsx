'use client';

import { useState, useTransition } from 'react';
import type { CommentStatus } from '@guangyu/database';
import { hideCommentAction, restoreCommentAction, deleteCommentAction } from './actions';

export function CommentModerationButtons({ id, status }: { id: string; status: CommentStatus }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function run(fn: (id: string) => Promise<{ ok: boolean; error?: string }>) {
    setError(undefined);
    startTransition(async () => {
      const res = await fn(id);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-3">
        {status === 'visible' && (
          <button
            type="button"
            onClick={() => run(hideCommentAction)}
            disabled={pending}
            className="text-sm text-amber-700 hover:underline disabled:text-stone-300"
          >
            隐藏
          </button>
        )}
        {status !== 'visible' && (
          <button
            type="button"
            onClick={() => run(restoreCommentAction)}
            disabled={pending}
            className="text-sm text-emerald-700 hover:underline disabled:text-stone-300"
          >
            恢复
          </button>
        )}
        {status !== 'deleted' && (
          <button
            type="button"
            onClick={() => run(deleteCommentAction)}
            disabled={pending}
            className="text-sm text-red-600 hover:underline disabled:text-stone-300"
          >
            删除
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
