// Central site constants for SEO / metadata. The production reader URL is the
// canonical base; override with NEXT_PUBLIC_SITE_URL when a custom domain is set.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://guangyu-reader.vercel.app'
).replace(/\/$/, '');

export const SITE_NAME = '光羽小说';

export const DEFAULT_TITLE = '光羽小说 - 免费在线小说阅读平台';

export const DEFAULT_DESCRIPTION =
  '光羽小说是一个中文在线小说阅读平台，提供玄幻、都市、仙侠、历史、科幻、悬疑等类型小说，支持作者创作、章节阅读、书架、排行榜与评论互动。';

/** Absolute URL for a path on the reader site. */
export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Collapse whitespace and clamp text to a metadata-safe length. */
export function clampText(text: string | null | undefined, max = 160): string | undefined {
  if (!text) return undefined;
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return undefined;
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}
