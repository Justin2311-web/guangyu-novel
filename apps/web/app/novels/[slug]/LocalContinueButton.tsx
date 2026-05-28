'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type LocalProgress = { chapterNumber: number; ts: number };

/**
 * Client-only CTA shown on the novel detail page when no DB-backed reading
 * progress is available (i.e. anonymous visitor or signed-in user who hasn't
 * recorded server-side progress yet). Reads `gy-progress:<slug>` written by
 * <RecordLocalProgress/> on the chapter page.
 *
 * Renders nothing on first paint (SSR mismatch-safe) and after hydration only
 * if a valid local entry exists *and* the recorded chapter is within the
 * published catalog.
 */
export function LocalContinueButton({
  novelSlug,
  maxChapterNumber,
}: {
  novelSlug: string;
  /** Highest published chapter_number; used to drop stale localStorage values. */
  maxChapterNumber: number;
}) {
  const [progress, setProgress] = useState<LocalProgress | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(`gy-progress:${novelSlug}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<LocalProgress>;
      const n = Number(parsed?.chapterNumber);
      if (!Number.isInteger(n) || n < 1 || n > maxChapterNumber) return;
      setProgress({ chapterNumber: n, ts: Number(parsed?.ts) || 0 });
    } catch {
      // ignore malformed JSON
    }
  }, [novelSlug, maxChapterNumber]);

  if (!progress) return null;

  return (
    <Link
      href={`/novels/${novelSlug}/${progress.chapterNumber}`}
      className="gy-btn-primary"
    >
      继续阅读 · 第 {progress.chapterNumber} 章
    </Link>
  );
}
