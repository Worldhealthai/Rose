/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cache navigated pages on the client so switching tabs / going back is
  // instant (and prefetch works). Saves still update immediately because
  // mutations call router.refresh() / revalidatePath().
  experimental: {
    staleTimes: { dynamic: 30, static: 180 },
  },
};

export default nextConfig;
