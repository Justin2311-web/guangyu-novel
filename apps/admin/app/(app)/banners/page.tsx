import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Banner } from '@guangyu/database';
import { DeleteBannerButton } from './DeleteBannerButton';

export const dynamic = 'force-dynamic';

export default async function AdminBannersPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('banners')
    .select(
      'id, title, image_url, mobile_image_url, link_url, button_label, sort_order, active, created_at, updated_at',
    )
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  const banners = (data ?? []) as Banner[];

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">横幅管理</h1>
          <p className="text-sm text-stone-500">管理首页横幅（仅管理员可编辑）。</p>
        </div>
        <Link
          href="/banners/new"
          className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          新建横幅
        </Link>
      </header>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          加载失败：{error.message}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">预览</th>
              <th className="px-4 py-3 font-medium">标题</th>
              <th className="px-4 py-3 font-medium">链接</th>
              <th className="px-4 py-3 font-medium">排序</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {banners.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                  暂无横幅，点击右上角新建。
                </td>
              </tr>
            )}
            {banners.map((b) => (
              <tr key={b.id} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.image_url}
                    alt={b.title ?? 'banner'}
                    className="h-12 w-24 rounded border border-stone-200 object-cover"
                  />
                </td>
                <td className="px-4 py-3 font-medium text-stone-800">{b.title ?? '—'}</td>
                <td className="px-4 py-3 text-stone-500">{b.link_url ?? '—'}</td>
                <td className="px-4 py-3 text-stone-500">{b.sort_order}</td>
                <td className="px-4 py-3">
                  {b.active ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                      启用
                    </span>
                  ) : (
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                      停用
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-4">
                    <Link href={`/banners/${b.id}/edit`} className="text-brand hover:underline">
                      编辑
                    </Link>
                    <DeleteBannerButton id={b.id} label={b.title ?? '未命名横幅'} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
