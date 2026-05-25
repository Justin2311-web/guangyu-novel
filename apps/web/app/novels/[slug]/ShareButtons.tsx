'use client';

import { useState } from 'react';

/** Lightweight social share — no dependencies, plain share URLs + Web Share API. */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title);

  const links: { label: string; href: string }[] = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${encTitle}%20${enc}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc}` },
    { label: 'Telegram', href: `https://t.me/share/url?url=${enc}&text=${encTitle}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  async function nativeShare() {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* user cancelled */
      }
    } else {
      void copy();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-stone-400">分享</span>
      <button type="button" onClick={copy} className="gy-btn-ghost !px-2.5 !py-1">
        {copied ? '已复制' : '复制链接'}
      </button>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="gy-btn-ghost !px-2.5 !py-1"
        >
          {l.label}
        </a>
      ))}
      <button type="button" onClick={nativeShare} className="gy-btn-ghost !px-2.5 !py-1 sm:hidden">
        系统分享
      </button>
    </div>
  );
}
