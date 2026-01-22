import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: "1000mb", // Supports strings like '10mb', '500kb', or numbers in bytes
    },
  },
};

export default nextConfig;
