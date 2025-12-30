'use client';

import { Card } from '@/components/ui';
import { Clock } from 'lucide-react';

interface EmployeePortalTimeSheetsProps {
  employeeId: number;
}

export default function EmployeePortalTimeSheets({ employeeId }: EmployeePortalTimeSheetsProps) {
  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Mes feuilles de temps
        </h3>
      </div>

      <Card>
        <div className="py-8 text-center text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Fonctionnalité à venir</p>
          <p className="text-sm mt-2">Les feuilles de temps seront disponibles prochainement</p>
        </div>
      </Card>
    </div>
  );
}
