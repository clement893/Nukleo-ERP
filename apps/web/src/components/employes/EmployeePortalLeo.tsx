'use client';

import { Card } from '@/components/ui';
import { LeoContainer } from '@/components/leo';
import { Bot } from 'lucide-react';
import type { Employee } from '@/lib/api/employees';

interface EmployeePortalLeoProps {
  employee: Employee;
}

export default function EmployeePortalLeo({ employee }: EmployeePortalLeoProps) {
  // Only show Leo if employee has a linked user_id
  if (!employee.user_id) {
    return (
      <div className="space-y-4 mt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Mon Leo
          </h3>
        </div>
        <Card className="p-6">
          <p className="text-muted-foreground">
            Cet employé n'a pas de compte utilisateur lié. Le portail Leo n'est disponible que pour les employés avec un compte utilisateur.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Mon Leo
        </h3>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="h-[600px]">
          <LeoContainer userId={employee.user_id} />
        </div>
      </Card>
    </div>
  );
}
