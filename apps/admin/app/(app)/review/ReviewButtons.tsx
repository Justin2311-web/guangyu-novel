'use client';

import { useState, useTransition } from 'react';
import {
  approveNovelAction,
  rejectNovelAction,
  approveChapterAction,
  rejectChapterAction,
} from './actions';

export function ReviewButtons({
  id,
  kind,
  status,
}: {
  id: string;
  kind: 'novel' | 'chapter';
  status: string; // current review status: pending_review | published | rejected | ...
}) {
  const [pending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>();

  const approve = kind === 'novel' ? approveNovelAction : approveChapterAction;
  const reject = kind === 'novel' ? rejectNovelAction : rejectChapterAction;

  function onApprove() {
    setError(undefined);
    startTransition(async () => {
      const res = await approve(id);
      if (!res.ok) setError(res.error);
    });
  }

  function onReject() {
    setError(undefined);
    startTransition(async () => {
      const res = await reject(id, note);
      if (!res.ok) setError(res.error);
      else setShowReject(false);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {status !== 'published' && (
          <button
            type="button"
            onClick={onApprove}
            disabled={pending}
            className="text-sm text-emerald-700 hover:underline disabled:text-stone-300"
          >
            批准
          </button>
        )}
        {status !== 'rejected' && (
          <button
            type="button"
            onClick={() => setShowReject((v) => !v)}
            disabled={pending}
            className="text-sm text-red-600 hover:underline disabled:text-stone-300"
          >
            拒绝
          </button>
        )}
      </div>

      {showReject && (
        <div className="space-y-2 rounded-md border border-stone-200 bg-stone-50 p-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="请填写拒绝原因（作者可见）"
            className="block w-full rounded-md border border-stone-300 px-2 py-1 text-sm focus:border-brand focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReject}
              disabled={pending || !note.trim()}
              className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              确认拒绝
            </button>
            <button
              type="button"
              onClick={() => setShowReject(false)}
              className="text-xs text-stone-500 hover:text-stone-700"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
