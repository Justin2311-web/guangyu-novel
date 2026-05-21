'use client';

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
  return (
    <form
      action={setUserSuspendedAction}
      onSubmit={(e) => {
        const verb = suspended ? '恢复' : '停用';
        if (!confirm(`确定${verb}用户「${email}」吗？`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="suspended" value={suspended ? 'false' : 'true'} />
      <button
        type="submit"
        disabled={disabled}
        className={
          suspended
            ? 'text-sm text-emerald-700 hover:underline disabled:text-stone-300'
            : 'text-sm text-red-600 hover:underline disabled:text-stone-300'
        }
      >
        {suspended ? '恢复' : '停用'}
      </button>
    </form>
  );
}
