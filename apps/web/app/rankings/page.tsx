import Link from 'next/link';
import { RANKINGS } from './meta';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '排行榜',
  description: '光羽小说排行榜：人气榜、最新更新榜、收藏榜、完结榜与新书榜，发现热门好书。',
  alternates: { canonical: '/rankings' },
};

export default function RankingsIndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900">排行榜</h1>
        <p className="mt-1 text-sm text-stone-500">从多个维度发现精彩作品</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RANKINGS.map((r) => (
          <Link
            key={r.slug}
            href={`/rankings/${r.slug}`}
            className="gy-card flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-2xl">
              {r.icon}
            </span>
            <div>
              <h2 className="font-serif text-lg font-semibold text-stone-800">{r.title}</h2>
              <p className="mt-0.5 text-sm text-stone-500">{r.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
