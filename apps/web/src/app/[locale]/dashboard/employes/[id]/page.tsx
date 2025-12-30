'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loading } from '@/components/ui';

export default function EmployeeDetailRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || 'fr';
  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/${locale}/dashboard/management/employes/${id}`);
    } else {
      router.replace(`/${locale}/dashboard/management/employes`);
    }
  }, [router, locale, id]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loading />
    </div>
  );
}
