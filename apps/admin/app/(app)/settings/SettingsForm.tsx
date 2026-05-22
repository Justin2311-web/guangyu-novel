'use client';

import { useActionState, useState } from 'react';
import type { SiteSettings } from '@guangyu/database';
import { saveSiteSettingsAction } from './actions';
import { SETTING_GROUPS, type SettingField, type SettingsActionResult } from './fields';

const initial: SettingsActionResult = { ok: false };

const inputClass =
  'mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-brand focus:outline-none';

function ImageField({ field, defaultValue }: { field: SettingField; defaultValue: string }) {
  const [url, setUrl] = useState(defaultValue);
  return (
    <label className="block">
      <span className="text-sm text-stone-600">{field.label}</span>
      <input
        type="url"
        name={field.key}
        value={url}
        placeholder={field.placeholder}
        onChange={(e) => setUrl(e.target.value)}
        className={inputClass}
      />
      {url ? (
        <span className="mt-2 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`${field.label} 预览`}
            className="max-h-20 rounded-md border border-stone-200 object-contain"
          />
        </span>
      ) : (
        <span className="mt-1 block text-xs text-stone-400">填写 URL 后显示预览。</span>
      )}
    </label>
  );
}

function Field({ field, defaultValue }: { field: SettingField; defaultValue: string }) {
  if (field.type === 'image') return <ImageField field={field} defaultValue={defaultValue} />;
  if (field.type === 'textarea') {
    return (
      <label className="block">
        <span className="text-sm text-stone-600">{field.label}</span>
        <textarea
          name={field.key}
          rows={3}
          defaultValue={defaultValue}
          placeholder={field.placeholder}
          className={inputClass}
        />
      </label>
    );
  }
  return (
    <label className="block">
      <span className="text-sm text-stone-600">{field.label}</span>
      <input
        type={field.type === 'url' ? 'url' : 'text'}
        name={field.key}
        defaultValue={defaultValue}
        placeholder={field.placeholder}
        className={inputClass}
      />
    </label>
  );
}

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, formAction, pending] = useActionState(saveSiteSettingsAction, initial);

  return (
    <form action={formAction} className="space-y-8">
      {SETTING_GROUPS.map((group) => (
        <fieldset key={group.title} className="rounded-lg border border-stone-200 bg-white p-5">
          <legend className="px-2 text-sm font-semibold text-stone-700">{group.title}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => (
              <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <Field field={field} defaultValue={settings[field.key]} />
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="sticky bottom-0 flex items-center gap-4 border-t border-stone-200 bg-stone-50/80 py-3 backdrop-blur">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-md bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? '保存中…' : '保存设置'}
        </button>
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
        {state.ok && !pending && <span className="text-sm text-emerald-600">已保存 ✓</span>}
      </div>
    </form>
  );
}
