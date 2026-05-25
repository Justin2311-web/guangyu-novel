'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type FontSize = 'sm' | 'md' | 'lg';
type LineH = 'tight' | 'normal' | 'loose';
type Theme = 'default' | 'eye' | 'night';

type NavItem = { chapter_number: number } | null;

const FONT: Record<FontSize, string> = {
  sm: 'text-[15px]',
  md: 'text-[17px]',
  lg: 'text-[20px]',
};
const LINE: Record<LineH, string> = {
  tight: 'leading-7',
  normal: 'leading-9',
  loose: 'leading-[2.6rem]',
};
const THEME: Record<Theme, { wrap: string; meta: string; ctrl: string }> = {
  default: { wrap: 'bg-[#fdfbf6] text-stone-800', meta: 'text-stone-400', ctrl: 'bg-white/70 text-stone-600' },
  eye: { wrap: 'bg-[#e9efe1] text-stone-800', meta: 'text-stone-500', ctrl: 'bg-white/60 text-stone-600' },
  night: { wrap: 'bg-stone-900 text-stone-200', meta: 'text-stone-500', ctrl: 'bg-stone-800 text-stone-300' },
};

const FONT_OPTS: [FontSize, string][] = [['sm', '小'], ['md', '中'], ['lg', '大']];
const LINE_OPTS: [LineH, string][] = [['tight', '紧凑'], ['normal', '标准'], ['loose', '宽松']];
const THEME_OPTS: [Theme, string][] = [['default', '默认'], ['eye', '护眼'], ['night', '夜间']];

function useStored<T extends string>(key: string, fallback: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(fallback);
  useEffect(() => {
    const s = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    if (s) setVal(s as T);
  }, [key]);
  const set = (v: T) => {
    setVal(v);
    try {
      window.localStorage.setItem(key, v);
    } catch {
      /* ignore */
    }
  };
  return [val, set];
}

export function ChapterReader({
  title,
  content,
  isHtml = false,
  novelTitle,
  novelSlug,
  chapterNumber,
  prev,
  next,
}: {
  title: string;
  content: string;
  isHtml?: boolean;
  novelTitle: string;
  novelSlug: string;
  chapterNumber: number;
  prev: NavItem;
  next: NavItem;
}) {
  const [font, setFont] = useStored<FontSize>('gy-reader-font', 'md');
  const [line, setLine] = useStored<LineH>('gy-reader-line', 'normal');
  const [theme, setTheme] = useStored<Theme>('gy-reader-theme', 'default');
  const t = THEME[theme];

  const segBtn = (active: boolean) =>
    `rounded px-2.5 py-1 text-xs transition ${
      active ? 'bg-brand text-white' : 'hover:bg-black/5'
    }`;

  const Group = <T extends string>({
    label,
    opts,
    value,
    onChange,
  }: {
    label: string;
    opts: [T, string][];
    value: T;
    onChange: (v: T) => void;
  }) => (
    <div className="flex items-center gap-1.5">
      <span className="text-xs opacity-70">{label}</span>
      <div className="flex gap-1">
        {opts.map(([v, lbl]) => (
          <button key={v} type="button" onClick={() => onChange(v)} className={segBtn(value === v)}>
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );

  const Pager = () => (
    <nav className="flex items-center justify-between gap-3 text-sm">
      {prev ? (
        <Link href={`/novels/${novelSlug}/${prev.chapter_number}`} className="gy-btn-ghost">← 上一章</Link>
      ) : (
        <span className="gy-btn-ghost cursor-not-allowed opacity-40">← 上一章</span>
      )}
      <Link href={`/novels/${novelSlug}`} className="opacity-70 hover:opacity-100">目录</Link>
      {next ? (
        <Link href={`/novels/${novelSlug}/${next.chapter_number}`} className="gy-btn-ghost">下一章 →</Link>
      ) : (
        <span className="gy-btn-ghost cursor-not-allowed opacity-40">下一章 →</span>
      )}
    </nav>
  );

  return (
    <div className={`gy-card overflow-hidden border-amber-100 ${t.wrap}`}>
      {/* Controls */}
      <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-black/5 px-4 py-2.5 ${t.ctrl}`}>
        <Group label="字号" opts={FONT_OPTS} value={font} onChange={setFont} />
        <Group label="行距" opts={LINE_OPTS} value={line} onChange={setLine} />
        <Group label="主题" opts={THEME_OPTS} value={theme} onChange={setTheme} />
      </div>

      <div className="px-6 py-8 sm:px-10 sm:py-10">
        <header className="mb-6 text-center">
          <h1 className="font-serif text-2xl font-bold">{title}</h1>
          <p className={`mt-2 text-xs ${t.meta}`}>{novelTitle} · 第 {chapterNumber} 章</p>
        </header>

        {isHtml ? (
          <div
            className={`gy-chapter-content font-serif tracking-wide ${FONT[font]} ${LINE[line]}`}
            // Content is sanitized server-side (sanitize-html allow-list) before render.
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className={`whitespace-pre-line font-serif tracking-wide ${FONT[font]} ${LINE[line]}`}>
            {content}
          </div>
        )}

        <div className="mt-10 border-t border-black/10 pt-5">
          <Pager />
        </div>
      </div>
    </div>
  );
}
