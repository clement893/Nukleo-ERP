/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Webpack configuration
  webpack: (config, { isServer, webpack }) => {
    // Handle missing CSS files during build
    if (!isServer) {
      // Add alias for default-stylesheet.css
      config.resolve.alias = {
        ...config.resolve.alias,
        'default-stylesheet.css': require.resolve('./src/lib/empty-css.js'),
      };
      
      // Ignore missing CSS files during build - multiple patterns
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /default-stylesheet\.css$/,
        })
      );
      
      // Also add a fallback for the CSS file
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'default-stylesheet.css': require.resolve('./src/lib/empty-css.js'),
      };
    }

    // Bundle analyzer configuration
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

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Headers for security
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';
    // Use production backend URL as fallback if NEXT_PUBLIC_API_URL is not set
    const defaultUrl = isProduction 
      ? 'https://modelebackend-production-0590.up.railway.app'
      : 'http://localhost:8000';
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || defaultUrl).trim();
    
    // Content Security Policy
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // 'unsafe-eval' needed for Next.js in dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' " + apiUrl + " https://*.sentry.io wss://*.sentry.io",
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

module.exports = nextConfig;
