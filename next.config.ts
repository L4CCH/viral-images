import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tile.loc.gov",
      },
    ],
  },
};

export default nextConfig;
