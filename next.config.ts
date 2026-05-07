import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

  // ─── Server-side only packages (never bundled for client) ─────
  // These are Node.js packages used only in API routes / server components.
  // Listing them prevents Turbopack from trying to CJS-transform them for the browser.
  serverExternalPackages: [
    'bcryptjs',
    'cloudinary',
    'qrcode',
    'sharp',
    'nodemailer',
  ],

  // ─── Optimize barrel imports ───────────────────────────────────
  // Prevents re-export chains from pulling in entire packages during HMR.
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
      'recharts',
      'date-fns',
    ],
  },
};

export default nextConfig;
