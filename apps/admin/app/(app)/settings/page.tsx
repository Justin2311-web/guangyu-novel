import { createSupabaseServerClient } from '@/lib/supabase/server';
import { parseSiteSettings } from '@guangyu/database';
import { SettingsForm } from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('site_settings').select('key, value');
  const settings = parseSiteSettings(data);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">站点设置</h1>
        <p className="text-sm text-stone-500">
          管理网站级配置（仅管理员）。保存后读者端会在下次访问时自动更新。
        </p>
      </header>
      <SettingsForm settings={settings} />
    </section>
  );
}
