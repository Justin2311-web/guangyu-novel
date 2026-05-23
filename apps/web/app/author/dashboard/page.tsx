import Link from 'next/link';
import { NOVEL_SERIAL_STATUS_LABELS } from '@guangyu/database';
import { getMyAuthor, getMyNovels, getMyChapters, computeNovelStats } from '@/lib/author';

export const dynamic = 'force-dynamic';

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="text-2xl font-semibold text-stone-800">{value}</div>
      <div className="mt-1 text-sm text-stone-500">{label}</div>
    </div>
  );
}

export default async function AuthorDashboardPage() {
  const author = await getMyAuthor();

  if (!author) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-800">
        未找到作者资料。如果你是管理员，请通过后台管理作品；如需作者身份请先在
        <Link href="/account" className="mx-1 underline">
          我的账户
        </Link>
        提交申请。
      </div>
    );
  }

  const novels = await getMyNovels(author.id);
  const chapters = await getMyChapters(novels.map((n) => n.id));
  const stats = computeNovelStats(novels);
  const latest = novels.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <div className="text-sm text-stone-400">作者</div>
        <div className="text-lg font-medium text-stone-800">{author.pen_name}</div>
        {author.bio && <p className="mt-1 text-sm text-stone-500">{author.bio}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="作品总数" value={stats.totalNovels} />
        <Stat label="已发布" value={stats.publishedNovels} />
        <Stat label="草稿" value={stats.draftNovels} />
        <Stat label="待审核" value={stats.pendingNovels} />
        <Stat label="章节总数" value={chapters.length} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/author/novels/new"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          新增小说
        </Link>
        <Link
          href="/author/novels"
          className="rounded-md border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:border-brand hover:text-brand"
        >
          管理我的作品
        </Link>
        <Link
          href="/author/chapters/new"
          className="rounded-md border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:border-brand hover:text-brand"
        >
          新增章节
        </Link>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">最近更新</h2>
        {latest.length === 0 ? (
          <p className="text-sm text-stone-500">还没有作品，点击「新增小说」开始创作。</p>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white">
            {latest.map((n) => (
              <li key={n.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <Link href={`/author/novels/${n.id}/edit`} className="font-medium text-stone-800 hover:text-brand">
                    {n.title}
                  </Link>
                  <div className="mt-0.5 text-xs text-stone-400">
                    {NOVEL_SERIAL_STATUS_LABELS[n.status]} · 更新于 {n.updated_at.slice(0, 10)}
                  </div>
                </div>
                <ReviewBadge status={n.review_status} published={n.is_published} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ReviewBadge({ status, published }: { status: string; published: boolean }) {
  const map: Record<string, { text: string; cls: string }> = {
    draft: { text: '草稿', cls: 'bg-stone-100 text-stone-500' },
    pending_review: { text: '待审核', cls: 'bg-amber-50 text-amber-700' },
    published: { text: '已发布', cls: 'bg-emerald-50 text-emerald-700' },
    rejected: { text: '已拒绝', cls: 'bg-red-50 text-red-700' },
    archived: { text: '已归档', cls: 'bg-stone-100 text-stone-500' },
  };
  const fallback = { text: '草稿', cls: 'bg-stone-100 text-stone-500' };
  const b =
    (published && status !== 'published' ? map.published : map[status]) ?? fallback;
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${b.cls}`}>{b.text}</span>;
}
