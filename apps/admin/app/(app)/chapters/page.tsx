import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CHAPTER_STATUS_LABELS, type ChapterStatus } from '@guangyu/database';
import { loadNovelOptions } from './data';
import { NovelPicker } from './NovelPicker';
import { DeleteChapterButton } from './DeleteChapterButton';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  chapter_number: number;
  title: string;
  status: ChapterStatus;
  updated_at: string;
};

export default async function AdminChaptersPage({
  searchParams,
}: {
  searchParams: Promise<{ novel?: string }>;
}) {
  const { novel: novelId } = await searchParams;
  const novels = await loadNovelOptions();
  const selected = novelId ? novels.find((n) => n.id === novelId) : undefined;

  let rows: Row[] = [];
  let error: string | null = null;
  if (selected) {
    const supabase = await createSupabaseServerClient();
    const res = await supabase
      .from('chapters')
      .select('id, chapter_number, title, status, updated_at')
      .eq('novel_id', selected.id)
      .order('chapter_number', { ascending: true });
    rows = (res.data ?? []) as Row[];
    error = res.error?.message ?? null;
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">章节管理</h1>
          <p className="text-sm text-stone-500">先选择一部小说，再管理其章节。</p>
        </div>
        {selected && (
          <Link
            href={`/chapters/new?novel=${selected.id}`}
            className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            新建章节
          </Link>
        )}
      </header>

      <NovelPicker novels={novels} selected={selected?.id ?? ''} />

      {!selected ? (
        <p className="rounded-md border border-stone-200 bg-stone-50 px-4 py-8 text-center text-stone-400">
          {novels.length === 0 ? '暂无小说，请先创建小说。' : '请选择上方的小说以查看章节。'}
        </p>
      ) : (
        <>
          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              加载失败：{error}
            </p>
          )}
          <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-left text-stone-500">
                <tr>
                  <th className="px-4 py-3 font-medium">序号</th>
                  <th className="px-4 py-3 font-medium">标题</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-stone-400">
                      暂无章节，点击右上角新建。
                    </td>
                  </tr>
                )}
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-3 text-stone-500">{c.chapter_number}</td>
                    <td className="px-4 py-3 font-medium text-stone-800">{c.title}</td>
                    <td className="px-4 py-3 text-stone-500">{CHAPTER_STATUS_LABELS[c.status]}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/chapters/${c.id}/edit`}
                          className="text-brand hover:underline"
                        >
                          编辑
                        </Link>
                        <DeleteChapterButton id={c.id} title={c.title} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
