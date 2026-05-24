'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { COMMENT_MAX_LENGTH, COMMENT_MIN_LENGTH } from '@guangyu/database';
import type { NovelComment } from '@/lib/queries';
import { postCommentAction, deleteCommentAction } from './comment-actions';

export function CommentSection({
  novelId,
  novelSlug,
  comments,
  count,
  isLoggedIn,
  currentUserId,
}: {
  novelId: string;
  novelSlug: string;
  comments: NovelComment[];
  count: number;
  isLoggedIn: boolean;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const trimmed = content.trim();
  const canSubmit = trimmed.length >= COMMENT_MIN_LENGTH && trimmed.length <= COMMENT_MAX_LENGTH;

  function submit() {
    setError(undefined);
    startTransition(async () => {
      const res = await postCommentAction(novelId, novelSlug, content);
      if (res.ok) {
        setContent('');
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function remove(id: string) {
    setError(undefined);
    startTransition(async () => {
      const res = await deleteCommentAction(id, novelSlug);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <section>
      <h2 className="gy-heading mb-3">
        评论 <span className="text-sm font-normal text-stone-400">（{count}）</span>
      </h2>

      {isLoggedIn ? (
        <div className="gy-card mb-5 p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={COMMENT_MAX_LENGTH}
            placeholder="写下你的评论…"
            className="block w-full resize-y rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-stone-400">
              {trimmed.length}/{COMMENT_MAX_LENGTH}
            </span>
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit || pending}
              className="gy-btn-primary !px-4 !py-1.5 disabled:opacity-50"
            >
              {pending ? '发布中…' : '发表评论'}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="gy-card mb-5 px-4 py-5 text-center text-sm text-stone-500">
          <Link
            href={`/login?next=/novels/${encodeURIComponent(novelSlug)}`}
            className="text-brand hover:underline"
          >
            登录
          </Link>
          后即可发表评论。
        </div>
      )}

      {comments.length === 0 ? (
        <div className="gy-card px-4 py-10 text-center text-sm text-stone-500">
          暂无评论，成为第一个评论的人
        </div>
      ) : (
        <ul className="gy-card divide-y divide-stone-100">
          {comments.map((c) => (
            <li key={c.id} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-stone-800">{c.displayName}</span>
                <span className="shrink-0 text-xs text-stone-400">{c.createdAt.slice(0, 10)}</span>
              </div>
              {/* Rendered as plain text by React — no HTML injection possible. */}
              <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-stone-700">
                {c.content}
              </p>
              {currentUserId === c.userId && (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  disabled={pending}
                  className="mt-1 text-xs text-stone-400 hover:text-red-600 disabled:opacity-50"
                >
                  删除
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
