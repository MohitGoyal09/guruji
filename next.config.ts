import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["images.unsplash.com"],
  },
  // Exclude Remotion packages from server-side bundling to avoid esbuild issues
  serverExternalPackages: [
    '@remotion/bundler',
    '@remotion/renderer',
    '@remotion/cli',
    'remotion',
  ],
};

export default nextConfig;
