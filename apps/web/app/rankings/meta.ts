import type { RankingKind } from '@/lib/queries';

export const RANKINGS: { kind: RankingKind; slug: string; title: string; desc: string; icon: string }[] = [
  { kind: 'popular', slug: 'popular', title: '人气榜', desc: '阅读量最高的作品', icon: '🔥' },
  { kind: 'latest', slug: 'latest', title: '最新更新榜', desc: '最近更新的作品', icon: '🕒' },
  { kind: 'collections', slug: 'collections', title: '收藏榜', desc: '被收藏最多的作品', icon: '⭐' },
  { kind: 'finished', slug: 'finished', title: '完结榜', desc: '已完结的精彩作品', icon: '✅' },
  { kind: 'new', slug: 'new', title: '新书榜', desc: '最新发布的新作', icon: '🆕' },
];

export function rankingBySlug(slug: string) {
  return RANKINGS.find((r) => r.slug === slug);
}
