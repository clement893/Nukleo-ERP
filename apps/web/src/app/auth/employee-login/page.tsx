/**
 * Redirect /auth/employee-login to locale-specific route
 */
import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default function EmployeeLoginRedirect() {
  redirect(`/${routing.defaultLocale}/auth/employee-login`);
}
