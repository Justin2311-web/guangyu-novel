export default function HomePage() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-10 text-white shadow-sm">
        <h1 className="text-3xl font-semibold">欢迎来到 光羽小说</h1>
        <p className="mt-3 max-w-xl text-white/90">
          这是 Phase 0 的占位首页。后续阶段将接入 Supabase 数据、登录注册、阅读器、作者后台等功能。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {['推荐作品', '最新更新', '热门小说'].map((title) => (
          <div key={title} className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-medium">{title}</h2>
            <p className="mt-2 text-sm text-stone-500">数据将在后续阶段接入。</p>
          </div>
        ))}
      </div>
    </section>
  );
}
