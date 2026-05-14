import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export' breaks dynamic routes that rely on runtime data (e.g. UUID params)
  // because Next requires generateStaticParams() to include every possible param value.
  async redirects() {
    return [
      {
        source: "/performance/360/matrix",
        destination: "/performance/360/dashboard/",
        permanent: true,
      },
      {
        source: "/performance/360/matrix/",
        destination: "/performance/360/dashboard/",
        permanent: true,
      },
      {
        source: "/performance/360/struktur-organisasi",
        destination: "/performance/360/mapping-penilaian/",
        permanent: true,
      },
      {
        source: "/performance/360/struktur-organisasi/",
        destination: "/performance/360/mapping-penilaian/",
        permanent: true,
      },
    ]
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  // ESLint config in next.config.ts is not supported in Next.js 16.
};

export default nextConfig;

