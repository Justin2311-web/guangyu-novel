import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicAuthorBySlug, getAuthorPublicData } from '@/lib/queries';
import { AuthorAvatar } from '../../components/AuthorAvatar';
import { AuthorLevelBadge } from '../../components/AuthorLevelBadge';
import { PosterCard } from '../../components/PosterCard';
import { SectionHeader } from '../../components/SectionHeader';
import { SITE_NAME, absoluteUrl, clampText } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = await getPublicAuthorBySlug(slug);
  if (!author) return { title: '未找到', robots: { index: false, follow: false } };

  const canonical = `/authors/${encodeURIComponent(author.slug)}`;
  const title = `${author.penName} - 作者主页`;
  const description =
    clampText(author.bio) ?? `${author.penName} 在 ${SITE_NAME} 的作品与简介。`;
  const images = author.avatarUrl ? [{ url: author.avatarUrl }] : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'profile',
      title: `${title} - ${SITE_NAME}`,
      description,
      url: canonical,
      images,
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title: `${title} - ${SITE_NAME}`,
      description,
      ...(images ? { images: [author.avatarUrl as string] } : {}),
    },
  };
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-amber-100 bg-white/70 px-4 py-3 text-center">
      <div className="font-serif text-xl font-bold text-stone-800">{value.toLocaleString()}</div>
      <div className="mt-0.5 text-xs text-stone-500">{label}</div>
    </div>
  );
}

export default async function AuthorPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = await getPublicAuthorBySlug(slug);
  if (!author) notFound();

  const { novels, stats } = await getAuthorPublicData(author.id);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.penName,
    url: absoluteUrl(`/authors/${encodeURIComponent(author.slug)}`),
    ...(author.bio ? { description: clampText(author.bio, 300) } : {}),
    ...(author.avatarUrl ? { image: author.avatarUrl } : {}),
  };

  return (
    <article className="space-y-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="text-sm text-stone-500">
        <Link href="/authors" className="hover:text-brand">作者</Link>
        <span className="px-1.5">/</span>
        <span className="text-stone-700">{author.penName}</span>
      </nav>

      {/* Hero */}
      <div className="gy-card overflow-hidden border-amber-100 bg-gradient-to-br from-amber-50 to-white">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <AuthorAvatar src={author.avatarUrl} name={author.penName} size="lg" />
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-2xl font-bold text-stone-900">{author.penName}</h1>
              <AuthorLevelBadge totalViews={stats.totalViews} />
            </div>
            <p className="text-xs text-stone-400">加入于 {author.createdAt.slice(0, 10)}</p>
            <p className="max-w-2xl whitespace-pre-line text-sm leading-relaxed text-stone-600">
              {author.bio?.trim() || '这位作者还没有填写简介。'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="作品总数" value={stats.totalNovels} />
        <Stat label="章节总数" value={stats.totalChapters} />
        <Stat label="总阅读量" value={stats.totalViews} />
      </div>

      {/* Novels */}
      <section>
        <SectionHeader title="最近更新作品" />
        {novels.length === 0 ? (
          <div className="gy-card px-4 py-12 text-center text-sm text-stone-500">
            这位作者还没有已发布的作品。
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {novels.map((n) => (
              <PosterCard key={n.id} novel={n} />
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
