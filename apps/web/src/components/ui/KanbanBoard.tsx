'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import Button from './Button';

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: Date;
  tags?: string[];
  // Additional data for custom use cases (e.g., amount for totals)
  data?: Record<string, unknown>;
}

export interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  color?: string;
}

export interface KanbanBoardProps {
  columns: KanbanColumn[];
  cards: KanbanCard[];
  onCardMove?: (cardId: string, newStatus: string) => void;
  onCardClick?: (card: KanbanCard) => void;
  onCardAdd?: (status: string) => void;
  className?: string;
  showColumnTotals?: boolean;
  getCardValue?: (card: KanbanCard) => number;
  formatValue?: (value: number) => string;
}

export default function KanbanBoard({
  columns,
  cards,
  onCardMove,
  onCardClick,
  onCardAdd,
  className,
  showColumnTotals = false,
  getCardValue,
  formatValue = (value) => value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
}: KanbanBoardProps) {
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (cardId: string) => {
    setDraggedCard(cardId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    if (draggedCard) {
      onCardMove?.(draggedCard, columnStatus);
    }
    setDraggedCard(null);
    setDragOverColumn(null);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-danger-50 dark:bg-danger-900/30 text-danger-900 dark:text-danger-300';
      case 'medium':
        return 'bg-warning-50 dark:bg-warning-900/30 text-warning-900 dark:text-warning-300';
      case 'low':
        return 'bg-secondary-50 dark:bg-secondary-900/30 text-secondary-900 dark:text-secondary-300';
      default:
        return 'bg-muted dark:bg-gray-700 text-foreground dark:text-gray-200';
    }
  };

  return (
    <div className={clsx('flex gap-4 overflow-x-auto h-full', className)}>
      {columns.map((column) => {
        const columnCards = cards.filter((card) => card.status === column.status);
        
        // Calculate total for this column
        const columnTotal = showColumnTotals && getCardValue
          ? columnCards.reduce((sum, card) => sum + (getCardValue(card) || 0), 0)
          : 0;
        
        return (
          <div
            key={column.id}
            className={clsx(
              'flex-shrink-0 w-80 bg-muted dark:bg-gray-900 rounded-lg p-4 flex flex-col h-full',
              dragOverColumn === column.id && 'ring-2 ring-primary-500'
            )}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    'w-3 h-3 rounded-full',
                    column.color || 'bg-primary-500'
                  )}
                  style={column.color ? { backgroundColor: column.color } : undefined}
                />
                <h3 className="font-semibold text-foreground dark:text-white">
                  {column.title}
                </h3>
                <span className="text-sm text-muted-foreground bg-background dark:bg-gray-800 px-2 py-1 rounded-full">
                  {columnCards.length}
                </span>
              </div>
              {onCardAdd && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCardAdd(column.status)}
                >
                  +
                </Button>
              )}
            </div>

            {/* Cards - Scrollable area */}
            <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
              {columnCards.map((card) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={() => handleDragStart(card.id)}
                  onClick={() => onCardClick?.(card)}
                  className={clsx(
                    'bg-background dark:bg-gray-800 rounded-lg p-4 shadow-sm cursor-move hover:shadow-md transition-shadow flex-shrink-0',
                    draggedCard === card.id && 'opacity-50'
                  )}
                >
                  <h4 className="font-medium text-foreground dark:text-white mb-2">
                    {card.title}
                  </h4>
                  {card.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {card.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    {card.priority && (
                      <span className={clsx('text-xs px-2 py-1 rounded', getPriorityColor(card.priority))}>
                        {card.priority}
                      </span>
                    )}
                    {card.tags && card.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {card.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 bg-muted dark:bg-gray-700 text-muted-foreground rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {card.dueDate && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {new Date(card.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Column Footer with Total */}
            {showColumnTotals && getCardValue && (
              <div className="flex-shrink-0 mt-4 pt-4 border-t border-border dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground dark:text-white">
                    Total:
                  </span>
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                    {formatValue(columnTotal)}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

