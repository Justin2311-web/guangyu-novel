'use client';

import { useActionState } from 'react';
import { registerAction, type RegisterState } from './actions';

const initial: RegisterState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="text-sm text-stone-600">昵称（可选）</span>
        <input
          type="text"
          name="display_name"
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-sm text-stone-600">邮箱</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-sm text-stone-600">密码（至少 8 位）</span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
        />
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.info && <p className="text-sm text-emerald-700">{state.info}</p>}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? '注册中…' : '注册'}
      </button>
    </form>
  );
}
