import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default function AITestRedirect() {
  redirect(`/${routing.defaultLocale}/ai/test`);
}
