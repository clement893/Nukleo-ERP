'use client';

/**
 * Widget : Suivi Présence
 * Suivi de la présence basé sur les time entries
 */

import { Calendar, AlertCircle } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { employeesAPI } from '@/lib/api/employees';
import { timeEntriesAPI } from '@/lib/api/time-entries';
import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface AttendanceData {
  name: string;
  daysPresent: number;
  daysTotal: number;
  attendanceRate: number;
  hoursTotal: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data || !data.payload) return null;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.payload.name}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {data.payload.attendanceRate?.toFixed(0) || 0}%
        </p>
        <div className="mt-2 space-y-1 text-sm">
          <p>
            <span className="text-gray-600 dark:text-gray-400">Jours présents: </span>
            <span className="font-bold text-gray-900 dark:text-white">{data.payload.daysPresent}/{data.payload.daysTotal}</span>
          </p>
          <p>
            <span className="text-gray-600 dark:text-gray-400">Heures totales: </span>
            <span className="font-bold text-gray-900 dark:text-white">{data.payload.hoursTotal.toFixed(1)}h</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function AttendanceTrackingWidget({ }: WidgetProps) {
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageAttendance, setAverageAttendance] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const employees = await employeesAPI.list();
        const timeEntries = await timeEntriesAPI.list({});
        
        // Filter active employees
        const activeEmployees = employees.filter((emp: any) => 
          emp.status === 'active' || !emp.status || emp.status === null
        );
        
        // Calculate attendance for last 30 days
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const daysTotal = 30;
        
        // Get unique dates with time entries
        const datesWithEntries = new Set<string>();
        timeEntries.forEach((entry: any) => {
          const entryDate = new Date(entry.date);
          if (entryDate >= thirtyDaysAgo) {
            datesWithEntries.add(entry.date.split('T')[0]);
          }
        });
        
        // Calculate attendance for each employee
        const attendance: AttendanceData[] = activeEmployees
          .filter((emp: any) => emp.user_id)
          .map((emp: any) => {
            // Get time entries for this employee
            const employeeEntries = timeEntries.filter((entry: any) => {
              if (entry.user_id !== emp.user_id) return false;
              const entryDate = new Date(entry.date);
              return entryDate >= thirtyDaysAgo;
            });
            
            // Count unique days with entries
            const daysWithEntries = new Set<string>();
            employeeEntries.forEach((entry: any) => {
              daysWithEntries.add(entry.date.split('T')[0]);
            });
            const daysPresent = daysWithEntries.size;
            
            // Calculate total hours
            const hoursTotal = employeeEntries.reduce((sum: number, entry: any) => 
              sum + (entry.duration / 3600), 0
            );
            
            // Calculate attendance rate
            const attendanceRate = daysTotal > 0 ? (daysPresent / daysTotal) * 100 : 0;
            
            return {
              name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Employé',
              daysPresent,
              daysTotal,
              attendanceRate,
              hoursTotal,
            };
          })
          .filter(emp => emp.daysPresent > 0) // Only employees with some attendance
          .sort((a, b) => b.attendanceRate - a.attendanceRate)
          .slice(0, 10); // Top 10 employees

        setAttendanceData(attendance);
        
        // Calculate average attendance
        if (attendance.length > 0) {
          const avg = attendance.reduce((sum, a) => sum + a.attendanceRate, 0) / attendance.length;
          setAverageAttendance(avg);
        }
      } catch (error) {
        console.error('Error loading attendance tracking:', error);
        setAttendanceData([]);
        setAverageAttendance(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (attendanceData.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Aucune donnée"
        description="Les données de présence apparaîtront ici."
        variant="compact"
      />
    );
  }

  const getBarColor = (rate: number) => {
    if (rate >= 80) return '#10b981'; // green
    if (rate >= 60) return '#3b82f6'; // blue
    if (rate >= 40) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const lowAttendanceCount = attendanceData.filter(a => a.attendanceRate < 60).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Taux moyen (30j)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{averageAttendance.toFixed(0)}%</p>
          </div>
          {lowAttendanceCount > 0 && (
            <div className="text-right">
              <p className="text-xs text-amber-600 dark:text-amber-400">Faible présence</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {lowAttendanceCount}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={attendanceData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'currentColor', fontSize: 11, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              width={120}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="attendanceRate" radius={[0, 4, 4, 0]}>
              {attendanceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.attendanceRate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
