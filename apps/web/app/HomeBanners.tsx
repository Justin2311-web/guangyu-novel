import Link from 'next/link';
import type { HomeBanner } from '@/lib/queries';

function BannerImage({ banner }: { banner: HomeBanner }) {
  return (
    <picture>
      {banner.mobile_image_url && (
        <source media="(max-width: 640px)" srcSet={banner.mobile_image_url} />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.image_url}
        alt={banner.title ?? ''}
        className="h-auto w-full object-cover"
      />
    </picture>
  );
}

function BannerOverlay({ banner }: { banner: HomeBanner }) {
  if (!banner.title && !banner.button_label) return null;
  return (
    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/50 to-transparent p-5">
      {banner.title && <span className="text-lg font-medium text-white">{banner.title}</span>}
      {banner.button_label && (
        <span className="rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium text-stone-900">
          {banner.button_label}
        </span>
      )}
    </div>
  );
}

export function HomeBanners({ banners }: { banners: HomeBanner[] }) {
  if (banners.length === 0) return null;

  return (
    <div className="space-y-4">
      {banners.map((banner) => {
        const inner = (
          <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-sm">
            <BannerImage banner={banner} />
            <BannerOverlay banner={banner} />
          </div>
        );
        return banner.link_url ? (
          <Link key={banner.id} href={banner.link_url} className="block">
            {inner}
          </Link>
        ) : (
          <div key={banner.id}>{inner}</div>
        );
      })}
    </div>
  );
}
