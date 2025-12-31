'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { timeEntriesAPI, type TimerStatus } from '@/lib/api/time-entries';
import { handleApiError } from '@/lib/errors/api';
import { Play, Square, Clock } from 'lucide-react';
import { useToast } from '@/components/ui';

interface TaskTimerProps {
  taskId: number;
  onTimeTracked?: () => void;
}

export default function TaskTimer({ taskId, onTimeTracked }: TaskTimerProps) {
  const { showToast } = useToast();
  const [timerStatus, setTimerStatus] = useState<TimerStatus | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadTimerStatus = useCallback(async () => {
    try {
      const status = await timeEntriesAPI.getTimerStatus();
      setTimerStatus(status);
      if (status.active && status.task_id === taskId && status.start_time) {
        // Calculate elapsed time from start_time
        const startTime = new Date(status.start_time).getTime();
        const now = Date.now();
        setElapsedSeconds(Math.floor((now - startTime) / 1000));
      } else {
        setElapsedSeconds(0);
      }
    } catch (err) {
      console.error('Error loading timer status:', err);
    }
  }, [taskId]);

  useEffect(() => {
    loadTimerStatus();
    const interval = setInterval(loadTimerStatus, 1000);
    return () => clearInterval(interval);
  }, [loadTimerStatus]);

  // Update elapsed time every second if timer is active
  useEffect(() => {
    if (timerStatus?.active && timerStatus.task_id === taskId) {
      const interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [timerStatus, taskId]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    try {
      setLoading(true);
      await timeEntriesAPI.startTimer(taskId);
      await loadTimerStatus();
      showToast({
        message: 'Timer démarré',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors du démarrage du timer',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
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
      onTimeTracked?.();
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

  const isActive = timerStatus?.active && timerStatus.task_id === taskId;

  return (
    <div className="flex items-center gap-2">
      {isActive && (
        <Badge variant="default" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTime(elapsedSeconds)}
        </Badge>
      )}
      {isActive ? (
        <Button
          size="sm"
          variant="outline"
          onClick={handleStop}
          loading={loading}
          className="text-red-600 hover:text-red-700"
        >
          <Square className="w-4 h-4 mr-1" />
          Arrêter
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={handleStart}
          loading={loading}
          disabled={timerStatus?.active && timerStatus.task_id !== taskId}
        >
          <Play className="w-4 h-4 mr-1" />
          Démarrer
        </Button>
      )}
    </div>
  );
}
