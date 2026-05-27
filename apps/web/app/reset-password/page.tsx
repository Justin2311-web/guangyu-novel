'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);

  // Supabase delivers a recovery session via the link (detectSessionInUrl).
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      setChecking(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (password.length < 8) {
      setError('密码至少 8 位。');
      return;
    }
    if (password !== confirm) {
      setError('两次输入的密码不一致。');
      return;
    }
    setPending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(`重置失败：${err.message}`);
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/login'), 1800);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">设置新密码</h1>

      {done ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          密码已重置，正在跳转到登录页…
        </div>
      ) : checking ? (
        <p className="text-sm text-stone-500">正在验证重置链接…</p>
      ) : !ready ? (
        <div className="space-y-4">
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            重置链接无效或已过期。请重新申请找回密码。
          </div>
          <Link href="/forgot-password" className="text-sm text-brand hover:underline">
            重新找回密码
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm text-stone-600">新密码（至少 8 位）</span>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm text-stone-600">确认新密码</span>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {pending ? '提交中…' : '重置密码'}
          </button>
        </form>
      )}
    </div>
  );
}
