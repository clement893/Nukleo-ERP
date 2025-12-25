/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  
  // Performance budgets
  // These limits help prevent bundle size regressions
  // Build will warn if budgets are exceeded
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  
  // Experimental features
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-query',
      '@tanstack/react-query-devtools',
      'zod',
      'clsx',
      'next-intl',
    ],
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Webpack configuration for better code splitting
  webpack: (config, { isServer, dev, webpack }) => {
    // Add plugin to create missing CSS file during build
    const CreateMissingCssPlugin = require('./webpack-plugins/create-missing-css-plugin');
    config.plugins.push(new CreateMissingCssPlugin());

    // Enhanced code splitting configuration
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000, // Minimum chunk size (20KB)
          maxSize: 244000, // Maximum chunk size (244KB)
          cacheGroups: {
            default: false,
            vendors: false,
            // Framework chunks - React, Next.js core
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // Large libraries - separate into individual chunks
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1];
                // Only create separate chunks for large libraries
                const largeLibs = ['axios', '@tanstack/react-query', 'zod', 'zustand', 'next-intl'];
                if (largeLibs.some(lib => packageName?.includes(lib))) {
                  return `lib-${packageName?.replace('@', '').replace('/', '-')}`;
                }
                return null;
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // UI component libraries
            ui: {
              test: /[\\/]node_modules[\\/](@tanstack|lucide-react|clsx|isomorphic-dompurify)[\\/]/,
              name: 'ui-libs',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Common chunks - shared code
            common: {
              name: 'common',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };

      // Tree shaking optimization
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    // Bundle analyzer (if enabled)
    if (process.env.ANALYZE === 'true' && !isServer) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: process.env.BUNDLE_ANALYZE === 'server' ? 'server' : 'static',
          openAnalyzer: true,
          reportFilename: `../.next/bundle-analyzer-${isServer ? 'server' : 'client'}.html`,
        })
      );
    }

    return config;
  },

  // Headers for security
  async headers() {
    // Use the same logic as getApiUrl() to determine API URL
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Priority order: explicit API URL > default API URL
    let apiUrl = process.env.NEXT_PUBLIC_API_URL 
      || process.env.NEXT_PUBLIC_DEFAULT_API_URL;
    
    // Default to localhost for development if nothing is set
    if (!apiUrl) {
      if (isProduction) {
        // In production, fail fast if API URL is not configured
        console.error('ERROR: NEXT_PUBLIC_API_URL is required in production but not set. Please set NEXT_PUBLIC_API_URL environment variable and rebuild.');
        apiUrl = 'http://localhost:8000'; // Fallback to prevent build failure, but will error at runtime
      } else {
        apiUrl = 'http://localhost:8000';
      }
    }
    
    apiUrl = apiUrl.trim();
    
    // If URL doesn't start with http:// or https://, add https://
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      apiUrl = `https://${apiUrl}`;
    }
    
    // Remove trailing slash
    apiUrl = apiUrl.replace(/\/$/, '');
    
    // Content Security Policy
    // ⚠️ SECURITY NOTE: CSP is relaxed in development (unsafe-inline/unsafe-eval)
    // This is acceptable for dev but should be tightened in production using nonces
    // See: https://nextjs.org/docs/advanced-features/security-headers
    // Include both localhost (for dev) and the configured API URL in connect-src
    const connectSrcUrls = isProduction 
      ? [`'self'`, apiUrl, 'https://*.sentry.io', 'wss://*.sentry.io']
      : [`'self'`, apiUrl, 'http://localhost:8000', 'https://*.sentry.io', 'wss://*.sentry.io'];
    
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Required for Next.js dev mode
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Required for Tailwind CSS
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src " + connectSrcUrls.join(' '),
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      ...(isProduction ? ["upgrade-insecure-requests"] : []),
    ].filter(Boolean).join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: isProduction ? 'max-age=31536000; includeSubDomains; preload' : '',
          },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
