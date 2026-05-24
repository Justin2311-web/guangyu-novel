import Link from 'next/link';
import { ensureMyAuthor, getAuthorAnalytics } from '@/lib/author';
import { AuthorLevelBadge } from '../../components/AuthorLevelBadge';

export const dynamic = 'force-dynamic';

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-amber-100 bg-white p-4">
      <div className="font-serif text-2xl font-bold text-stone-800">{value}</div>
      <div className="mt-1 text-sm text-stone-500">{label}</div>
      {hint && <div className="mt-0.5 text-xs text-stone-400">{hint}</div>}
    </div>
  );
}

const fmt = (n: number) => n.toLocaleString();

export default async function AuthorAnalyticsPage() {
  const author = await ensureMyAuthor();

  if (!author) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-800">
        未找到作者资料。如需作者身份请先在
        <Link href="/account" className="mx-1 underline">
          我的账户
        </Link>
        提交申请。
      </div>
    );
  }

  const a = await getAuthorAnalytics(author.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-medium text-stone-800">数据中心</h2>
        <AuthorLevelBadge totalViews={a.totalViews} />
        <span className="text-sm text-stone-400">等级依据作品总阅读量计算</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat label="作品总数" value={fmt(a.totalNovels)} />
        <Stat label="已发布作品" value={fmt(a.publishedNovels)} />
        <Stat label="章节总数" value={fmt(a.totalChapters)} />
        <Stat label="总字数" value={fmt(a.totalWords)} />
        <Stat label="总阅读量" value={fmt(a.totalViews)} />
        <Stat
          label="收藏总数"
          value={a.bookshelfSaves == null ? '—' : fmt(a.bookshelfSaves)}
          hint={a.bookshelfSaves == null ? '统计准备中' : '读者加入书架次数'}
        />
        <Stat
          label="近7天阅读"
          value={a.viewsLast7Days == null ? '—' : fmt(a.viewsLast7Days)}
          hint={a.viewsLast7Days == null ? '统计准备中' : '近 7 天读者阅读记录'}
        />
      </div>

      <p className="text-xs text-stone-400">
        数据来自你的作品、章节与读者书架/阅读记录，实时计算。前往
        <Link href="/author/novels" className="mx-1 text-brand hover:underline">
          我的作品
        </Link>
        管理内容。
      </p>
    </div>
  );
}
