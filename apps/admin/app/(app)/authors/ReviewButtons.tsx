'use client';

import { useState, useTransition } from 'react';
import { reviewApplicationAction } from './actions';

export function ReviewButtons({ id, status }: { id: string; status: string }) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function run(next: 'approved' | 'rejected' | 'revision_requested') {
    let note = '';
    if (next === 'approved') {
      if (!confirm('确定通过该作者申请吗？通过后该用户将成为作者。')) return;
    } else {
      const label = next === 'rejected' ? '拒绝' : '要求修改';
      const input = prompt(`请输入${label}的备注说明（用户可见）：`);
      if (input == null) return;
      if (!input.trim()) {
        setError('请填写备注说明。');
        return;
      }
      note = input.trim();
    }
    setError(undefined);
    startTransition(async () => {
      const res = await reviewApplicationAction(id, next, note);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-3">
        {status !== 'approved' && (
          <button
            type="button"
            onClick={() => run('approved')}
            disabled={pending}
            className="text-sm text-emerald-700 hover:underline disabled:text-stone-300"
          >
            通过
          </button>
        )}
        <button
          type="button"
          onClick={() => run('revision_requested')}
          disabled={pending}
          className="text-sm text-amber-700 hover:underline disabled:text-stone-300"
        >
          要求修改
        </button>
        <button
          type="button"
          onClick={() => run('rejected')}
          disabled={pending}
          className="text-sm text-red-600 hover:underline disabled:text-stone-300"
        >
          拒绝
        </button>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
