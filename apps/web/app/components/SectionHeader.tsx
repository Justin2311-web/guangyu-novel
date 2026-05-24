import Link from 'next/link';

export function SectionHeader({
  title,
  href,
  more = '查看全部',
}: {
  title: string;
  href?: string;
  more?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="gy-heading">{title}</h2>
      {href && (
        <Link href={href} className="text-sm text-stone-500 hover:text-brand">
          {more} →
        </Link>
      )}
    </div>
  );
}
