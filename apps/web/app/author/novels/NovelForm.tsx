'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useActionState } from 'react';
import { NOVEL_SERIAL_STATUSES, NOVEL_SERIAL_STATUS_LABELS } from '@guangyu/database';
import { ImageUploadField } from '../../components/ImageUploadField';
import { useAutosaveDraft, formatDraftTime } from '../useAutosaveDraft';
import type { AuthorFormState } from '../types';

type Action = (prev: AuthorFormState, formData: FormData) => Promise<AuthorFormState>;
type Option = { id: string; name: string };

export type NovelDefaults = {
  title?: string;
  slug?: string;
  description?: string | null;
  cover_image_url?: string | null;
  category_id?: string | null;
  status?: string;
};

const initial: AuthorFormState = {};
const inputClass =
  'mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-brand focus:outline-none';

export function NovelForm({
  action,
  categories,
  defaults,
  draftKey,
}: {
  action: Action;
  categories: Option[];
  defaults?: NovelDefaults;
  draftKey: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const fe = state.fieldErrors ?? {};

  const [title, setTitle] = useState(defaults?.title ?? '');
  const [slug, setSlug] = useState(defaults?.slug ?? '');
  const [description, setDescription] = useState(defaults?.description ?? '');
  const [categoryId, setCategoryId] = useState(defaults?.category_id ?? '');
  const [status, setStatus] = useState(defaults?.status ?? 'ongoing');
  const [coverUrl, setCoverUrl] = useState(defaults?.cover_image_url ?? '');
  const [imgKey, setImgKey] = useState(0);

  const draft = useAutosaveDraft(draftKey, () => ({
    title,
    slug,
    description,
    categoryId,
    status,
    coverUrl,
  }));
  const savedRef = useRef(false);

  useEffect(() => {
    if (savedRef.current) return;
    draft.touch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, slug, description, categoryId, status, coverUrl]);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (savedRef.current || !title) return;
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [title]);

  function restore() {
    const d = draft.recoverable;
    if (!d) return;
    setTitle((d.title as string) ?? '');
    setSlug((d.slug as string) ?? '');
    setDescription((d.description as string) ?? '');
    setCategoryId((d.categoryId as string) ?? '');
    setStatus((d.status as string) ?? 'ongoing');
    setCoverUrl((d.coverUrl as string) ?? '');
    setImgKey((k) => k + 1);
    draft.dismissRecoverable();
  }

  function onSubmit() {
    savedRef.current = true;
    draft.clear();
  }

  const statusText =
    draft.status === 'saving'
      ? '正在自动保存…'
      : draft.lastTs
        ? `已自动保存于 ${formatDraftTime(draft.lastTs)}`
        : '内容会自动保存到本地';

  return (
    <form action={formAction} onSubmit={onSubmit} className="max-w-2xl space-y-4">
      {draft.recoverable && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>检测到本地草稿（{formatDraftTime(draft.recoverable.ts)}），是否恢复？</span>
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

      <label className="block">
        <span className="text-sm text-stone-600">标题 *</span>
        <input type="text" name="title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        {fe.title && <span className="mt-1 block text-sm text-red-600">{fe.title}</span>}
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">别名 / slug（留空按标题生成）</span>
        <input type="text" name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} />
        {fe.slug && <span className="mt-1 block text-sm text-red-600">{fe.slug}</span>}
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">分类</span>
        <select name="category_id" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
          <option value="">— 未分类 —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <ImageUploadField
        key={imgKey}
        name="cover_image_url"
        label="封面图片（可选）"
        defaultValue={coverUrl}
        folder="novels/covers"
        onChange={setCoverUrl}
      />

      <label className="block">
        <span className="text-sm text-stone-600">简介</span>
        <textarea
          name="description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">连载状态</span>
        <select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-1 block w-48 rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          {NOVEL_SERIAL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {NOVEL_SERIAL_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex flex-wrap items-center gap-3">
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
        <Link href="/author/novels" className="text-sm text-stone-600 hover:text-brand">
          取消
        </Link>
        <span className="ml-auto text-xs text-stone-400">{statusText}</span>
      </div>
    </form>
  );
}
