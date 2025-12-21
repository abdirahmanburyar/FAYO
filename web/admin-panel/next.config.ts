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
    // Optimize CSS handling (requires critters package)
    optimizeCss: true,
    // Enable aggressive tree-shaking for package imports
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      'lucide-react',
      '@mui/x-data-grid',
      '@mui/x-date-pickers',
      'framer-motion',
    ],
  },
  // Reduce bundle size by optimizing server components (moved from experimental)
  serverExternalPackages: ['@prisma/client'],
  // Webpack optimizations for smaller bundle
  webpack: (config, { isServer, dev }) => {
    if (!dev && !isServer) {
      // Production client-side optimizations
      config.optimization = {
        ...config.optimization,
        // Aggressive code splitting
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunks
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test(module: any) {
                return module.size() > 160000 && /node_modules[/\\]/.test(module.identifier());
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
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
            shared: {
              name(module: any, chunks: any) {
                return require('crypto')
                  .createHash('sha1')
                  .update(chunks.reduce((acc: string, chunk: any) => acc + chunk.name, ''))
                  .digest('hex')
                  .substring(0, 8);
              },
              priority: 10,
              minChunks: 2,
              reuseExistingChunk: true,
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
