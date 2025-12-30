'use client';

import { Employee } from '@/lib/api/employees';
import EmployeeDetail from './EmployeeDetail';

interface EmployeePortalProfileProps {
  employee: Employee;
}

export default function EmployeePortalProfile({ employee }: EmployeePortalProfileProps) {
  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Mon profil
        </h3>
      </div>

      <EmployeeDetail employee={employee} />
    </div>
  );
}
