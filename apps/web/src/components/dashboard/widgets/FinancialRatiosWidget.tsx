'use client';

/**
 * Widget : Ratios Financiers
 * Calcul et affichage des ratios financiers clés
 */

import { Calculator, TrendingUp, AlertCircle } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { fetchDashboardRevenue } from '@/lib/api/dashboard-revenue';
import { expenseAccountsAPI } from '@/lib/api/finances/expenseAccounts';
import { facturationsAPI } from '@/lib/api/finances/facturations';
import { useEffect, useState } from 'react';

interface RatioData {
  name: string;
  value: number;
  label: string;
  status: 'good' | 'warning' | 'bad';
  format: 'percent' | 'currency' | 'number';
}

export function FinancialRatiosWidget({ }: WidgetProps) {
  const [ratios, setRatios] = useState<RatioData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Get revenue data (last 12 months)
        const revenueResponse = await fetchDashboardRevenue({ months: 12 });
        const totalRevenue = revenueResponse.total || 0;
        
        // Get expenses
        const expenses = await expenseAccountsAPI.list();
        const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
        
        // Get invoices
        const invoicesResponse = await facturationsAPI.list();
        const invoices = invoicesResponse.items || [];
        const paidInvoices = invoices.filter((inv: any) => inv.status === 'paid');
        const totalPaid = paidInvoices.reduce((sum: number, inv: any) => sum + (parseFloat(inv.total || '0') || 0), 0);
        const overdueInvoices = invoices.filter((inv: any) => {
          if (!inv.due_date || inv.status === 'paid') return false;
          const dueDate = new Date(inv.due_date);
          return dueDate < new Date() && inv.amount_due && parseFloat(inv.amount_due) > 0;
        });
        const totalOverdue = overdueInvoices.reduce((sum: number, inv: any) => 
          sum + (parseFloat(inv.amount_due || '0') || 0), 0
        );
        
        // Calculate ratios
        const calculatedRatios: RatioData[] = [];
        
        // Profit Margin
        const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
        calculatedRatios.push({
          name: 'Marge bénéficiaire',
          value: profitMargin,
          label: profitMargin >= 20 ? 'Excellente' : profitMargin >= 10 ? 'Bonne' : profitMargin >= 0 ? 'Faible' : 'Négative',
          status: profitMargin >= 20 ? 'good' : profitMargin >= 10 ? 'warning' : 'bad',
          format: 'percent',
        });
        
        // Expense Ratio
        const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
        calculatedRatios.push({
          name: 'Ratio dépenses',
          value: expenseRatio,
          label: expenseRatio <= 70 ? 'Efficace' : expenseRatio <= 85 ? 'Acceptable' : 'Élevé',
          status: expenseRatio <= 70 ? 'good' : expenseRatio <= 85 ? 'warning' : 'bad',
          format: 'percent',
        });
        
        // Collection Efficiency (paid / total)
        const totalInvoiced = invoices.reduce((sum: number, inv: any) => 
          sum + (parseFloat(inv.total || '0') || 0), 0
        );
        const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 100;
        calculatedRatios.push({
          name: 'Taux de recouvrement',
          value: collectionRate,
          label: collectionRate >= 90 ? 'Excellent' : collectionRate >= 75 ? 'Bon' : 'À améliorer',
          status: collectionRate >= 90 ? 'good' : collectionRate >= 75 ? 'warning' : 'bad',
          format: 'percent',
        });
        
        // Overdue Ratio
        const overdueRatio = totalInvoiced > 0 ? (totalOverdue / totalInvoiced) * 100 : 0;
        calculatedRatios.push({
          name: 'Ratio créances',
          value: overdueRatio,
          label: overdueRatio <= 5 ? 'Faible' : overdueRatio <= 15 ? 'Modéré' : 'Élevé',
          status: overdueRatio <= 5 ? 'good' : overdueRatio <= 15 ? 'warning' : 'bad',
          format: 'percent',
        });
        
        setRatios(calculatedRatios);
      } catch (error) {
        console.error('Error loading financial ratios:', error);
        setRatios([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (ratios.length === 0) {
    return (
      <EmptyState
        icon={Calculator}
        title="Aucune donnée"
        description="Les ratios financiers apparaîtront ici."
        variant="compact"
      />
    );
  }

  const formatValue = (value: number, format: string): string => {
    if (format === 'percent') {
      return `${value.toFixed(1)}%`;
    }
    if (format === 'currency') {
      return value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
    }
    return value.toFixed(2);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'good':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
      case 'bad':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <TrendingUp className="w-4 h-4" />;
      case 'bad':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Ratios Financiers</p>
        </div>
      </div>

      {/* Ratios Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-3">
          {ratios.map((ratio, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${getStatusColor(ratio.status)} border-current/20`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {ratio.name}
                  </p>
                  <p className="text-2xl font-bold">{formatValue(ratio.value, ratio.format)}</p>
                </div>
                {getStatusIcon(ratio.status) && (
                  <div className="ml-2">
                    {getStatusIcon(ratio.status)}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{ratio.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
