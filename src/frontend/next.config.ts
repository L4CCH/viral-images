import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  output: "export",
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
};

export default nextConfig;
