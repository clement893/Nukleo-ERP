'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loading } from '@/components/ui';

export default function EmployeePortalPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params?.id;

  useEffect(() => {
    if (employeeId) {
      const locale = params?.locale as string || 'fr';
      router.replace(`/${locale}/portail-employe/${employeeId}/dashboard`);
    }
  }, [employeeId, router, params?.locale]);

  return (
    <div className="w-full py-12 text-center">
      <Loading />
    </div>
  );
}
