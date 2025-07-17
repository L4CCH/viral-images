import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tile.loc.gov",
      },
      {
        protocol: "https",
        hostname: "chroniclingamerica.loc.gov",
      },
    ],
  },
  assetPrefix: isProd ? '/viral-images/' : '',
  basePath: isProd ? '/viral-images' : '',
};

export default nextConfig;
