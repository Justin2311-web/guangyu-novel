'use client';

import { useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const BUCKET = 'public-assets';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Local-file image uploader backed by Supabase Storage. The resulting public
 * URL is mirrored into a hidden <input name={name}> so existing form actions
 * (which read this field name) keep working. Pasted external URLs remain
 * supported via the "手动输入链接" fallback — full backward compatibility.
 */
export function ImageUploadField({
  name,
  label,
  defaultValue,
  folder,
  allowClear = true,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  folder: string;
  allowClear?: boolean;
}) {
  const [url, setUrl] = useState(defaultValue ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();
  const [manual, setManual] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    setError(undefined);
    if (!ALLOWED.includes(file.type)) {
      setError('仅支持 JPG / PNG / WebP 格式。');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('图片不能超过 5MB。');
      return;
    }
    setUploading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const rand = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/[^a-z0-9-]/gi, '');
      const path = `${folder}/${rand}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) {
        setError(`上传失败：${upErr.message}`);
        return;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch (e) {
      setError(`上传出错：${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="block">
      <span className="text-sm text-stone-600">{label}</span>
      {/* The value the form submits — same field name as before. */}
      <input type="hidden" name={name} value={url} readOnly />

      <div className="mt-1.5 flex items-start gap-3">
        <div className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-stone-200 bg-stone-50">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={`${label}预览`} className="h-full w-full object-cover" />
          ) : (
            <span className="px-1 text-center text-[11px] text-stone-400">无图片</span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:border-brand hover:text-brand disabled:opacity-50"
            >
              {uploading ? '上传中…' : url ? '更换图片' : '上传图片'}
            </button>
            {url && allowClear && (
              <button
                type="button"
                onClick={() => setUrl('')}
                disabled={uploading}
                className="text-xs text-stone-400 hover:text-red-600"
              >
                移除
              </button>
            )}
            <button
              type="button"
              onClick={() => setManual((v) => !v)}
              className="text-xs text-stone-400 hover:text-brand"
            >
              {manual ? '收起' : '手动输入链接'}
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />

          {manual && (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="block w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
            />
          )}

          <p className="text-[11px] text-stone-400">支持 JPG / PNG / WebP，最大 5MB。</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
