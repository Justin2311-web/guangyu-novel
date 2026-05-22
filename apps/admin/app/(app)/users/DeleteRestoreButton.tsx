'use client';

import { useState, useTransition } from 'react';
import { deleteUserAction, restoreUserAction } from './actions';

export function DeleteRestoreButton({
  id,
  email,
  deleted,
  disabled,
}: {
  id: string;
  email: string;
  deleted: boolean;
  disabled: boolean;
}) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!deleted) {
      const ok = confirm(
        `确定删除用户「${email}」吗？\n\n这是软删除：该用户将被禁止登录后台与使用账户功能，可随后恢复。此操作具有破坏性，请谨慎操作。`,
      );
      if (!ok) return;
    }
    setError(undefined);
    startTransition(async () => {
      const res = deleted ? await restoreUserAction(id) : await deleteUserAction(id);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || pending}
        className={
          deleted
            ? 'text-sm text-emerald-700 hover:underline disabled:text-stone-300'
            : 'text-sm text-red-600 hover:underline disabled:text-stone-300'
        }
      >
        {deleted ? '恢复' : '删除'}
      </button>
      {error && <span className="mt-1 text-xs text-red-600">{error}</span>}
    </span>
  );
}
