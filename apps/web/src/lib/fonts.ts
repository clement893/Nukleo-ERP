/**
 * Aktiv Grotesk Font Configuration
 * 
 * This file configures the Aktiv Grotesk font family for use throughout the application.
 * Aktiv Grotesk is the official Nukleo brand font.
 * 
 * Available weights:
 * - 100: Hairline
 * - 200: Thin
 * - 300: Light
 * - 400: Regular
 * - 500: Medium
 * - 600: Bold
 * - 700: XBold
 * - 900: Black
 */

import localFont from 'next/font/local';

export const aktivGrotesk = localFont({
  src: [
    {
      path: '../../public/fonts/AktivGrotesk-Hairline.otf',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../../public/fonts/AktivGrotesk-HairlineItalic.otf',
      weight: '100',
      style: 'italic',
    },
    {
      path: '../../public/fonts/AktivGrotesk-Thin.otf',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../../public/fonts/AktivGrotesk-ThinItalic.otf',
      weight: '200',
      style: 'italic',
    },
    {
      path: '../../public/fonts/AktivGrotesk-Light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/AktivGrotesk-LightItalic.otf',
      weight: '300',
      style: 'italic',
    },
    {
      path: '../../public/fonts/AktivGrotesk-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/AktivGrotesk-Italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../public/fonts/AktivGrotesk-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/AktivGrotesk-MediumItalic.otf',
      weight: '500',
      style: 'italic',
    },
    {
      path: '../../public/fonts/AktivGrotesk-Bold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/AktivGrotesk-BoldItalic.otf',
      weight: '600',
      style: 'italic',
    },
    {
      path: '../../public/fonts/AktivGrotesk-XBold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/AktivGrotesk-XBoldItalic.otf',
      weight: '700',
      style: 'italic',
    },
    {
      path: '../../public/fonts/AktivGrotesk-Black.otf',
      weight: '900',
      style: 'normal',
    },
    {
      path: '../../public/fonts/AktivGrotesk-BlackItalic.otf',
      weight: '900',
      style: 'italic',
    },
  ],
  variable: '--font-aktiv-grotesk',
  display: 'swap',
});
