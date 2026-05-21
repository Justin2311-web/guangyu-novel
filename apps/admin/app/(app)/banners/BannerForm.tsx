'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import type { BannerFormState } from './actions';

type Action = (prev: BannerFormState, formData: FormData) => Promise<BannerFormState>;

export type BannerDefaults = {
  title?: string | null;
  image_url?: string;
  mobile_image_url?: string | null;
  link_url?: string | null;
  button_label?: string | null;
  sort_order?: number;
  active?: boolean;
};

const initial: BannerFormState = {};

function Preview({ url, label }: { url: string; label: string }) {
  if (!url) return null;
  return (
    <div className="mt-2">
      <span className="mb-1 block text-xs text-stone-400">{label}预览</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={`${label}预览`}
        className="max-h-40 rounded-md border border-stone-200 object-contain"
      />
    </div>
  );
}

export function BannerForm({
  action,
  submitLabel,
  defaults,
}: {
  action: Action;
  submitLabel: string;
  defaults?: BannerDefaults;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const fe = state.fieldErrors ?? {};
  const [imageUrl, setImageUrl] = useState(defaults?.image_url ?? '');
  const [mobileImageUrl, setMobileImageUrl] = useState(defaults?.mobile_image_url ?? '');

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <label className="block">
        <span className="text-sm text-stone-600">标题（可选）</span>
        <input
          type="text"
          name="title"
          defaultValue={defaults?.title ?? ''}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">桌面端图片 URL *</span>
        <input
          type="url"
          name="image_url"
          required
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…"
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
        />
        {fe.image_url && <span className="mt-1 block text-sm text-red-600">{fe.image_url}</span>}
        <Preview url={imageUrl} label="桌面端" />
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">移动端图片 URL（可选，留空则使用桌面端图片）</span>
        <input
          type="url"
          name="mobile_image_url"
          value={mobileImageUrl}
          onChange={(e) => setMobileImageUrl(e.target.value)}
          placeholder="https://…"
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
        />
        <Preview url={mobileImageUrl} label="移动端" />
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">链接 URL（可选）</span>
        <input
          type="text"
          name="link_url"
          defaultValue={defaults?.link_url ?? ''}
          placeholder="/novels 或 https://…"
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">按钮文字（可选）</span>
        <input
          type="text"
          name="button_label"
          defaultValue={defaults?.button_label ?? ''}
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

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="active"
          defaultChecked={defaults?.active ?? true}
          className="h-4 w-4 rounded border-stone-300"
        />
        <span className="text-sm text-stone-700">启用（在首页显示）</span>
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
        <Link href="/banners" className="text-sm text-stone-600 hover:text-brand">
          取消
        </Link>
      </div>
    </form>
  );
}
