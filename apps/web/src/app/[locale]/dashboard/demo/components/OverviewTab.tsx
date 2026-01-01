'use client';

import { Activity } from 'lucide-react';

interface OverviewTabProps {
  data: {
    tasksCompleted: number;
    tasksTotal: number;
    timeSpent: number;
    timeEstimated: number;
    budgetUsed: number;
    budgetTotal: number;
    teamSize: number;
    filesCount: number;
    milestones: Array<{
      id: string;
      name: string;
      date: string;
      completed: boolean;
    }>;
    recentActivity: Array<{
      id: string;
      user: string;
      action: string;
      time: string;
    }>;
  };
}

export default function OverviewTab({ data: _data }: OverviewTabProps) {
  return (
    <div>
      <Activity className="w-5 h-5" />
      <p>Overview Tab</p>
    </div>
  );
}
