import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default function SentryTestRedirect() {
  redirect(`/${routing.defaultLocale}/sentry/testing`);
}

