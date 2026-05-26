'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const BUCKET = 'public-assets';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const FOLDERS: { prefix: string; label: string }[] = [
  { prefix: 'novels/covers', label: '小说封面' },
  { prefix: 'authors/avatars', label: '作者头像' },
  { prefix: 'site/banners', label: '横幅' },
  { prefix: 'site/logo', label: 'Logo / 图标' },
  { prefix: 'misc', label: '其他' },
];

type Asset = {
  prefix: string;
  name: string;
  path: string;
  url: string;
  size: number | null;
  updatedAt: string | null;
};

function fmtSize(bytes: number | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function MediaLibrary() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [folder, setFolder] = useState('all');
  const [search, setSearch] = useState('');
  const [uploadFolder, setUploadFolder] = useState(FOLDERS[0]!.prefix);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const supabase = createSupabaseBrowserClient();
      const results = await Promise.all(
        FOLDERS.map(async ({ prefix }) => {
          const { data, error: e } = await supabase.storage
            .from(BUCKET)
            .list(prefix, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
          if (e) throw e;
          return (data ?? [])
            .filter((o) => o.id && !o.name.startsWith('.')) // skip folder placeholders
            .map<Asset>((o) => {
              const path = `${prefix}/${o.name}`;
              return {
                prefix,
                name: o.name,
                path,
                url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
                size: (o.metadata?.size as number | undefined) ?? null,
                updatedAt: (o.updated_at as string | undefined) ?? (o.created_at as string | undefined) ?? null,
              };
            });
        }),
      );
      const flat = results.flat().sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
      setAssets(flat);
    } catch (e) {
      setError(`加载失败：${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUpload(file: File) {
    setNotice(undefined);
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
      const rand = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`).replace(/[^a-z0-9-]/gi, '');
      const { error: e } = await supabase.storage
        .from(BUCKET)
        .upload(`${uploadFolder}/${rand}.${ext}`, file, { contentType: file.type, upsert: false });
      if (e) {
        setError(`上传失败：${e.message}`);
        return;
      }
      setNotice('上传成功。');
      await load();
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(a: Asset) {
    if (
      !confirm(
        `确定删除「${a.name}」？\n\n删除图片不会自动清除已经使用该图片的小说、作者或横幅记录。`,
      )
    ) {
      return;
    }
    setNotice(undefined);
    setError(undefined);
    const supabase = createSupabaseBrowserClient();
    const { error: e } = await supabase.storage.from(BUCKET).remove([a.path]);
    if (e) {
      setError(`删除失败：${e.message}`);
      return;
    }
    setNotice('已删除。');
    setAssets((prev) => prev.filter((x) => x.path !== a.path));
  }

  async function copy(text: string, msg: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(msg);
      setTimeout(() => setNotice(undefined), 1500);
    } catch {
      /* ignore */
    }
  }

  const needle = search.trim().toLowerCase();
  const shown = assets.filter(
    (a) => (folder === 'all' || a.prefix === folder) && (!needle || a.path.toLowerCase().includes(needle)),
  );

  return (
    <div className="space-y-5">
      {/* Upload panel */}
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-sm text-stone-600">上传到</span>
            <select
              value={uploadFolder}
              onChange={(e) => setUploadFolder(e.target.value)}
              className="mt-1 block rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            >
              {FOLDERS.map((f) => (
                <option key={f.prefix} value={f.prefix}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {uploading ? '上传中…' : '上传图片'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUpload(f);
              e.target.value = '';
            }}
          />
          <span className="text-xs text-stone-400">支持 JPG / PNG / WebP，最大 5MB。</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 border-b border-stone-200">
          <button
            type="button"
            onClick={() => setFolder('all')}
            className={folder === 'all' ? '-mb-px border-b-2 border-brand px-3 py-2 text-sm font-medium text-brand' : 'px-3 py-2 text-sm text-stone-500 hover:text-brand'}
          >
            全部
          </button>
          {FOLDERS.map((f) => (
            <button
              key={f.prefix}
              type="button"
              onClick={() => setFolder(f.prefix)}
              className={folder === f.prefix ? '-mb-px border-b-2 border-brand px-3 py-2 text-sm font-medium text-brand' : 'px-3 py-2 text-sm text-stone-500 hover:text-brand'}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索文件名 / 路径…"
          className="rounded-md border border-stone-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      {notice && <p className="text-sm text-emerald-600">{notice}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="px-4 py-10 text-center text-sm text-stone-400">加载中…</p>
      ) : shown.length === 0 ? (
        <p className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-12 text-center text-sm text-stone-400">
          暂无图片。
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((a) => (
            <div key={a.path} className="overflow-hidden rounded-lg border border-stone-200 bg-white">
              <a href={a.url} target="_blank" rel="noopener noreferrer" className="block aspect-video bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt={a.name} className="h-full w-full object-cover" loading="lazy" />
              </a>
              <div className="space-y-1.5 p-3">
                <div className="truncate text-xs font-medium text-stone-700" title={a.path}>
                  {a.name}
                </div>
                <div className="flex justify-between text-[11px] text-stone-400">
                  <span>{FOLDERS.find((f) => f.prefix === a.prefix)?.label ?? a.prefix}</span>
                  <span>{fmtSize(a.size)}</span>
                </div>
                {a.updatedAt && <div className="text-[11px] text-stone-400">{a.updatedAt.slice(0, 10)}</div>}
                <div className="flex flex-wrap gap-2 pt-1 text-xs">
                  <button type="button" onClick={() => copy(a.url, '已复制链接')} className="text-brand hover:underline">
                    复制链接
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(`![${a.name}](${a.url})`, '已复制 Markdown')}
                    className="text-stone-500 hover:text-brand"
                  >
                    复制 MD
                  </button>
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-brand">
                    打开
                  </a>
                  <button type="button" onClick={() => onDelete(a)} className="text-red-600 hover:underline">
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
