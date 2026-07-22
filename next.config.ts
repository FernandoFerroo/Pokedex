import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Self-contained server bundle so the Docker image ships without
     node_modules; Vercel ignores this setting. */
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/PokeAPI/sprites/**",
      },
      {
        protocol: "https",
        hostname: "assets.tcgdex.net",
      },
    ],
  },
};

export default nextConfig;
