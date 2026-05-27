'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { SITE_URL } from '@/lib/site';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (!email.trim()) {
      setError('请输入邮箱。');
      return;
    }
    setPending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${SITE_URL}/reset-password`,
      });
      // Do not reveal whether the email exists — always show success.
      if (err && !/rate|limit/i.test(err.message)) {
        // Only surface genuine config errors, not "user not found".
      }
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">找回密码</h1>
        <p className="mt-1 text-sm text-stone-500">输入注册邮箱，我们会发送重置密码的链接。</p>
      </div>

      {sent ? (
        <div className="space-y-4">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            如果该邮箱已注册，重置链接已发送，请查收邮件（含垃圾箱）。点击邮件中的链接即可设置新密码。
          </div>
          <Link href="/login" className="text-sm text-brand hover:underline">
            返回登录
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm text-stone-600">邮箱</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {pending ? '发送中…' : '发送重置链接'}
          </button>
          <Link href="/login" className="block text-sm text-stone-500 hover:text-brand">
            返回登录
          </Link>
        </form>
      )}
    </div>
  );
}
