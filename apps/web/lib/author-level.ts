// =====================================================================
// Author level — computed purely from cumulative novel views.
// No DB column; derived on read so it always reflects current view totals.
// =====================================================================

export type AuthorLevel = { level: 1 | 2 | 3 | 4 | 5; name: string };

const LEVELS: { min: number; name: string; level: AuthorLevel['level'] }[] = [
  { min: 1_000_000, level: 5, name: '白金作者' },
  { min: 100_000, level: 4, name: '热门作者' },
  { min: 10_000, level: 3, name: '潜力作者' },
  { min: 1_000, level: 2, name: '签约作者' },
  { min: 0, level: 1, name: '新人作者' },
];

export function authorLevel(totalViews: number): AuthorLevel {
  const views = Number.isFinite(totalViews) ? Math.max(0, totalViews) : 0;
  const match = LEVELS.find((l) => views >= l.min) ?? LEVELS[LEVELS.length - 1]!;
  return { level: match.level, name: match.name };
}
