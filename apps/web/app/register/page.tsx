import Link from 'next/link';
import { RegisterForm } from './RegisterForm';

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">注册账号</h1>
        <p className="mt-1 text-sm text-stone-500">注册即成为光羽小说读者，可收藏与同步进度。</p>
      </div>
      <RegisterForm />
      <p className="text-sm text-stone-500">
        已有账号？{' '}
        <Link href="/login" className="text-brand hover:underline">
          去登录
        </Link>
      </p>
    </div>
  );
}
