'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useActionState } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { useAutosaveDraft, formatDraftTime } from '../useAutosaveDraft';
import type { AuthorFormState } from '../types';

type Action = (prev: AuthorFormState, formData: FormData) => Promise<AuthorFormState>;
type NovelOption = { id: string; title: string };

export type ChapterDefaults = {
  novel_id?: string;
  chapter_number?: number;
  title?: string;
  content?: string;
};

const initial: AuthorFormState = {};
const inputClass =
  'mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-brand focus:outline-none';

/** Visible emptiness check for rich-text HTML (ignores tags / &nbsp / whitespace). */
function isVisuallyEmpty(html: string): boolean {
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s/g, '');
  return text.length === 0;
}

export function ChapterForm({
  action,
  novels,
  defaults,
  lockNovel,
  draftKey,
}: {
  action: Action;
  novels: NovelOption[];
  defaults?: ChapterDefaults;
  lockNovel: boolean;
  draftKey: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const fe = state.fieldErrors ?? {};
  const lockedNovel = novels.find((n) => n.id === defaults?.novel_id);

  const [novelId, setNovelId] = useState(defaults?.novel_id ?? '');
  const [chapterNumber, setChapterNumber] = useState(
    defaults?.chapter_number != null ? String(defaults.chapter_number) : '',
  );
  const [title, setTitle] = useState(defaults?.title ?? '');
  const [content, setContent] = useState(defaults?.content ?? '');
  const [editorKey, setEditorKey] = useState(0);
  const [clientError, setClientError] = useState<string>();

  const draft = useAutosaveDraft(draftKey, () => ({ novelId, chapterNumber, title, content }));
  const savedRef = useRef(false);

  // Mark dirty on any field change → schedules autosave.
  useEffect(() => {
    if (savedRef.current) return;
    draft.touch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novelId, chapterNumber, title, content]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (savedRef.current) return;
      if (!content && !title) return;
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [content, title]);

  function restore() {
    const d = draft.recoverable;
    if (!d) return;
    setNovelId((d.novelId as string) ?? '');
    setChapterNumber((d.chapterNumber as string) ?? '');
    setTitle((d.title as string) ?? '');
    setContent((d.content as string) ?? '');
    setEditorKey((k) => k + 1); // remount editor with restored content
    draft.dismissRecoverable();
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (isVisuallyEmpty(content)) {
      e.preventDefault();
      setClientError('正文不能为空。');
      return;
    }
    setClientError(undefined);
    // Optimistically clear the local draft + disable the unload guard. If the
    // server rejects, autosave will re-create the draft within a few seconds.
    savedRef.current = true;
    draft.clear();
  }

  const chars = useMemo(() => {
    const text = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ');
    return text.replace(/\s/g, '').length;
  }, [content]);
  const readMins = Math.max(1, Math.round(chars / 400));

  const statusText =
    draft.status === 'saving'
      ? '正在自动保存…'
      : draft.lastTs
        ? `已自动保存于 ${formatDraftTime(draft.lastTs)}`
        : '内容会自动保存到本地';

  return (
    <form action={formAction} onSubmit={onSubmit} className="max-w-4xl space-y-4 pb-20">
      {/* Local draft recovery */}
      {draft.recoverable && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>
            检测到本地草稿（{formatDraftTime(draft.recoverable.ts)}），是否恢复？
          </span>
          <span className="flex gap-3">
            <button type="button" onClick={restore} className="font-medium text-brand hover:underline">
              恢复本地草稿
            </button>
            <button type="button" onClick={draft.dismissRecoverable} className="text-stone-500 hover:text-stone-700">
              忽略
            </button>
          </span>
        </div>
      )}

      {/* Tips */}
      <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500">
        支持粗体、斜体、下划线、对齐、列表、引用。内容会自动保存到本地，刷新或意外关闭也可恢复。
      </div>

      <label className="block">
        <span className="text-sm text-stone-600">所属小说 *</span>
        {lockNovel ? (
          <>
            <input type="hidden" name="novel_id" value={novelId} />
            <p className="mt-1 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
              {lockedNovel?.title ?? '—'}
            </p>
          </>
        ) : (
          <select
            name="novel_id"
            value={novelId}
            onChange={(e) => setNovelId(e.target.value)}
            className={inputClass}
          >
            <option value="">— 请选择小说 —</option>
            {novels.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title}
              </option>
            ))}
          </select>
        )}
        {fe.novel_id && <span className="mt-1 block text-sm text-red-600">{fe.novel_id}</span>}
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">章节序号 *</span>
        <input
          type="number"
          name="chapter_number"
          min={1}
          step={1}
          value={chapterNumber}
          onChange={(e) => setChapterNumber(e.target.value)}
          className="mt-1 block w-32 rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        {fe.chapter_number && (
          <span className="mt-1 block text-sm text-red-600">{fe.chapter_number}</span>
        )}
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">标题 *</span>
        <input
          type="text"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
        {fe.title && <span className="mt-1 block text-sm text-red-600">{fe.title}</span>}
      </label>

      <div className="block">
        <div className="flex items-center justify-between">
          <span className="text-sm text-stone-600">正文 *</span>
          <span className="text-xs text-stone-400">
            {chars} 字 · 约 {readMins} 分钟阅读 · {statusText}
          </span>
        </div>
        <div className="mt-1">
          <RichTextEditor key={editorKey} name="content" defaultValue={content} onChange={setContent} />
        </div>
        {fe.content && <span className="mt-1 block text-sm text-red-600">{fe.content}</span>}
      </div>

      {clientError && <p className="text-sm text-red-600">{clientError}</p>}
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      {/* Sticky action bar */}
      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-stone-200 bg-white/90 px-4 py-3 backdrop-blur">
        <button
          type="submit"
          name="intent"
          value="draft"
          disabled={pending}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:border-brand hover:text-brand disabled:opacity-60"
        >
          {pending ? '保存中…' : '保存草稿'}
        </button>
        <button
          type="submit"
          name="intent"
          value="submit"
          disabled={pending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? '提交中…' : '提交审核'}
        </button>
        <Link href="/author/chapters" className="text-sm text-stone-600 hover:text-brand">
          取消
        </Link>
        <span className="ml-auto text-xs text-stone-400">{statusText}</span>
      </div>
    </form>
  );
}
