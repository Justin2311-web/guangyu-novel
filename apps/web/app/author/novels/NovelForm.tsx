'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { NOVEL_SERIAL_STATUSES, NOVEL_SERIAL_STATUS_LABELS } from '@guangyu/database';
import { ImageUploadField } from '../../components/ImageUploadField';
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
}: {
  action: Action;
  categories: Option[];
  defaults?: NovelDefaults;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <label className="block">
        <span className="text-sm text-stone-600">标题 *</span>
        <input type="text" name="title" defaultValue={defaults?.title ?? ''} className={inputClass} />
        {fe.title && <span className="mt-1 block text-sm text-red-600">{fe.title}</span>}
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">别名 / slug（留空按标题生成）</span>
        <input type="text" name="slug" defaultValue={defaults?.slug ?? ''} className={inputClass} />
        {fe.slug && <span className="mt-1 block text-sm text-red-600">{fe.slug}</span>}
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">分类</span>
        <select name="category_id" defaultValue={defaults?.category_id ?? ''} className={inputClass}>
          <option value="">— 未分类 —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <ImageUploadField
        name="cover_image_url"
        label="封面图片（可选）"
        defaultValue={defaults?.cover_image_url ?? ''}
        folder="novels/covers"
      />

      <label className="block">
        <span className="text-sm text-stone-600">简介</span>
        <textarea name="description" rows={5} defaultValue={defaults?.description ?? ''} className={inputClass} />
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">连载状态</span>
        <select name="status" defaultValue={defaults?.status ?? 'ongoing'} className="mt-1 block w-48 rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-brand focus:outline-none">
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
      </div>
    </form>
  );
}
