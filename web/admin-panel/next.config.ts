import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Build optimizations
  // Note: swcMinify is deprecated in Next.js 15, SWC minification is enabled by default
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    // Enable parallel webpack builds for faster compilation
    webpackBuildWorker: true,
    // Optimize CSS handling (requires critters package) - Disable if causing slow builds
    optimizeCss: false, // Disabled to speed up builds
    // Enable aggressive tree-shaking for package imports
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      'lucide-react',
      '@mui/x-data-grid',
      '@mui/x-date-pickers',
      'framer-motion',
    ],
    // Disable some experimental features that might slow down builds
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Reduce bundle size by optimizing server components (moved from experimental)
  serverExternalPackages: ['@prisma/client'],
  // Webpack optimizations - Simplified to speed up builds
  webpack: (config, { isServer, dev }) => {
    // Only apply complex optimizations in production and for client builds
    if (!dev && !isServer) {
      // Simplified code splitting - less aggressive to speed up builds
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Framework chunk
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // Large libraries chunk
            lib: {
              test(module: any) {
                return module.size() > 200000 && /node_modules[/\\]/.test(module.identifier());
              },
              name(module: any) {
                const hash = require('crypto').createHash('sha1');
                hash.update(module.identifier());
                return hash.digest('hex').substring(0, 8);
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // Common chunks
            commons: {
              name: 'commons',
              minChunks: 3, // Increased from 2 to reduce chunks
              priority: 20,
            },
          },
        },
      };
    }
    return config;
  },
  // Image optimization settings - lightweight mode
  images: {
    // Use unoptimized images to reduce build time and bundle size
    // Images will still work, just not optimized by Next.js
    unoptimized: true, // Disable Next.js image optimization for smaller bundle
    // Add remote patterns if needed, but avoid external fetches during build
    remotePatterns: [],
    // Increase timeout for image optimization
    minimumCacheTTL: 60,
    // Use default loader (no optimization)
    loader: 'default',
    // Reduce image formats for smaller bundle
    formats: ['image/webp'],
  },
  // Production optimizations
  productionBrowserSourceMaps: false, // Disable source maps for smaller bundle
  compress: true, // Enable gzip compression
  // Reduce build output verbosity
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Security: Disable X-Powered-By header
  poweredByHeader: false,
  // Security: Enable React strict mode
  reactStrictMode: true,
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval for development
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: http: http://72.62.51.50:*",
              "font-src 'self' data:",
              "connect-src 'self' http://72.62.51.50:* ws://72.62.51.50:* wss://72.62.51.50:*", // Allow connections to your services
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          }
        ],
      },
    ];
  },
};

export default nextConfig;
