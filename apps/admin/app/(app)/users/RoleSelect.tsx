'use client';

import { useEffect, useState, useTransition } from 'react';
import { ROLES, USER_ROLE_LABELS, type Role } from '@guangyu/database';
import { updateUserRoleAction } from './actions';

export function RoleSelect({
  id,
  role,
  disabled,
}: {
  id: string;
  role: Role;
  disabled: boolean;
}) {
  const [value, setValue] = useState<Role>(role);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  // Server truth wins once the page revalidates with the persisted role.
  useEffect(() => {
    setValue(role);
  }, [role]);

  function onChange(next: Role) {
    const previous = value;
    setValue(next);
    setError(undefined);
    startTransition(async () => {
      const res = await updateUserRoleAction(id, next);
      if (!res.ok) {
        setError(res.error);
        setValue(previous); // snap back — the DB did not change
      }
    });
  }

  return (
    <div>
      <select
        value={value}
        disabled={disabled || pending}
        onChange={(e) => onChange(e.target.value as Role)}
        className="rounded-md border border-stone-300 px-2 py-1 text-sm focus:border-brand focus:outline-none disabled:bg-stone-100 disabled:text-stone-400"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {USER_ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </div>
  );
}
