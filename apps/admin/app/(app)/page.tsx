export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">概览</h1>
        <p className="text-sm text-stone-500">Phase 0 占位。Phase 2 起接入登录与权限。</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: '小说数量', value: '—' },
          { label: '章节数量', value: '—' },
          { label: '作者数量', value: '—' },
          { label: '注册读者', value: '—' },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="text-xs text-stone-500">{card.label}</div>
            <div className="mt-2 text-2xl font-semibold">{card.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
