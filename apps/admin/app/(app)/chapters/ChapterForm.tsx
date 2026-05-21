'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { CHAPTER_STATUSES, CHAPTER_STATUS_LABELS } from '@guangyu/database';
import type { ChapterFormState } from './actions';
import type { NovelOption } from './data';

type Action = (prev: ChapterFormState, formData: FormData) => Promise<ChapterFormState>;

export type ChapterDefaults = {
  novel_id?: string;
  chapter_number?: number;
  title?: string;
  content?: string;
  status?: string;
};

const initial: ChapterFormState = {};

export function ChapterForm({
  action,
  submitLabel,
  defaults,
  novels,
  lockNovel,
}: {
  action: Action;
  submitLabel: string;
  defaults?: ChapterDefaults;
  novels: NovelOption[];
  lockNovel: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const fe = state.fieldErrors ?? {};
  const lockedNovel = novels.find((n) => n.id === defaults?.novel_id);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <label className="block">
        <span className="text-sm text-stone-600">所属小说 *</span>
        {lockNovel ? (
          <>
            <input type="hidden" name="novel_id" value={defaults?.novel_id ?? ''} />
            <p className="mt-1 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700">
              {lockedNovel?.label ?? '—'}
            </p>
          </>
        ) : (
          <select
            name="novel_id"
            defaultValue={defaults?.novel_id ?? ''}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
          >
            <option value="">— 请选择小说 —</option>
            {novels.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
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
          required
          defaultValue={defaults?.chapter_number ?? ''}
          className="mt-1 block w-32 rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
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
          required
          defaultValue={defaults?.title ?? ''}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
        />
        {fe.title && <span className="mt-1 block text-sm text-red-600">{fe.title}</span>}
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">正文 *</span>
        <textarea
          name="content"
          rows={16}
          required
          defaultValue={defaults?.content ?? ''}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm focus:border-brand focus:outline-none"
        />
        {fe.content && <span className="mt-1 block text-sm text-red-600">{fe.content}</span>}
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">状态</span>
        <select
          name="status"
          defaultValue={defaults?.status ?? 'draft'}
          className="mt-1 block w-48 rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
        >
          {CHAPTER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CHAPTER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? '保存中…' : submitLabel}
        </button>
        <Link href="/chapters" className="text-sm text-stone-600 hover:text-brand">
          取消
        </Link>
      </div>
    </form>
  );
}
