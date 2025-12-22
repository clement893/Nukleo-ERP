/** @type {import('next').NextConfig} */
// Sentry is optional - only use if package is installed
let withSentryConfig = null;
try {
  withSentryConfig = require('@sentry/nextjs').withSentryConfig;
} catch (e) {
  // Sentry not installed, continue without it
  console.log('Sentry not installed, skipping Sentry configuration');
}

const nextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  
  // Images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['@modele/types', 'clsx', 'zod', '@brandbook/ui'],
    optimizeCss: true,
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Turbopack configuration (Next.js 16 default)
  turbopack: {},
  
  // Webpack optimizations (fallback for --webpack flag)
  webpack: (config, { isServer, dev }) => {
    // Optimisations pour le bundle
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false, // Enable tree shaking if package.json allows
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Common chunk
            common: {
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
            // React chunk
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: 'react',
              priority: 30,
              reuseExistingChunk: true,
            },
            // Next.js chunk
            nextjs: {
              test: /[\\/]node_modules[\\/](next)[\\/]/,
              name: 'nextjs',
              priority: 30,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Security headers - Enhanced
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // CSP Policy - Enhanced security
    const cspPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.sentry-cdn.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://api.sentry.io https://*.sentry.io",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "media-src 'self'",
      "worker-src 'self' blob:",
      ...(isProduction ? ["upgrade-insecure-requests"] : []),
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
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
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          {
            key: 'Content-Security-Policy',
            value: cspPolicy
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin'
          },
          ...(isProduction ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }] : []),
        ],
      },
    ];
  },
  
  // Redirects si nÃ©cessaire
  async redirects() {
    return [];
  },
  
  // Rewrites si nÃ©cessaire
  async rewrites() {
    return [];
  },
};

// Bundle Analyzer (optional)
let config = nextConfig;
if (process.env.ANALYZE === 'true') {
  try {
    const withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
    });
    config = withBundleAnalyzer(config);
  } catch (e) {
    console.log('Bundle Analyzer not installed, skipping');
  }
}

// Sentry Configuration (optional)
if (withSentryConfig) {
  const sentryWebpackPluginOptions = {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableClientWebpackPlugin: !process.env.SENTRY_DSN,
    disableServerWebpackPlugin: !process.env.SENTRY_DSN,
  };
  config = withSentryConfig(config, sentryWebpackPluginOptions);
}

module.exports = config;