'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import Button from './Button';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  endDate?: Date;
  time?: string;
  color?: string;
  description?: string;
}

export interface CalendarProps {
  events?: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  className?: string;
}

export default function Calendar({
  events = [],
  onDateClick,
  onEventClick,
  className,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      if (!event.endDate) {
        // Événement d'un seul jour
        return (
          eventDate.getDate() === checkDate.getDate() &&
          eventDate.getMonth() === checkDate.getMonth() &&
          eventDate.getFullYear() === checkDate.getFullYear()
        );
      }
      
      // Événement multi-jours
      const eventEndDate = new Date(event.endDate);
      eventEndDate.setHours(23, 59, 59, 999);
      
      return checkDate >= eventDate && checkDate <= eventEndDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square" />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = getEventsForDate(date);
      const isCurrentDay = isToday(date);

      days.push(
        <div
          key={day}
          className={clsx(
            'aspect-square border border-gray-200 dark:border-gray-700 p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
            isCurrentDay && 'bg-primary-50 dark:bg-primary-900/40 border-primary-500 dark:border-primary-400'
          )}
          onClick={() => onDateClick?.(date)}
        >
          <div className={clsx(
            'text-sm font-medium mb-1',
            isCurrentDay ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-gray-100'
          )}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className={clsx(
                  'text-xs px-1 py-0.5 rounded truncate cursor-pointer',
                  event.color || 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300'
                )}
                style={event.color ? { backgroundColor: event.color } : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick?.(event);
                }}
                title={event.title}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                +{dayEvents.length - 3} autres
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className={clsx('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {monthNames[month]} {year}
        </h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
            ‹
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday}>
            Aujourd'hui
          </Button>
          <Button variant="ghost" size="sm" onClick={goToNextMonth}>
            ›
          </Button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>
    </div>
  );
}

