import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '光羽小说 管理后台',
  description: '光羽小说 — 管理后台与作者中心。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
