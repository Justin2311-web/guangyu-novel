import Link from 'next/link';
import { getPublicAuthors } from '@/lib/queries';
import { AuthorAvatar } from '../../components/AuthorAvatar';
import { AuthorLevelBadge } from '../../components/AuthorLevelBadge';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '作者排行榜',
  description: '光羽小说作者排行榜，按作品总阅读量排名，发现高人气作者。',
  alternates: { canonical: '/authors/ranking' },
};

const RANK_COLOR: Record<number, string> = {
  1: 'bg-amber-400 text-white',
  2: 'bg-stone-300 text-white',
  3: 'bg-orange-300 text-white',
};

export default async function AuthorRankingPage() {
  const authors = await getPublicAuthors();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-serif text-2xl font-bold text-stone-900">作者排行榜</h1>
        <Link href="/authors" className="text-sm text-stone-500 hover:text-brand">
          全部作者 →
        </Link>
      </div>

      {authors.length === 0 ? (
        <div className="gy-card px-4 py-16 text-center text-stone-500">暂无作者。</div>
      ) : (
        <ol className="gy-card divide-y divide-stone-100">
          {authors.map((a, i) => {
            const rank = i + 1;
            return (
              <li key={a.id}>
                <Link
                  href={`/authors/${encodeURIComponent(a.slug)}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-amber-50/60"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      RANK_COLOR[rank] ?? 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {rank}
                  </span>
                  <AuthorAvatar src={a.avatarUrl} name={a.penName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium text-stone-800">{a.penName}</span>
                      <AuthorLevelBadge totalViews={a.totalViews} />
                    </div>
                    <div className="mt-0.5 text-xs text-stone-400">{a.novelCount} 部作品</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-serif font-semibold text-stone-800">
                      {a.totalViews.toLocaleString()}
                    </div>
                    <div className="text-xs text-stone-400">总阅读</div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
