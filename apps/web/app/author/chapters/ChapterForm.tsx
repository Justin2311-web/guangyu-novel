'use client';

import Link from 'next/link';
import { useActionState } from 'react';
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

export function ChapterForm({
  action,
  novels,
  defaults,
  lockNovel,
}: {
  action: Action;
  novels: NovelOption[];
  defaults?: ChapterDefaults;
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
            <p className="mt-1 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
              {lockedNovel?.title ?? '—'}
            </p>
          </>
        ) : (
          <select name="novel_id" defaultValue={defaults?.novel_id ?? ''} className={inputClass}>
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
          defaultValue={defaults?.chapter_number ?? ''}
          className="mt-1 block w-32 rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        {fe.chapter_number && (
          <span className="mt-1 block text-sm text-red-600">{fe.chapter_number}</span>
        )}
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">标题 *</span>
        <input type="text" name="title" defaultValue={defaults?.title ?? ''} className={inputClass} />
        {fe.title && <span className="mt-1 block text-sm text-red-600">{fe.title}</span>}
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">正文 *</span>
        <textarea
          name="content"
          rows={16}
          defaultValue={defaults?.content ?? ''}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm focus:border-brand focus:outline-none"
        />
        {fe.content && <span className="mt-1 block text-sm text-red-600">{fe.content}</span>}
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
        <Link href="/author/chapters" className="text-sm text-stone-600 hover:text-brand">
          取消
        </Link>
      </div>
    </form>
  );
}
