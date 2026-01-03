'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new route with default locale
    router.replace('/fr/dashboard/projets/projets');
  }, [router]);

  // Return null while redirecting
  return null;
}
