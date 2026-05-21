import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Banner } from '@guangyu/database';
import { updateBannerAction } from '../../actions';
import { BannerForm } from '../../BannerForm';

export const dynamic = 'force-dynamic';

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('banners')
    .select(
      'id, title, image_url, mobile_image_url, link_url, button_label, sort_order, active, created_at, updated_at',
    )
    .eq('id', id)
    .maybeSingle();

  if (!data) notFound();
  const banner = data as Banner;

  const action = updateBannerAction.bind(null, banner.id);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">编辑横幅</h1>
      <BannerForm
        action={action}
        submitLabel="保存"
        defaults={{
          title: banner.title,
          image_url: banner.image_url,
          mobile_image_url: banner.mobile_image_url,
          link_url: banner.link_url,
          button_label: banner.button_label,
          sort_order: banner.sort_order,
          active: banner.active,
        }}
      />
    </section>
  );
}
