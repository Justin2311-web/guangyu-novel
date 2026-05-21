'use client';

import { useRouter } from 'next/navigation';
import type { NovelOption } from './data';

export function NovelPicker({
  novels,
  selected,
}: {
  novels: NovelOption[];
  selected: string;
}) {
  const router = useRouter();

  return (
    <label className="block max-w-md">
      <span className="text-sm text-stone-600">选择小说</span>
      <select
        value={selected}
        onChange={(e) => {
          const id = e.target.value;
          router.push(id ? `/chapters?novel=${id}` : '/chapters');
        }}
        className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-brand focus:outline-none"
      >
        <option value="">— 请选择小说 —</option>
        {novels.map((n) => (
          <option key={n.id} value={n.id}>
            {n.label}
          </option>
        ))}
      </select>
    </label>
  );
}
