'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import {
  NOVEL_SERIAL_STATUSES,
  NOVEL_SERIAL_STATUS_LABELS,
} from '@guangyu/database';
import { ImageUploadField } from '../../components/ImageUploadField';
import type { NovelFormState } from './actions';

type Action = (prev: NovelFormState, formData: FormData) => Promise<NovelFormState>;

export type NovelDefaults = {
  title?: string;
  slug?: string;
  description?: string | null;
  cover_image_url?: string | null;
  category_id?: string | null;
  secondary_category_id?: string | null;
  status?: string;
  is_published?: boolean;
  author_id?: string | null;
};

export type Option = { id: string; label: string };

const initial: NovelFormState = {};

export function NovelForm({
  action,
  submitLabel,
  defaults,
  categories,
  authors,
  showAuthorSelect,
}: {
  action: Action;
  submitLabel: string;
  defaults?: NovelDefaults;
  categories: Option[];
  authors: Option[];
  showAuthorSelect: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const fe = state.fieldErrors ?? {};
  const [categoryId, setCategoryId] = useState(defaults?.category_id ?? '');
  const [secondaryCategoryId, setSecondaryCategoryId] = useState(defaults?.secondary_category_id ?? '');

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
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
        <span className="text-sm text-stone-600">别名 / slug（留空则按标题自动生成）</span>
        <input
          type="text"
          name="slug"
          defaultValue={defaults?.slug ?? ''}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
        />
        {fe.slug && <span className="mt-1 block text-sm text-red-600">{fe.slug}</span>}
      </label>

      {showAuthorSelect && (
        <label className="block">
          <span className="text-sm text-stone-600">作者 *</span>
          <select
            name="author_id"
            defaultValue={defaults?.author_id ?? ''}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
          >
            <option value="">— 请选择作者 —</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
          {fe.author_id && <span className="mt-1 block text-sm text-red-600">{fe.author_id}</span>}
        </label>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-stone-600">主分类 *</span>
          <select
            name="category_id"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
          >
            <option value="">— 请选择 —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          {fe.category_id && <span className="mt-1 block text-sm text-red-600">{fe.category_id}</span>}
        </label>
        <label className="block">
          <span className="text-sm text-stone-600">副分类（可选）</span>
          <select
            name="secondary_category_id"
            value={secondaryCategoryId}
            onChange={(e) => setSecondaryCategoryId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
          >
            <option value="">— 无 —</option>
            {categories
              .filter((c) => c.id !== categoryId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
          </select>
          {fe.secondary_category_id && (
            <span className="mt-1 block text-sm text-red-600">{fe.secondary_category_id}</span>
          )}
        </label>
      </div>
      <p className="-mt-2 text-xs text-stone-400">最多 2 个分类，主分类必填，副分类不能与主分类相同。</p>

      <ImageUploadField
        name="cover_image_url"
        label="封面图片（可选）"
        defaultValue={defaults?.cover_image_url ?? ''}
        folder="novels/covers"
      />

      <label className="block">
        <span className="text-sm text-stone-600">描述</span>
        <textarea
          name="description"
          rows={5}
          defaultValue={defaults?.description ?? ''}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">连载状态</span>
        <select
          name="status"
          defaultValue={defaults?.status ?? 'ongoing'}
          className="mt-1 block w-48 rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
        >
          {NOVEL_SERIAL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {NOVEL_SERIAL_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={defaults?.is_published ?? false}
          className="h-4 w-4 rounded border-stone-300"
        />
        <span className="text-sm text-stone-700">公开发布（读者可见）</span>
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
        <Link href="/novels" className="text-sm text-stone-600 hover:text-brand">
          取消
        </Link>
      </div>
    </form>
  );
}
