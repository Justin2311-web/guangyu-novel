import Link from 'next/link';
import { getPublicAuthors } from '@/lib/queries';
import { AuthorAvatar } from '../components/AuthorAvatar';

export const dynamic = 'force-dynamic';

export const metadata = { title: '作者' };

export default async function AuthorsDirectoryPage() {
  const authors = await getPublicAuthors();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900">作者列表</h1>
        <p className="mt-1 text-sm text-stone-500">共 {authors.length} 位作者</p>
      </div>

      {authors.length === 0 ? (
        <div className="gy-card px-4 py-16 text-center text-stone-500">暂无作者。</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((a) => (
            <Link
              key={a.id}
              href={`/authors/${encodeURIComponent(a.slug)}`}
              className="gy-card flex gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <AuthorAvatar src={a.avatarUrl} name={a.penName} size="md" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-serif text-base font-semibold text-stone-800">
                  {a.penName}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500">
                  {a.bio?.trim() || '这位作者还没有填写简介。'}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-stone-400">
                  <span>{a.novelCount} 部作品</span>
                  <span>·</span>
                  <span>加入于 {a.createdAt.slice(0, 10)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
