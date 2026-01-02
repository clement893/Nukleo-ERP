/**
 * Hook to listen for automation triggers and display toast notifications
 */

import { useEffect } from 'react';
import { connectNotificationSocket, disconnectNotificationSocket } from '@/lib/websocket/notificationSocket';
import { useToast } from '@/lib/toast';
import { Zap } from 'lucide-react';
import { logger } from '@/lib/logger';

export function useAutomationNotifications(enabled = true) {
  const toast = useToast();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const handleAutomationTriggered = (data: {
      rule_id: number;
      rule_name: string;
      trigger_event: string;
      success: boolean;
      opportunity_name?: string | null;
      pipeline_name?: string;
      stage_name?: string;
      timestamp: string;
    }) => {
      logger.info('Automation triggered', data);

      // Build message based on context
      let message = `Automatisation "${data.rule_name}" déclenchée`;
      
      if (data.opportunity_name) {
        message += ` pour l'opportunité "${data.opportunity_name}"`;
      }
      
      if (data.pipeline_name && data.stage_name) {
        message += ` (${data.pipeline_name} → ${data.stage_name})`;
      }

      // Show toast notification
      const toastMethod = data.success ? toast.success : toast.warning;
      toastMethod(message, {
        title: 'Automatisation déclenchée',
        icon: <Zap className="w-5 h-5" />,
        duration: 6000, // 6 seconds for automation notifications
      });
    };

    // Connect to WebSocket and listen for automation events
    connectNotificationSocket({
      onAutomationTriggered: handleAutomationTriggered,
    });

    // Cleanup on unmount
    return () => {
      disconnectNotificationSocket();
    };
  }, [enabled, toast]);
}
