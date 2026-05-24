import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getRanking } from '@/lib/queries';
import { RankingRow } from '../../components/RankingRow';
import { RANKINGS, rankingBySlug } from '../meta';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const r = rankingBySlug(type);
  return { title: r ? r.title : '排行榜' };
}

export default async function RankingPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const meta = rankingBySlug(type);
  if (!meta) notFound();

  const novels = await getRanking(meta.kind, 50);

  return (
    <div className="space-y-5">
      <div>
        <nav className="text-sm text-stone-500">
          <Link href="/rankings" className="hover:text-brand">排行榜</Link>
          <span className="px-1.5">/</span>
          <span className="text-stone-700">{meta.title}</span>
        </nav>
        <h1 className="mt-2 font-serif text-2xl font-bold text-stone-900">
          {meta.icon} {meta.title}
        </h1>
        <p className="mt-1 text-sm text-stone-500">{meta.desc}</p>
      </div>

      {/* quick switch between rankings */}
      <div className="flex flex-wrap gap-2">
        {RANKINGS.map((r) => (
          <Link
            key={r.slug}
            href={`/rankings/${r.slug}`}
            className={
              r.slug === meta.slug
                ? 'rounded-full bg-brand px-3 py-1 text-xs text-white'
                : 'rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600 hover:bg-amber-50'
            }
          >
            {r.title}
          </Link>
        ))}
      </div>

      {novels.length === 0 ? (
        <div className="gy-card px-4 py-16 text-center text-sm text-stone-500">
          {meta.kind === 'finished' ? '暂无已完结的作品。' : '暂无作品。'}
        </div>
      ) : (
        <ol className="gy-card divide-y divide-stone-100">
          {novels.map((n, i) => (
            <RankingRow
              key={n.id}
              rank={i + 1}
              novel={n}
              metric={meta.kind === 'collections' ? 'bookmarks' : 'views'}
            />
          ))}
        </ol>
      )}
    </div>
  );
}
