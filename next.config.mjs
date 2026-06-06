/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't reuse client-side route cache for dynamic pages, so data updates
  // show immediately after a save instead of needing a manual refresh.
  experimental: {
    staleTimes: { dynamic: 0 },
  },
};

export default nextConfig;
