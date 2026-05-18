import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude @react-pdf/renderer from server-side bundling (client-only PDF generation)
  serverExternalPackages: ["@react-pdf/renderer"],
  turbopack: {
    resolveAlias: {
      "react-is": "./node_modules/react-is/index.js",
    },
  },
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
      // CRM → Commercial routing migration
      { source: "/crm/pipeline", destination: "/commercial/leads", permanent: true },
      { source: "/crm/pipeline/", destination: "/commercial/leads/", permanent: true },
      { source: "/crm/leads/new", destination: "/commercial/leads/new", permanent: true },
      { source: "/crm/leads/new/", destination: "/commercial/leads/new/", permanent: true },
      { source: "/crm/leads/:id", destination: "/commercial/leads/:id", permanent: true },
      { source: "/crm/leads/:id/", destination: "/commercial/leads/:id/", permanent: true },
      { source: "/crm/leads/:id/edit", destination: "/commercial/leads/:id/edit", permanent: true },
      { source: "/crm/leads/:id/edit/", destination: "/commercial/leads/:id/edit/", permanent: true },
      { source: "/crm/leads/:id/convert", destination: "/commercial/leads/:id/convert", permanent: true },
      { source: "/crm/leads/:id/convert/", destination: "/commercial/leads/:id/convert/", permanent: true },
      { source: "/crm/clients", destination: "/commercial/clients", permanent: true },
      { source: "/crm/clients/", destination: "/commercial/clients/", permanent: true },
      { source: "/crm/companies", destination: "/commercial/companies", permanent: true },
      { source: "/crm/companies/", destination: "/commercial/companies/", permanent: true },
      { source: "/crm/activities", destination: "/commercial/activities", permanent: true },
      { source: "/crm/activities/", destination: "/commercial/activities/", permanent: true },
      { source: "/crm/activities/new", destination: "/commercial/activities/new", permanent: true },
      { source: "/crm/activities/new/", destination: "/commercial/activities/new/", permanent: true },
      { source: "/crm/opportunities", destination: "/commercial/opportunities", permanent: true },
      { source: "/crm/opportunities/", destination: "/commercial/opportunities/", permanent: true },
      { source: "/crm/opportunities/new", destination: "/commercial/opportunities/new", permanent: true },
      { source: "/crm/opportunities/new/", destination: "/commercial/opportunities/new/", permanent: true },
      { source: "/crm/opportunities/:id/edit", destination: "/commercial/opportunities/:id/edit", permanent: true },
      { source: "/crm/opportunities/:id/edit/", destination: "/commercial/opportunities/:id/edit/", permanent: true },
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

