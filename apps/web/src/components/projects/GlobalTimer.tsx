'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { timeEntriesAPI, type TimerStatus } from '@/lib/api/time-entries';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { Play, Square, Clock, AlertCircle } from 'lucide-react';
import { projectTasksAPI, type ProjectTask } from '@/lib/api/project-tasks';

export default function GlobalTimer() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [timerStatus, setTimerStatus] = useState<TimerStatus | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentTask, setCurrentTask] = useState<ProjectTask | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadTimerStatus();
      const interval = setInterval(loadTimerStatus, 1000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  useEffect(() => {
    if (timerStatus?.active && timerStatus.task_id) {
      loadTaskDetails(timerStatus.task_id);
    } else {
      setCurrentTask(null);
    }
  }, [timerStatus]);

  useEffect(() => {
    if (timerStatus?.active && timerStatus.start_time) {
      const startTime = new Date(timerStatus.start_time).getTime();
      const updateElapsed = () => {
        const now = Date.now();
        setElapsedSeconds(Math.floor((now - startTime) / 1000));
      };
      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedSeconds(0);
    }
  }, [timerStatus]);

  const loadTimerStatus = async () => {
    try {
      const status = await timeEntriesAPI.getTimerStatus();
      setTimerStatus(status);
    } catch (err) {
      console.error('Error loading timer status:', err);
    }
  };

  const loadTaskDetails = async (taskId: number) => {
    try {
      const task = await projectTasksAPI.get(taskId);
      setCurrentTask(task);
    } catch (err) {
      console.error('Error loading task details:', err);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = async () => {
    try {
      setLoading(true);
      await timeEntriesAPI.stopTimer();
      setElapsedSeconds(0);
      await loadTimerStatus();
      showToast({
        message: 'Timer arrêté et temps enregistré',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de l\'arrêt du timer',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!timerStatus?.active) {
    return null;
  }

  return (
    <Card className="glass-card p-4 mb-6 border-2 border-primary">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Timer actif</p>
            <p className="text-2xl font-bold text-foreground">{formatTime(elapsedSeconds)}</p>
            {currentTask && (
              <p className="text-sm text-foreground mt-1">{currentTask.title}</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleStop}
          loading={loading}
          className="text-red-600 hover:text-red-700"
        >
          <Square className="w-4 h-4 mr-2" />
          Arrêter
        </Button>
      </div>
    </Card>
  );
}
