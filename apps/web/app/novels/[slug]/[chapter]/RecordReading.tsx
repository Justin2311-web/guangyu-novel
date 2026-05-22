'use client';

import { useEffect } from 'react';
import { recordReadingProgressAction } from '@/app/reader-actions';

/**
 * Fire-and-forget: records the current user's progress when a chapter opens.
 * Only mounted for logged-in readers; failures are non-blocking.
 */
export function RecordReading({ novelId, chapterId }: { novelId: string; chapterId: string }) {
  useEffect(() => {
    void recordReadingProgressAction(novelId, chapterId).catch(() => {});
  }, [novelId, chapterId]);
  return null;
}
