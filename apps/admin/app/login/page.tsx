import { AdminLoginForm } from './LoginForm';

const ERRORS: Record<string, string> = {
  forbidden: '没有权限访问该页面。',
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <div className="mx-auto max-w-md py-12">
      <div className="rounded-lg border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">后台登录</h1>
        <p className="mt-1 text-sm text-stone-500">
          仅限管理员与作者使用。读者请前往主站。
        </p>
        {error && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {ERRORS[error] ?? '请重新登录。'}
          </p>
        )}
        <div className="mt-6">
          <AdminLoginForm next={next ?? '/'} />
        </div>
      </div>
    </div>
  );
}
