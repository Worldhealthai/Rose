/**
 * Rose Bar & Restaurant logo.
 * Swap the artwork by replacing /public/logo.svg (or point src at /logo.png).
 */
export function Logo({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt="Rose Bar & Restaurant"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={className}
    />
  );
}
