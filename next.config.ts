import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export' breaks dynamic routes that rely on runtime data (e.g. UUID params)
  // because Next requires generateStaticParams() to include every possible param value.
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // ESLint config in next.config.ts is not supported in Next.js 16.
};

export default nextConfig;

