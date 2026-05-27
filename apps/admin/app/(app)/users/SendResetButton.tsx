'use client';

import { useState, useTransition } from 'react';
import { sendPasswordResetAction } from './actions';

export function SendResetButton({ email }: { email: string }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string>();

  function run() {
    setMsg(undefined);
    startTransition(async () => {
      const res = await sendPasswordResetAction(email);
      setMsg(res.ok ? '已发送' : res.error ?? '失败');
      if (res.ok) setTimeout(() => setMsg(undefined), 2000);
    });
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="text-sm text-stone-600 hover:text-brand disabled:text-stone-300"
      >
        {pending ? '发送中…' : '发送重置邮件'}
      </button>
      {msg && <span className="text-xs text-stone-400">{msg}</span>}
    </span>
  );
}
