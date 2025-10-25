import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverActions: {
    bodySizeLimit: '50mb', // Increase limit for video uploads
  },
};

export default nextConfig;
