'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  OUTLINE_TABS,
  SECTION_LABEL,
  SECTION_TYPES,
  STATUS_LABEL,
  STATUS_SECTION_TYPES,
  type OutlineSectionType,
  type OutlineStatus,
} from './constants';
import {
  createOutlineItemAction,
  updateOutlineItemAction,
  deleteOutlineItemAction,
} from './actions';

export type OutlineItem = {
  id: string;
  section_type: OutlineSectionType;
  title: string;
  content: string | null;
  status: OutlineStatus;
};

const taClass =
  'mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-brand focus:outline-none';

const STATUS_BADGE: Record<OutlineStatus, string> = {
  active: 'bg-amber-50 text-amber-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  archived: 'bg-stone-100 text-stone-500',
};

export function OutlineManager({
  novelId,
  items,
}: {
  novelId: string;
  items: OutlineItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [tab, setTab] = useState('all');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addType, setAddType] = useState<OutlineSectionType>('worldview');

  function matchesTab(it: OutlineItem): boolean {
    if (tab === 'all') return true;
    if (tab === 'character') return it.section_type === 'protagonist' || it.section_type === 'character';
    return it.section_type === tab;
  }
  const filtered = items.filter(matchesTab);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) {
    setError(undefined);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        after?.();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  const showStatus = (t: OutlineSectionType) => STATUS_SECTION_TYPES.includes(t);

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200">
        {OUTLINE_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={
              t.value === tab
                ? '-mb-px border-b-2 border-brand px-3 py-2 text-sm font-medium text-brand'
                : 'px-3 py-2 text-sm text-stone-500 hover:text-brand'
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        <button
          type="button"
          onClick={() => { setAdding((v) => !v); setEditingId(null); }}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          {adding ? '收起' : '新增大纲条目'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Add form */}
      {adding && (
        <form
          action={(fd) => run(() => createOutlineItemAction(novelId, fd), () => setAdding(false))}
          className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-stone-600">类型</span>
              <select
                name="section_type"
                value={addType}
                onChange={(e) => setAddType(e.target.value as OutlineSectionType)}
                className={taClass}
              >
                {SECTION_TYPES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
            {showStatus(addType) && (
              <label className="block">
                <span className="text-sm text-stone-600">状态</span>
                <select name="status" defaultValue="active" className={taClass}>
                  {(Object.keys(STATUS_LABEL) as OutlineStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <label className="block">
            <span className="text-sm text-stone-600">标题</span>
            <input name="title" required placeholder="如：主角：林玄 / 修炼体系 / 主线" className={taClass} />
          </label>
          <label className="block">
            <span className="text-sm text-stone-600">内容</span>
            <textarea name="content" rows={6} placeholder="性格、能力、背景、目标、关系、不能忘记的设定…" className={taClass} />
          </label>
          <button type="submit" disabled={pending} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
            {pending ? '保存中…' : '保存条目'}
          </button>
        </form>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-12 text-center text-sm text-stone-500">
          暂无大纲条目。
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((it) =>
            editingId === it.id ? (
              <li key={it.id} className="rounded-lg border border-brand/40 bg-white p-4">
                <form
                  action={(fd) => run(() => updateOutlineItemAction(novelId, it.id, fd), () => setEditingId(null))}
                  className="space-y-3"
                >
                  {showStatus(it.section_type) && (
                    <label className="block">
                      <span className="text-sm text-stone-600">状态</span>
                      <select name="status" defaultValue={it.status} className={taClass}>
                        {(Object.keys(STATUS_LABEL) as OutlineStatus[]).map((s) => (
                          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="block">
                    <span className="text-sm text-stone-600">标题</span>
                    <input name="title" required defaultValue={it.title} className={taClass} />
                  </label>
                  <label className="block">
                    <span className="text-sm text-stone-600">内容</span>
                    <textarea name="content" rows={6} defaultValue={it.content ?? ''} className={taClass} />
                  </label>
                  <div className="flex gap-3">
                    <button type="submit" disabled={pending} className="rounded-md bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark disabled:opacity-60">保存</button>
                    <button type="button" onClick={() => setEditingId(null)} className="text-sm text-stone-500 hover:text-stone-700">取消</button>
                  </div>
                </form>
              </li>
            ) : (
              <li key={it.id} className="rounded-lg border border-stone-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-500">{SECTION_LABEL[it.section_type]}</span>
                  <span className="font-medium text-stone-800">{it.title}</span>
                  {showStatus(it.section_type) && (
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[it.status]}`}>{STATUS_LABEL[it.status]}</span>
                  )}
                  <span className="ml-auto flex gap-3 text-sm">
                    <button type="button" onClick={() => { setEditingId(it.id); setAdding(false); }} className="text-brand hover:underline">编辑</button>
                    <button
                      type="button"
                      onClick={() => { if (confirm('确定删除该大纲条目吗？')) run(() => deleteOutlineItemAction(novelId, it.id)); }}
                      className="text-red-600 hover:underline"
                    >
                      删除
                    </button>
                  </span>
                </div>
                {it.content && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-600">{it.content}</p>
                )}
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
