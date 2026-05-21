'use client';

import { useState, useTransition } from 'react';
import { setUserSuspendedAction } from './actions';

export function SuspendButton({
  id,
  email,
  suspended,
  disabled,
}: {
  id: string;
  email: string;
  suspended: boolean;
  disabled: boolean;
}) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function onClick() {
    const verb = suspended ? '恢复' : '停用';
    if (!confirm(`确定${verb}用户「${email}」吗？`)) return;
    setError(undefined);
    startTransition(async () => {
      const res = await setUserSuspendedAction(id, !suspended);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || pending}
        className={
          suspended
            ? 'text-sm text-emerald-700 hover:underline disabled:text-stone-300'
            : 'text-sm text-red-600 hover:underline disabled:text-stone-300'
        }
      >
        {suspended ? '恢复' : '停用'}
      </button>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </div>
  );
}
