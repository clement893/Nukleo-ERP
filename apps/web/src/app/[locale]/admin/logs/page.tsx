import AdminLogsContent from './AdminLogsContent';
import ProtectedSuperAdminRoute from '@/components/auth/ProtectedSuperAdminRoute';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function AdminLogsPage() {
  return (
    <ProtectedSuperAdminRoute>
      <AdminLogsContent />
    </ProtectedSuperAdminRoute>
  );
}

