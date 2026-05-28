'use client';

import { useEffect } from 'react';

/**
 * Anonymous-safe reading-progress recorder. Writes the latest chapter the
 * visitor opened for a given novel to localStorage, scoped by novel slug.
 * Independent of the DB-backed `recordReadingProgressAction` so that logged-out
 * readers still get a "继续阅读" CTA on the novel detail page.
 *
 * Schema (forward-compatible):
 *   key   = `gy-progress:<novelSlug>`
 *   value = JSON.stringify({ chapterNumber: number, ts: number })
 */
export function RecordLocalProgress({
  novelSlug,
  chapterNumber,
}: {
  novelSlug: string;
  chapterNumber: number;
}) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const payload = JSON.stringify({ chapterNumber, ts: Date.now() });
      window.localStorage.setItem(`gy-progress:${novelSlug}`, payload);
    } catch {
      // Quota / privacy mode — silently ignore; this is non-essential UX.
    }
  }, [novelSlug, chapterNumber]);
  return null;
}
