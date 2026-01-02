import AdminDemosContent from './AdminDemosContent';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function AdminDemosPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminDemosContent />
    </ProtectedRoute>
  );
}
