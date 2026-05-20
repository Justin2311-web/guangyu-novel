import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NOVEL_SERIAL_STATUS_LABELS, type NovelSerialStatus } from '@guangyu/database';
import { DeleteNovelButton } from './DeleteNovelButton';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  title: string;
  slug: string;
  status: NovelSerialStatus;
  is_published: boolean;
  created_at: string;
  authors: { pen_name: string } | null;
  categories: { name: string } | null;
};

export default async function AdminNovelsPage() {
  const supabase = await createSupabaseServerClient();
  // RLS scopes this automatically: authors see their own, admins see all.
  const { data, error } = await supabase
    .from('novels')
    .select('id, title, slug, status, is_published, created_at, authors(pen_name), categories(name)')
    .order('created_at', { ascending: false });

  const novels = (data ?? []) as unknown as Row[];

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">小说管理</h1>
          <p className="text-sm text-stone-500">作者仅能看到自己的作品，管理员可见全部。</p>
        </div>
        <Link
          href="/novels/new"
          className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          新建小说
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
              <th className="px-4 py-3 font-medium">标题</th>
              <th className="px-4 py-3 font-medium">作者</th>
              <th className="px-4 py-3 font-medium">分类</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">发布</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {novels.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                  暂无小说，点击右上角新建。
                </td>
              </tr>
            )}
            {novels.map((n) => (
              <tr key={n.id} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3 font-medium text-stone-800">{n.title}</td>
                <td className="px-4 py-3 text-stone-500">{n.authors?.pen_name ?? '—'}</td>
                <td className="px-4 py-3 text-stone-500">{n.categories?.name ?? '未分类'}</td>
                <td className="px-4 py-3 text-stone-500">
                  {NOVEL_SERIAL_STATUS_LABELS[n.status]}
                </td>
                <td className="px-4 py-3">
                  {n.is_published ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                      已发布
                    </span>
                  ) : (
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                      草稿
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-4">
                    <Link href={`/novels/${n.id}/edit`} className="text-brand hover:underline">
                      编辑
                    </Link>
                    <DeleteNovelButton id={n.id} title={n.title} />
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
