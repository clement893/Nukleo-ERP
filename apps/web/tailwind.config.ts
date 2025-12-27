import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary color palette - Uses CSS variables with fallbacks for theme support
        primary: {
          50: 'var(--color-primary-50, #eff6ff)',
          100: 'var(--color-primary-100, #dbeafe)',
          200: 'var(--color-primary-200, #bfdbfe)',
          300: 'var(--color-primary-300, #93c5fd)',
          400: 'var(--color-primary-400, #60a5fa)',
          500: 'var(--color-primary-500, #3b82f6)',
          600: 'var(--color-primary-600, #2563eb)',
          700: 'var(--color-primary-700, #1d4ed8)',
          800: 'var(--color-primary-800, #1e40af)',
          900: 'var(--color-primary-900, #1e3a8a)',
          950: 'var(--color-primary-950, #172554)',
        },
        // Custom blue light color (#B4D6FF) - darker in dark mode
        blue: {
          light: '#B4D6FF',
          lightDark: '#1e3a8a', // Dark mode version
        },
        // Secondary color palette - Uses CSS variables with fallbacks for theme support
        secondary: {
          50: 'var(--color-secondary-50, #f0fdf4)',
          100: 'var(--color-secondary-100, #dcfce7)',
          200: 'var(--color-secondary-200, #bbf7d0)',
          300: 'var(--color-secondary-300, #86efac)',
          400: 'var(--color-secondary-400, #4ade80)',
          500: 'var(--color-secondary-500, #22c55e)',
          600: 'var(--color-secondary-600, #16a34a)',
          700: 'var(--color-secondary-700, #15803d)',
          800: 'var(--color-secondary-800, #166534)',
          900: 'var(--color-secondary-900, #14532d)',
          950: 'var(--color-secondary-950, #052e16)',
        },
        // Danger color palette - Uses CSS variables with fallbacks for theme support
        danger: {
          50: 'var(--color-danger-50, #fef2f2)',
          100: 'var(--color-danger-100, #fee2e2)',
          200: 'var(--color-danger-200, #fecaca)',
          300: 'var(--color-danger-300, #fca5a5)',
          400: 'var(--color-danger-400, #f87171)',
          500: 'var(--color-danger-500, #ef4444)',
          600: 'var(--color-danger-600, #dc2626)',
          700: 'var(--color-danger-700, #b91c1c)',
          800: 'var(--color-danger-800, #991b1b)',
          900: 'var(--color-danger-900, #7f1d1d)',
          950: 'var(--color-danger-950, #450a0a)',
        },
        // Warning color palette - Uses CSS variables with fallbacks for theme support
        warning: {
          50: 'var(--color-warning-50, #fffbeb)',
          100: 'var(--color-warning-100, #fef3c7)',
          200: 'var(--color-warning-200, #fde68a)',
          300: 'var(--color-warning-300, #fcd34d)',
          400: 'var(--color-warning-400, #fbbf24)',
          500: 'var(--color-warning-500, #f59e0b)',
          600: 'var(--color-warning-600, #d97706)',
          700: 'var(--color-warning-700, #b45309)',
          800: 'var(--color-warning-800, #92400e)',
          900: 'var(--color-warning-900, #78350f)',
          950: 'var(--color-warning-950, #451a03)',
        },
        // Info color palette - Uses CSS variables with fallbacks for theme support
        info: {
          50: 'var(--color-info-50, #ecfeff)',
          100: 'var(--color-info-100, #cffafe)',
          200: 'var(--color-info-200, #a5f3fc)',
          300: 'var(--color-info-300, #67e8f9)',
          400: 'var(--color-info-400, #22d3ee)',
          500: 'var(--color-info-500, #06b6d4)',
          600: 'var(--color-info-600, #0891b2)',
          700: 'var(--color-info-700, #0e7490)',
          800: 'var(--color-info-800, #155e75)',
          900: 'var(--color-info-900, #164e63)',
          950: 'var(--color-info-950, #083344)',
        },
        // Success colors - Uses CSS variables with fallbacks for theme support
        success: {
          50: 'var(--color-success-50, #f0fdf4)',
          100: 'var(--color-success-100, #dcfce7)',
          200: 'var(--color-success-200, #bbf7d0)',
          300: 'var(--color-success-300, #86efac)',
          400: 'var(--color-success-400, #4ade80)',
          500: 'var(--color-success-500, #22c55e)',
          600: 'var(--color-success-600, #16a34a)',
          700: 'var(--color-success-700, #15803d)',
          800: 'var(--color-success-800, #166534)',
          900: 'var(--color-success-900, #14532d)',
          950: 'var(--color-success-950, #052e16)',
        },
        // Error colors - Uses CSS variables with fallbacks for theme support
        error: {
          50: 'var(--color-error-50, #fef2f2)',
          100: 'var(--color-error-100, #fee2e2)',
          200: 'var(--color-error-200, #fecaca)',
          300: 'var(--color-error-300, #fca5a5)',
          400: 'var(--color-error-400, #f87171)',
          500: 'var(--color-error-500, #ef4444)',
          600: 'var(--color-error-600, #dc2626)',
          700: 'var(--color-error-700, #b91c1c)',
          800: 'var(--color-error-800, #991b1b)',
          900: 'var(--color-error-900, #7f1d1d)',
          950: 'var(--color-error-950, #450a0a)',
        },
        // Neutral grays (for text, borders, backgrounds) - Keep hardcoded as they're neutral
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        // Theme-aware base colors - These use CSS variables that change with theme
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
      },
      spacing: {
        // Extended spacing scale for consistent layouts
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },
      borderRadius: {
        // Use theme border radius if available, otherwise use default
        DEFAULT: 'var(--border-radius, 0.5rem)',
        // Consistent border radius scale
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      fontFamily: {
        // Use theme font family if available, otherwise fallback to system fonts
        sans: [
          'var(--font-family)',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
        heading: [
          'var(--font-family-heading)',
          'var(--font-family)',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        subheading: [
          'var(--font-family-subheading)',
          'var(--font-family)',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        // Custom shadows for depth
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        // Custom animations
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
