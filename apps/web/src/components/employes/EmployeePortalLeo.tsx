'use client';

import { Card } from '@/components/ui';
import { LeoContainer } from '@/components/leo';
import { Bot } from 'lucide-react';

interface EmployeePortalLeoProps {
  employeeId: number;
}

export default function EmployeePortalLeo({ employeeId }: EmployeePortalLeoProps) {
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
          <LeoContainer />
        </div>
      </Card>
    </div>
  );
}
