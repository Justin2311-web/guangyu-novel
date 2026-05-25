'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type DraftStatus = 'idle' | 'saving' | 'saved';

type Stored<T> = T & { ts: number };

const PREFIX = 'gy-draft:';

function safeRead<T>(key: string): Stored<T> | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as Stored<T>;
  } catch {
    return null;
  }
}

/**
 * Local (per-browser) draft autosave. The form supplies a stable `key` and a
 * `getValues()` snapshot fn. A recoverable draft (the snapshot that existed
 * before this editing session) is surfaced once on mount so the form can offer
 * restore / ignore. Writes are debounced via `touch()` plus a periodic flush.
 */
export function useAutosaveDraft<T extends Record<string, unknown>>(
  key: string,
  getValues: () => T,
  intervalMs = 12000,
) {
  const [status, setStatus] = useState<DraftStatus>('idle');
  const [lastTs, setLastTs] = useState<number | null>(null);
  const [recoverable, setRecoverable] = useState<Stored<T> | null>(null);

  const getValuesRef = useRef(getValues);
  getValuesRef.current = getValues;
  const dirtyRef = useRef(false);
  const lastSerialized = useRef<string>('');

  // Surface any pre-existing draft once on mount.
  useEffect(() => {
    setRecoverable(safeRead<T>(key));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const flush = useCallback(() => {
    if (!dirtyRef.current) return;
    const values = getValuesRef.current();
    const serialized = JSON.stringify(values);
    if (serialized === lastSerialized.current) {
      dirtyRef.current = false;
      return;
    }
    try {
      setStatus('saving');
      window.localStorage.setItem(PREFIX + key, JSON.stringify({ ...values, ts: Date.now() }));
      lastSerialized.current = serialized;
      dirtyRef.current = false;
      setLastTs(Date.now());
      setStatus('saved');
    } catch {
      setStatus('idle');
    }
  }, [key]);

  // Periodic flush while editing.
  useEffect(() => {
    const id = window.setInterval(flush, intervalMs);
    return () => window.clearInterval(id);
  }, [flush, intervalMs]);

  /** Mark dirty; a short debounce then persists. */
  const touch = useCallback(() => {
    dirtyRef.current = true;
    const id = window.setTimeout(flush, 800);
    return () => window.clearTimeout(id);
  }, [flush]);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch {
      /* ignore */
    }
    dirtyRef.current = false;
    setStatus('idle');
    setLastTs(null);
  }, [key]);

  const dismissRecoverable = useCallback(() => setRecoverable(null), []);

  return { status, lastTs, recoverable, touch, flush, clear, dismissRecoverable };
}

export function formatDraftTime(ts: number): string {
  const d = new Date(ts);
  const h = `${d.getHours()}`.padStart(2, '0');
  const m = `${d.getMinutes()}`.padStart(2, '0');
  return `${h}:${m}`;
}
