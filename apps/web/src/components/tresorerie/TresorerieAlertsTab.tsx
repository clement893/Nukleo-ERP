'use client';

import { Card } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';
import { Bell } from 'lucide-react';

export default function TresorerieAlertsTab() {
  return (
    <MotionDiv variant="slideUp" duration="normal">
      <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
        <div className="text-center py-12">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Alertes
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Module de gestion des alertes en cours de développement
          </p>
        </div>
      </Card>
    </MotionDiv>
  );
}
