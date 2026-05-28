'use client';

import { useState, useTransition } from 'react';
import type { CommentStatus } from '@guangyu/database';
import { hideCommentAction, restoreCommentAction, deleteCommentAction } from './actions';
import { closeReportsForCommentAction } from './report-actions';

export function CommentModerationButtons({
  id,
  status,
  openReportCount = 0,
}: {
  id: string;
  status: CommentStatus;
  openReportCount?: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function run(fn: (id: string) => Promise<{ ok: boolean; error?: string }>, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setError(undefined);
    startTransition(async () => {
      const res = await fn(id);
      if (!res.ok) setError(res.error);
    });
  }

  function closeReports(kind: 'resolved' | 'dismissed') {
    setError(undefined);
    startTransition(async () => {
      const res = await closeReportsForCommentAction(id, kind);
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
            onClick={() => run(deleteCommentAction, '确认删除该评论？将不再公开显示。')}
            disabled={pending}
            className="text-sm text-red-600 hover:underline disabled:text-stone-300"
          >
            删除
          </button>
        )}
        {openReportCount > 0 && (
          <>
            <button
              type="button"
              onClick={() => closeReports('resolved')}
              disabled={pending}
              className="text-sm text-stone-500 hover:text-emerald-700 hover:underline disabled:text-stone-300"
            >
              标记已处理
            </button>
            <button
              type="button"
              onClick={() => closeReports('dismissed')}
              disabled={pending}
              className="text-sm text-stone-500 hover:text-stone-700 hover:underline disabled:text-stone-300"
            >
              忽略举报
            </button>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
