'use client';

import { useActionState, useState } from 'react';
import { AuthorAvatar } from '../../components/AuthorAvatar';
import { updateAuthorProfileAction } from './actions';
import type { ProfileActionState } from './types';

type Defaults = { pen_name: string; bio: string; avatar_url: string };

const initial: ProfileActionState = {};

const inputClass =
  'mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-brand focus:outline-none';

export function AuthorProfileForm({ defaults }: { defaults: Defaults }) {
  const [state, formAction, pending] = useActionState(updateAuthorProfileAction, initial);
  const [penName, setPenName] = useState(defaults.pen_name);
  const [avatarUrl, setAvatarUrl] = useState(defaults.avatar_url);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <div className="flex items-center gap-4">
        <AuthorAvatar src={avatarUrl.trim() || null} name={penName || '作者'} size="lg" />
        <p className="text-xs text-stone-400">头像预览</p>
      </div>

      <label className="block">
        <span className="text-sm text-stone-600">笔名 *</span>
        <input
          name="pen_name"
          required
          value={penName}
          onChange={(e) => setPenName(e.target.value)}
          className={inputClass}
        />
        {fe.pen_name && <span className="mt-1 block text-xs text-red-600">{fe.pen_name}</span>}
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">头像链接（可选）</span>
        <input
          name="avatar_url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://…/avatar.jpg"
          className={inputClass}
        />
        <span className="mt-1 block text-xs text-stone-400">
          粘贴一张公开可访问的图片链接（http/https）。
        </span>
        {fe.avatar_url && <span className="mt-1 block text-xs text-red-600">{fe.avatar_url}</span>}
      </label>

      <label className="block">
        <span className="text-sm text-stone-600">作者简介（可选）</span>
        <textarea name="bio" rows={5} defaultValue={defaults.bio} className={inputClass} />
        {fe.bio && <span className="mt-1 block text-xs text-red-600">{fe.bio}</span>}
      </label>

      {state.ok && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          资料已保存。
        </p>
      )}
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-md bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? '保存中…' : '保存资料'}
      </button>
    </form>
  );
}
