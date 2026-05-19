import Link from 'next/link';
import { LoginForm } from './LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">读者登录</h1>
        <p className="mt-1 text-sm text-stone-500">登录后可收藏小说、保存阅读进度。</p>
      </div>
      <LoginForm next={next ?? '/'} />
      <p className="text-sm text-stone-500">
        还没有账号？{' '}
        <Link href="/register" className="text-brand hover:underline">
          立即注册
        </Link>
      </p>
    </div>
  );
}
