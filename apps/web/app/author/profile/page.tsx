import Link from 'next/link';
import { ensureMyAuthor } from '@/lib/author';
import { AuthorProfileForm } from './AuthorProfileForm';

export const dynamic = 'force-dynamic';

export default async function AuthorProfilePage() {
  const author = await ensureMyAuthor();

  if (!author) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-800">
        未找到作者资料。如需作者身份请先在
        <Link href="/account" className="mx-1 underline">
          我的账户
        </Link>
        提交申请。
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-medium text-stone-800">作者资料</h2>
        <p className="mt-1 text-sm text-stone-500">
          这些信息会展示在你的公开作者主页
          {author.slug && (
            <Link
              href={`/authors/${author.slug}`}
              className="ml-1 text-brand hover:underline"
              target="_blank"
            >
              （查看主页）
            </Link>
          )}
          。
        </p>
      </div>

      <AuthorProfileForm
        defaults={{
          pen_name: author.pen_name,
          bio: author.bio ?? '',
          avatar_url: author.avatar_url ?? '',
        }}
      />
    </div>
  );
}
