'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import type { CategoryFormState } from './actions';

type Action = (prev: CategoryFormState, formData: FormData) => Promise<CategoryFormState>;

export type CategoryDefaults = {
  name?: string;
  slug?: string;
  description?: string | null;
  sort_order?: number;
};

const initial: CategoryFormState = {};

export function CategoryForm({
  action,
  defaults,
  submitLabel,
}: {
  action: Action;
  defaults?: CategoryDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <label className="block">
        <span className="text-sm text-stone-600">名称 *</span>
        <input
          type="text"
          name="name"
          required
          defaultValue={defaults?.name ?? ''}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
        />
        {fe.name && <span className="mt-1 block text-sm text-red-600">{fe.name}</span>}
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">别名 / slug（留空则按名称自动生成）</span>
        <input
          type="text"
          name="slug"
          defaultValue={defaults?.slug ?? ''}
          placeholder="例如：xianxia"
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
        />
        {fe.slug && <span className="mt-1 block text-sm text-red-600">{fe.slug}</span>}
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">描述（可选）</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={defaults?.description ?? ''}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">排序（数字，越小越靠前）</span>
        <input
          type="number"
          name="sort_order"
          defaultValue={defaults?.sort_order ?? 0}
          className="mt-1 block w-32 rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
        />
        {fe.sort_order && <span className="mt-1 block text-sm text-red-600">{fe.sort_order}</span>}
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
        <Link href="/categories" className="text-sm text-stone-600 hover:text-brand">
          取消
        </Link>
      </div>
    </form>
  );
}
