import type { MetadataRoute } from 'next';
import {
  getSitemapNovels,
  getSitemapChapters,
  getCategories,
  getPublicAuthors,
} from '@/lib/queries';
import { absoluteUrl } from '@/lib/site';
import { RANKINGS } from './rankings/meta';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [novels, chapters, categories, authors] = await Promise.all([
    getSitemapNovels(),
    getSitemapChapters(),
    getCategories(),
    getPublicAuthors(),
  ]);

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Static public pages
  const statics: { path: string; priority: number }[] = [
    { path: '/', priority: 1 },
    { path: '/novels', priority: 0.9 },
    { path: '/rankings', priority: 0.8 },
    { path: '/categories', priority: 0.8 },
    { path: '/authors', priority: 0.7 },
    { path: '/authors/ranking', priority: 0.6 },
  ];
  for (const s of statics) {
    entries.push({ url: absoluteUrl(s.path), lastModified: now, priority: s.priority });
  }
  for (const r of RANKINGS) {
    entries.push({ url: absoluteUrl(`/rankings/${r.slug}`), lastModified: now, priority: 0.6 });
  }
  for (const c of categories) {
    entries.push({
      url: absoluteUrl(`/categories/${encodeURIComponent(c.slug)}`),
      lastModified: now,
      priority: 0.6,
    });
  }
  for (const a of authors) {
    entries.push({
      url: absoluteUrl(`/authors/${encodeURIComponent(a.slug)}`),
      lastModified: now,
      priority: 0.5,
    });
  }
  for (const n of novels) {
    entries.push({
      url: absoluteUrl(`/novels/${encodeURIComponent(n.slug)}`),
      lastModified: new Date(n.updatedAt),
      priority: 0.7,
    });
  }
  for (const ch of chapters) {
    entries.push({
      url: absoluteUrl(`/novels/${encodeURIComponent(ch.novelSlug)}/${ch.chapterNumber}`),
      lastModified: new Date(ch.updatedAt),
      priority: 0.5,
    });
  }

  return entries;
}
