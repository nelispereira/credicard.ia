import type { NextConfig } from "next";
import pkg from "./package.json";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
};

export default nextConfig;
