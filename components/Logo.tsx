/** Rose Bar & Restaurant logo. Source art: /public/logo.png */
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
      src="/logo.png"
      alt="Rose Bar & Restaurant"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={className}
    />
  );
}
