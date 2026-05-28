'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { COMMENT_MAX_LENGTH, COMMENT_MIN_LENGTH } from '@guangyu/database';
import type { NovelComment } from '@/lib/queries';
import { postCommentAction, deleteCommentAction } from './comment-actions';

/** Returns a short, localized relative timestamp; falls back to YYYY-MM-DD for older dates. */
function formatRelative(iso: string, now: number = Date.now()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso.slice(0, 10);
  const diff = Math.max(0, now - t);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return '刚刚';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day === 1) return '昨天';
  if (day < 7) return `${day} 天前`;
  return iso.slice(0, 10);
}

/** Full local datetime for the `title` tooltip (YYYY-MM-DD HH:mm). */
function formatFull(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
  const [success, setSuccess] = useState<string>();
  const [pending, startTransition] = useTransition();

  const trimmed = content.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < COMMENT_MIN_LENGTH;
  const canSubmit = trimmed.length >= COMMENT_MIN_LENGTH && trimmed.length <= COMMENT_MAX_LENGTH;

  // Auto-dismiss the success banner after a few seconds.
  useEffect(() => {
    if (!success) return;
    const id = window.setTimeout(() => setSuccess(undefined), 3500);
    return () => window.clearTimeout(id);
  }, [success]);

  function submit() {
    if (!canSubmit || pending) return;
    setError(undefined);
    setSuccess(undefined);
    startTransition(async () => {
      const res = await postCommentAction(novelId, novelSlug, content);
      if (res.ok) {
        setContent('');
        setSuccess('评论已发布。');
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
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span
              className={`text-xs ${
                trimmed.length > COMMENT_MAX_LENGTH * 0.9
                  ? 'text-amber-600'
                  : 'text-stone-400'
              }`}
            >
              {trimmed.length}/{COMMENT_MAX_LENGTH}
              {tooShort && <span className="ml-2 text-stone-400">· 至少 {COMMENT_MIN_LENGTH} 个字符</span>}
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
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="mt-2 text-sm text-emerald-600">
              {success}
            </p>
          )}
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
          还没有评论，来发表第一条评论吧。
        </div>
      ) : (
        <ul className="gy-card divide-y divide-stone-100">
          {comments.map((c) => (
            <li key={c.id} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 flex-1 truncate font-medium text-stone-800">
                  {c.displayName}
                </span>
                <time
                  dateTime={c.createdAt}
                  title={formatFull(c.createdAt)}
                  className="shrink-0 text-xs text-stone-400"
                >
                  {formatRelative(c.createdAt)}
                </time>
              </div>
              {/* Rendered as plain text by React — no HTML injection possible. */}
              <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-stone-700">
                {c.content}
              </p>
              {currentUserId === c.userId && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('确认删除这条评论？')) remove(c.id);
                  }}
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
