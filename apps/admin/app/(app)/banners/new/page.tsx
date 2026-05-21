import { createBannerAction } from '../actions';
import { BannerForm } from '../BannerForm';

export default function NewBannerPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">新建横幅</h1>
      <BannerForm action={createBannerAction} submitLabel="创建" />
    </section>
  );
}
