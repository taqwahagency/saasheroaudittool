import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow longer API responses for Playwright + AI processing
  serverExternalPackages: ['playwright'],
  // Served under taqwah.agency/tools/saas-hero-audit via Nginx reverse proxy
  basePath: '/tools/saas-hero-audit',
};

export default nextConfig;
