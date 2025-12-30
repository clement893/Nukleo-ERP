'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loading } from '@/components/ui';

export default function ProjetsRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || 'fr';

  useEffect(() => {
    router.replace(`/${locale}/dashboard/projets/projets`);
  }, [router, locale]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loading />
    </div>
  );
}
