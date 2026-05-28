'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  COMMENT_REPORT_DETAILS_MAX,
  COMMENT_REPORT_REASONS,
  COMMENT_REPORT_REASON_LABELS,
  type CommentReportReason,
} from '@guangyu/database';
import { reportCommentAction } from './comment-report-action';

/**
 * Small inline "举报" trigger that expands into a reason picker + optional
 * details textarea. Logged-in only; otherwise the button is hidden — the
 * parent already renders a global login prompt for the comment form.
 */
export function ReportCommentButton({
  commentId,
  isLoggedIn,
}: {
  commentId: string;
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<CommentReportReason>('spam');
  const [details, setDetails] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  // Auto-dismiss success after a few seconds and close the dialog.
  useEffect(() => {
    if (!success) return;
    const id = window.setTimeout(() => {
      setSuccess(undefined);
      setOpen(false);
      setDetails('');
    }, 3000);
    return () => window.clearTimeout(id);
  }, [success]);

  if (!isLoggedIn) return null;

  function submit() {
    if (pending) return;
    setError(undefined);
    setSuccess(undefined);
    startTransition(async () => {
      const res = await reportCommentAction(commentId, reason, details);
      if (res.ok) {
        setSuccess('举报已提交，感谢反馈。');
      } else {
        setError(res.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError(undefined);
          setSuccess(undefined);
        }}
        className="text-xs text-stone-400 hover:text-amber-700"
      >
        举报
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-md border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-medium text-stone-700">举报评论</span>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(undefined);
            setSuccess(undefined);
          }}
          className="text-stone-400 hover:text-stone-600"
          aria-label="关闭"
        >
          取消
        </button>
      </div>
      <fieldset className="space-y-1">
        <legend className="sr-only">举报理由</legend>
        {COMMENT_REPORT_REASONS.map((r) => (
          <label key={r} className="flex items-center gap-2">
            <input
              type="radio"
              name={`report-${commentId}`}
              value={r}
              checked={reason === r}
              onChange={() => setReason(r)}
              className="h-3.5 w-3.5"
            />
            <span>{COMMENT_REPORT_REASON_LABELS[r]}</span>
          </label>
        ))}
      </fieldset>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        rows={2}
        maxLength={COMMENT_REPORT_DETAILS_MAX}
        placeholder="补充说明（可选）"
        className="mt-2 block w-full resize-y rounded-md border border-stone-300 px-2 py-1.5 text-xs focus:border-brand focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[10px] text-stone-400">
          {details.length}/{COMMENT_REPORT_DETAILS_MAX}
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {pending ? '提交中…' : '提交举报'}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mt-1.5 text-xs text-emerald-600">
          {success}
        </p>
      )}
    </div>
  );
}
