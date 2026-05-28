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

type Sp = { q?: string; keyword?: string; category?: string; status?: string; sort?: string };

/** Build a `/novels?...` href with a single filter key removed (chip ✕). */
function hrefWithout(current: Sp, removeKey: keyof Sp): string {
  const params = new URLSearchParams();
  const next: Sp = { ...current, [removeKey]: undefined };
  if (next.q) params.set('q', next.q);
  if (next.category) params.set('category', next.category);
  if (next.status) params.set('status', next.status);
  if (next.sort && next.sort !== 'updated') params.set('sort', next.sort);
  const qs = params.toString();
  return qs ? `/novels?${qs}` : '/novels';
}

function FilterChip({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1 text-xs text-stone-600 hover:border-brand hover:text-brand"
    >
      <span>{label}</span>
      <span aria-hidden className="text-stone-400">
        ✕
      </span>
    </Link>
  );
}

export default async function NovelsPage({
  searchParams,
}: {
  searchParams: Promise<Sp>;
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
  const hasFilters = !!(q || categorySlug || status || (sp.sort && sp.sort !== 'updated'));

  const currentSp: Sp = {
    q: q || undefined,
    category: categorySlug || undefined,
    status: status || undefined,
    sort: sp.sort,
  };
  const activeCategoryName = categorySlug
    ? categories.find((c) => c.slug === categorySlug)?.name ?? categorySlug
    : null;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-bold text-stone-900">小说书库</h1>
        <p className="text-sm text-stone-500">
          {hasFilters ? (
            <>
              找到 <span className="font-medium text-stone-700">{novels.length}</span> 部作品
              {q && <> · 关键词「{q}」</>}
            </>
          ) : (
            <>
              共 <span className="font-medium text-stone-700">{novels.length}</span> 部作品
            </>
          )}
        </p>
      </div>

      <form
        method="get"
        className="gy-card grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto]"
      >
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="搜索书名、作者、分类或简介…"
          className={`${inputClass} sm:col-span-2 lg:col-span-1`}
          aria-label="搜索"
        />
        <select
          name="category"
          defaultValue={categorySlug ?? ''}
          className={inputClass}
          aria-label="分类筛选"
        >
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ''}
          className={inputClass}
          aria-label="状态筛选"
        >
          <option value="">全部状态</option>
          {NOVEL_SERIAL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {NOVEL_SERIAL_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} className={inputClass} aria-label="排序方式">
          {(Object.keys(SORT_LABELS) as NovelSort[]).map((s) => (
            <option key={s} value={s}>
              {SORT_LABELS[s]}
            </option>
          ))}
        </select>
        <button type="submit" className="gy-btn-primary w-full sm:col-span-2 lg:col-span-1 lg:w-auto">
          搜索
        </button>
      </form>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-stone-400">当前筛选：</span>
          {q && <FilterChip label={`关键词：${q}`} href={hrefWithout(currentSp, 'q')} />}
          {activeCategoryName && (
            <FilterChip
              label={`分类：${activeCategoryName}`}
              href={hrefWithout(currentSp, 'category')}
            />
          )}
          {status && (
            <FilterChip
              label={`状态：${NOVEL_SERIAL_STATUS_LABELS[status]}`}
              href={hrefWithout(currentSp, 'status')}
            />
          )}
          {sp.sort && sp.sort !== 'updated' && (
            <FilterChip
              label={`排序：${SORT_LABELS[sort]}`}
              href={hrefWithout(currentSp, 'sort')}
            />
          )}
          <Link href="/novels" className="text-xs text-stone-500 hover:text-brand">
            清除全部
          </Link>
        </div>
      )}

      {novels.length === 0 ? (
        <div className="gy-card px-4 py-16 text-center text-stone-500">
          {hasFilters ? '没有找到相关作品，换个关键词或筛选试试。' : '暂无已发布的小说。'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {novels.map((n) => (
            <PosterCard key={n.id} novel={n} />
          ))}
        </div>
      )}
    </div>
  );
}
