/** Author avatar with a graceful gold-gradient initial fallback. */
export function AuthorAvatar({
  src,
  name,
  size = 'md',
}: {
  src: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim =
    size === 'lg' ? 'h-24 w-24 text-3xl' : size === 'sm' ? 'h-10 w-10 text-base' : 'h-16 w-16 text-xl';
  const initial = name.trim().charAt(0) || '?';

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`${dim} shrink-0 rounded-full object-cover ring-2 ring-amber-100`}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark font-serif font-bold text-white ring-2 ring-amber-100`}
    >
      {initial}
    </div>
  );
}
