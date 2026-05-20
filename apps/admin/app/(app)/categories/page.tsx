import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Category } from '@guangyu/database';
import { DeleteCategoryButton } from './DeleteCategoryButton';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name, description, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  const categories = (data ?? []) as Category[];

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">分类管理</h1>
          <p className="text-sm text-stone-500">管理小说分类（仅管理员可编辑）。</p>
        </div>
        <Link
          href="/categories/new"
          className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          新建分类
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
              <th className="px-4 py-3 font-medium">名称</th>
              <th className="px-4 py-3 font-medium">别名</th>
              <th className="px-4 py-3 font-medium">描述</th>
              <th className="px-4 py-3 font-medium">排序</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                  暂无分类，点击右上角新建。
                </td>
              </tr>
            )}
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3 font-medium text-stone-800">{c.name}</td>
                <td className="px-4 py-3 text-stone-500">{c.slug}</td>
                <td className="px-4 py-3 text-stone-500">{c.description ?? '—'}</td>
                <td className="px-4 py-3 text-stone-500">{c.sort_order}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-4">
                    <Link href={`/categories/${c.id}/edit`} className="text-brand hover:underline">
                      编辑
                    </Link>
                    <DeleteCategoryButton id={c.id} name={c.name} />
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
