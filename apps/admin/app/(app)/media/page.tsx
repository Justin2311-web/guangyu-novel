import { redirect } from 'next/navigation';
import { canManageContent } from '@guangyu/database';
import { getCurrentAdminUser } from '@/lib/supabase/server';
import { MediaLibrary } from './MediaLibrary';

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  // Admin / superadmin only (authors can reach the shell, so guard explicitly).
  const session = await getCurrentAdminUser();
  if (!session || !canManageContent(session.profile.role)) redirect('/');

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">媒体库</h1>
        <p className="text-sm text-stone-500">
          管理 Supabase Storage（public-assets）中的图片资源：上传、复制链接、删除。
        </p>
      </header>
      <MediaLibrary />
    </section>
  );
}
