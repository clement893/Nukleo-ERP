'use client';

import { useState } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { Calendar, ArrowUpRight, ArrowDownRight, Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface TimelineTransaction {
  id: number;
  date: string;
  type: 'entry' | 'exit';
  amount: number;
  description: string;
  category?: string;
  status: 'confirmed' | 'pending' | 'projected';
  probability?: number;
}

interface TransactionTimelineProps {
  transactions: TimelineTransaction[];
  title: string;
  type: 'entry' | 'exit';
  className?: string;
}

export default function TransactionTimeline({ 
  transactions, 
  title, 
  type,
  className 
}: TransactionTimelineProps) {
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'projected'>('all');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('week');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-CA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const formatGroupDate = (dateString: string) => {
    const date = new Date(dateString);
    if (groupBy === 'day') {
      return formatDate(dateString);
    } else if (groupBy === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `Semaine du ${formatDate(weekStart.toISOString())} au ${formatDate(weekEnd.toISOString())}`;
    } else {
      return new Intl.DateTimeFormat('fr-CA', {
        month: 'long',
        year: 'numeric'
      }).format(date);
    }
  };

  // Filtrer les transactions
  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  // Grouper les transactions
  const groupedTransactions = filteredTransactions.reduce((acc, t) => {
    const date = new Date(t.date);
    let groupKey: string;

    if (groupBy === 'day') {
      groupKey = t.date.split('T')[0] || '';
    } else if (groupBy === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      groupKey = weekStart.toISOString().split('T')[0] || '';
    } else {
      groupKey = `${date.getFullYear()}-${date.getMonth()}`;
    }

    if (!groupKey) return acc;
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey]!.push(t);
    return acc;
  }, {} as Record<string, TimelineTransaction[]>);

  // Trier les groupes par date
  const sortedGroups = Object.entries(groupedTransactions).sort((a, b) => 
    new Date(a[0]).getTime() - new Date(b[0]).getTime()
  );

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <Card className={`glass-card p-6 rounded-xl border border-nukleo-lavender/20 ${className || ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2 font-nukleo">
          {type === 'entry' ? (
            <ArrowUpRight className="w-5 h-5 text-green-600" />
          ) : (
            <ArrowDownRight className="w-5 h-5 text-red-600" />
          )}
          {title}
        </h3>
        <div className={`text-lg font-bold ${type === 'entry' ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(totalAmount)}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium">Statut:</span>
          <div className="flex gap-1">
            {(['all', 'confirmed', 'pending', 'projected'] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'primary' : 'outline'}
                onClick={() => setFilter(f)}
                className="text-xs"
              >
                {f === 'all' ? 'Tous' : 
                 f === 'confirmed' ? 'Confirmés' :
                 f === 'pending' ? 'En attente' : 'Projetés'}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Grouper par:</span>
          <div className="flex gap-1">
            {(['day', 'week', 'month'] as const).map((g) => (
              <Button
                key={g}
                size="sm"
                variant={groupBy === g ? 'primary' : 'outline'}
                onClick={() => setGroupBy(g)}
                className="text-xs"
              >
                {g === 'day' ? 'Jour' : g === 'week' ? 'Semaine' : 'Mois'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste groupée */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {sortedGroups.length > 0 ? (
          sortedGroups.map(([groupKey, groupTransactions]) => {
            const groupTotal = groupTransactions.reduce((sum, t) => sum + t.amount, 0);
            const isExpanded = expandedGroups.has(groupKey);

            return (
              <div
                key={groupKey}
                className={`border rounded-lg overflow-hidden ${
                  type === 'entry'
                    ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                    : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                }`}
              >
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className="w-full p-3 flex items-center justify-between hover:bg-opacity-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className={`w-4 h-4 ${type === 'entry' ? 'text-green-600' : 'text-red-600'}`} />
                    <div className="text-left">
                      <div className="font-medium text-sm">{formatGroupDate(groupKey)}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {groupTransactions.length} transaction{groupTransactions.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`font-bold ${type === 'entry' ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(groupTotal)}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-2 bg-white dark:bg-gray-800">
                    {groupTransactions
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm">{t.description}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {formatDate(t.date)}
                              </span>
                              {t.category && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-gray-500/10 text-gray-600 border-gray-500/30">
                                  {t.category}
                                </Badge>
                              )}
                              <Badge className={`text-[10px] px-1.5 py-0 ${
                                t.status === 'confirmed' ? 'bg-green-500/10 text-green-600 border-green-500/30' :
                                t.status === 'pending' ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' :
                                'bg-gray-500/10 text-gray-600 border-gray-500/30'
                              }`}>
                                {t.status === 'confirmed' ? 'Confirmé' : 
                                 t.status === 'pending' ? 'En attente' : 'Projeté'}
                              </Badge>
                              {t.probability !== undefined && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-purple-500/10 text-purple-600 border-purple-500/30">
                                  {t.probability}% probabilité
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className={`font-bold ${type === 'entry' ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(t.amount)}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
            Aucune transaction {filter !== 'all' ? filter : ''} prévue
          </div>
        )}
      </div>
    </Card>
  );
}
