'use client';

import { useActionState, useState } from 'react';
import { submitAuthorApplicationAction } from './actions';
import type { ApplyActionState } from './types';

const PEN_MAX = 50;
const BIO_MAX = 500;

type Defaults = {
  pen_name?: string;
  bio?: string;
  genre?: string;
  contact_email?: string;
  contact_phone?: string;
  social_link?: string;
  sample_text?: string;
};

const initial: ApplyActionState = {};

const inputClass =
  'mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-brand focus:outline-none';

export function ApplyForm({ defaults, submitLabel }: { defaults?: Defaults; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(submitAuthorApplicationAction, initial);
  const fe = state.fieldErrors ?? {};
  const [penName, setPenName] = useState(defaults?.pen_name ?? '');
  const [bio, setBio] = useState(defaults?.bio ?? '');

  if (state.ok) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        申请已提交，状态：待审核。我们会尽快审核，请留意本页状态更新。
      </div>
    );
  }

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <label className="block">
        <span className="flex items-center justify-between text-sm text-stone-600">
          <span>笔名 *</span>
          <span className="text-xs text-stone-400">{penName.length}/{PEN_MAX}</span>
        </span>
        <input
          name="pen_name"
          required
          maxLength={PEN_MAX}
          value={penName}
          onChange={(e) => setPenName(e.target.value)}
          placeholder="读者将看到的作者名"
          className={inputClass}
        />
        {fe.pen_name && <span className="mt-1 block text-xs text-red-600">{fe.pen_name}</span>}
      </label>

      <label className="block">
        <span className="flex items-center justify-between text-sm text-stone-600">
          <span>作者简介 *</span>
          <span className="text-xs text-stone-400">{bio.length}/{BIO_MAX}</span>
        </span>
        <textarea
          name="bio"
          rows={3}
          maxLength={BIO_MAX}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="简单介绍自己、擅长的题材与写作风格"
          className={inputClass}
        />
        {fe.bio && <span className="mt-1 block text-xs text-red-600">{fe.bio}</span>}
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">擅长题材 / 分类 *</span>
        <input name="genre" required defaultValue={defaults?.genre ?? ''} placeholder="例如：仙侠、都市、玄幻" className={inputClass} />
        {fe.genre && <span className="mt-1 block text-xs text-red-600">{fe.genre}</span>}
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">联系邮箱 *</span>
        <input type="email" name="contact_email" required defaultValue={defaults?.contact_email ?? ''} className={inputClass} />
        {fe.contact_email && <span className="mt-1 block text-xs text-red-600">{fe.contact_email}</span>}
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">联系电话 / WhatsApp（可选）</span>
        <input name="contact_phone" defaultValue={defaults?.contact_phone ?? ''} className={inputClass} />
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">社交 / 媒体链接（可选）</span>
        <input name="social_link" defaultValue={defaults?.social_link ?? ''} placeholder="https://…" className={inputClass} />
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">作品 / 自我介绍样稿（可选）</span>
        <textarea name="sample_text" rows={5} defaultValue={defaults?.sample_text ?? ''} className={inputClass} />
      </label>

      <label className="flex items-start gap-2">
        <input type="checkbox" name="agreement" className="mt-1 h-4 w-4 rounded border-stone-300" />
        <span className="text-sm text-stone-700">我确认拥有或已获授权上传我所提交的作品，并对内容真实性负责。</span>
      </label>
      {fe.agreement && <span className="block text-xs text-red-600">{fe.agreement}</span>}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-md bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? '提交中…' : submitLabel}
      </button>
    </form>
  );
}
