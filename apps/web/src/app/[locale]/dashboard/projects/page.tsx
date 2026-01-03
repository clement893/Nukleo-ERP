'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ProjectsRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || 'fr';

  useEffect(() => {
    // Redirect to the new route
    router.replace(`/${locale}/dashboard/projets/projets`);
  }, [router, locale]);

  // Return null while redirecting
  return null;
}
