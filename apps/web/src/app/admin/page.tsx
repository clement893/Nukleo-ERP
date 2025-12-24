import AdminContent from './AdminContent';
import ProtectedSuperAdminRoute from '@/components/auth/ProtectedSuperAdminRoute';

// Force dynamic rendering to avoid CSS file issues during build
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function AdminPage() {
  return (
    <ProtectedSuperAdminRoute>
      <AdminContent />
    </ProtectedSuperAdminRoute>
  );
}
