'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui';

interface CalendarTransaction {
  date: string;
  type: 'entry' | 'exit';
  amount: number;
  description: string;
  id: number;
}

interface CalendarViewProps {
  transactions: CalendarTransaction[];
  className?: string;
}

export default function CalendarView({ transactions, className }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatMonthYear = (date: Date) => {
    return new Intl.DateTimeFormat('fr-CA', {
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, firstDay, lastDay };
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const { daysInMonth, startingDayOfWeek, firstDay, lastDay } = getDaysInMonth(currentDate);
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                         currentDate.getFullYear() === today.getFullYear();

  // Grouper les transactions par date
  const transactionsByDate = transactions.reduce((acc, t) => {
    const dateKey = t.date.split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = { entries: [], exits: [] };
    }
    if (t.type === 'entry') {
      acc[dateKey].entries.push(t);
    } else {
      acc[dateKey].exits.push(t);
    }
    return acc;
  }, {} as Record<string, { entries: CalendarTransaction[]; exits: CalendarTransaction[] }>);

  // Créer les jours du calendrier
  const days = [];
  
  // Jours vides au début
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  // Jours du mois
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = date.toISOString().split('T')[0];
    const dayTransactions = transactionsByDate[dateKey] || { entries: [], exits: [] };
    const totalEntries = dayTransactions.entries.reduce((sum, t) => sum + t.amount, 0);
    const totalExits = dayTransactions.exits.reduce((sum, t) => sum + t.amount, 0);
    const isToday = isCurrentMonth && day === today.getDate();

    days.push({
      day,
      date: dateKey,
      entries: dayTransactions.entries,
      exits: dayTransactions.exits,
      totalEntries,
      totalExits,
      isToday
    });
  }

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <Card className={`glass-card p-6 rounded-xl border border-[#A7A2CF]/20 ${className || ''}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          <CalendarIcon className="w-5 h-5" />
          Calendrier des Flux
        </h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={goToToday}>
            Aujourd'hui
          </Button>
          <Button size="sm" variant="outline" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-xl font-semibold text-center" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {formatMonthYear(currentDate)}
        </h4>
      </div>

      {/* En-têtes des jours */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((dayName) => (
          <div key={dayName} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2">
            {dayName}
          </div>
        ))}
      </div>

      {/* Grille du calendrier */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          return (
            <div
              key={day.date}
              className={`aspect-square p-1 rounded-lg border-2 transition-all ${
                day.isToday
                  ? 'border-[#523DC9] bg-[#523DC9]/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-xs font-medium mb-1">{day.day}</div>
              <div className="space-y-0.5">
                {day.totalEntries > 0 && (
                  <div className="text-[10px] text-green-600 font-medium truncate" title={`Entrées: ${formatCurrency(day.totalEntries)}`}>
                    +{formatCurrency(day.totalEntries)}
                  </div>
                )}
                {day.totalExits > 0 && (
                  <div className="text-[10px] text-red-600 font-medium truncate" title={`Sorties: ${formatCurrency(day.totalExits)}`}>
                    -{formatCurrency(day.totalExits)}
                  </div>
                )}
                {day.entries.length + day.exits.length > 0 && (
                  <div className="text-[9px] text-gray-500 dark:text-gray-400">
                    {day.entries.length + day.exits.length} transaction{day.entries.length + day.exits.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-2 border-[#523DC9] bg-[#523DC9]/10" />
          <span>Aujourd'hui</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500" />
          <span>Entrées</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500" />
          <span>Sorties</span>
        </div>
      </div>
    </Card>
  );
}
