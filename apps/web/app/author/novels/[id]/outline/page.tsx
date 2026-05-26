import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMyAuthor, getMyNovel } from '@/lib/author';
import { OutlineManager, type OutlineItem } from './OutlineManager';

export const dynamic = 'force-dynamic';

export const metadata = { title: '作品大纲', robots: { index: false, follow: false } };

export default async function NovelOutlinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Ownership gate: only the owning author may view the outline.
  const author = await getMyAuthor();
  if (!author) notFound();
  const novel = await getMyNovel(author.id, id);
  if (!novel) notFound();

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('novel_outlines')
    .select('id, section_type, title, content, status')
    .eq('novel_id', id)
    .order('section_type', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  const items = (data ?? []) as OutlineItem[];

  return (
    <div className="space-y-5">
      <div>
        <nav className="text-sm text-stone-500">
          <Link href="/author/novels" className="hover:text-brand">我的作品</Link>
          <span className="px-1.5">/</span>
          <span className="text-stone-700">{novel.title}</span>
          <span className="px-1.5">/</span>
          <span className="text-stone-700">大纲</span>
        </nav>
        <h2 className="mt-2 text-lg font-medium text-stone-800">{novel.title} · 作品大纲</h2>
        <p className="mt-1 text-sm text-stone-500">
          私密的创作规划：世界观、剧情线、角色、伏笔与未填坑等，仅你可见，不会公开展示。
        </p>
      </div>

      <OutlineManager novelId={id} items={items} />
    </div>
  );
}
