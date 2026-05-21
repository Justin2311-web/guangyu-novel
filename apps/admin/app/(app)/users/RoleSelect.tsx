'use client';

import { useRef } from 'react';
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
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={updateUserRoleAction} ref={formRef}>
      <input type="hidden" name="id" value={id} />
      <select
        name="role"
        defaultValue={role}
        disabled={disabled}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-md border border-stone-300 px-2 py-1 text-sm focus:border-brand focus:outline-none disabled:bg-stone-100 disabled:text-stone-400"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {USER_ROLE_LABELS[r]}
          </option>
        ))}
      </select>
    </form>
  );
}
