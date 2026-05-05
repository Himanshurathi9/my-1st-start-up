import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  allowedDevOrigins: [
    '21.0.18.103', '21.0.20.21', '127.0.0.1', 'localhost',
    'preview-chat-549f60e9-24c3-4ff9-a169-7aec138b83e2.space-z.ai',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true, // TODO: Fix TS errors incrementally before enabling
  },
  reactStrictMode: false, // TODO: Enable after verifying no double-render issues
};

export default nextConfig;
