/**
 * NextAuth API Route Handler
 * Handles all authentication requests
 * 
 * Note: This route is excluded from static generation to avoid Turbopack parsing issues
 */

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;

// Force dynamic rendering to avoid Turbopack parsing issues with vendored Next.js modules
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Exclude from static generation - prevents Turbopack from trying to parse this route
export const revalidate = 0;
export const fetchCache = 'force-no-store';

