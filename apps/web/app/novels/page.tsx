import Link from 'next/link';
import {
  NOVEL_SERIAL_STATUSES,
  NOVEL_SERIAL_STATUS_LABELS,
  type NovelSerialStatus,
} from '@guangyu/database';
import { getNovels, getCategories, type NovelSort } from '@/lib/queries';
import { PosterCard } from '../components/PosterCard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '小说书库',
  description: '光羽小说书库：按关键词、分类、状态搜索与排序，发现你喜欢的在线小说。',
  alternates: { canonical: '/novels' },
};

const SORT_LABELS: Record<NovelSort, string> = {
  updated: '最近更新',
  popular: '人气',
  created: '最新发布',
  title: '标题 A-Z',
};

const inputClass =
  'rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40';

export default async function NovelsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    keyword?: string;
    category?: string;
    status?: string;
    sort?: string;
  }>;
}) {
  const sp = await searchParams;
  // Accept both `q` (existing) and `keyword` (Phase 6e alias).
  const q = (sp.q ?? sp.keyword ?? '').trim();
  const categories = await getCategories();
  const categorySlug = categories.some((c) => c.slug === sp.category) ? sp.category : undefined;
  const status = (NOVEL_SERIAL_STATUSES as readonly string[]).includes(sp.status ?? '')
    ? (sp.status as NovelSerialStatus)
    : undefined;
  const sort: NovelSort = (['updated', 'popular', 'created', 'title'] as const).includes(
    sp.sort as NovelSort,
  )
    ? (sp.sort as NovelSort)
    : 'updated';

  const novels = await getNovels({ q, categorySlug, status, sort });
  const hasFilters = !!(q || categorySlug || status || sp.sort);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900">小说书库</h1>
        {q && <p className="mt-1 text-sm text-stone-500">搜索：「{q}」· {novels.length} 个结果</p>}
      </div>

      <form
        method="get"
        className="gy-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto]"
      >
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="搜索书名、作者、分类或简介…"
          className={inputClass}
        />
        <select name="category" defaultValue={categorySlug ?? ''} className={inputClass}>
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ''} className={inputClass}>
          <option value="">全部状态</option>
          {NOVEL_SERIAL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {NOVEL_SERIAL_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} className={inputClass}>
          {(Object.keys(SORT_LABELS) as NovelSort[]).map((s) => (
            <option key={s} value={s}>
              {SORT_LABELS[s]}
            </option>
          ))}
        </select>
        <button type="submit" className="gy-btn-primary">搜索</button>
      </form>

      {hasFilters && (
        <div>
          <Link href="/novels" className="text-sm text-stone-500 hover:text-brand">
            清除筛选
          </Link>
        </div>
      )}

      {novels.length === 0 ? (
        <div className="gy-card px-4 py-16 text-center text-stone-500">
          {hasFilters ? '没有符合条件的小说，换个关键词或筛选试试。' : '暂无已发布的小说。'}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {novels.map((n) => (
            <PosterCard key={n.id} novel={n} />
          ))}
        </div>
      )}
    </div>
  );
}
