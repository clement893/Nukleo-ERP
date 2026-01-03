'use client';

/**
 * Widget : Dépenses par Catégorie
 * Répartition détaillée des dépenses par catégorie
 */

import { DollarSign, Folder } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { expenseAccountsAPI } from '@/lib/api/finances/expenseAccounts';
import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data) return null;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white">{data.name}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(data.value as number)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {data.payload?.count || 0} dépense{(data.payload?.count || 0) !== 1 ? 's' : ''}
        </p>
      </div>
    );
  }
  return null;
};

export function ExpensesByCategoryWidget({ }: WidgetProps) {
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const expenses = await expenseAccountsAPI.list();
        
        // Group by category from metadata or use default
        const grouped: Record<string, { amount: number; count: number }> = {};
        
        expenses.forEach((expense: any) => {
          // Try to get category from metadata
          let category = 'Autres';
          if (expense.metadata && typeof expense.metadata === 'object' && 'category' in expense.metadata) {
            category = String(expense.metadata.category) || 'Autres';
          } else if (expense.description) {
            // Try to infer category from description (simplified)
            const desc = expense.description.toLowerCase();
            if (desc.includes('transport') || desc.includes('voiture') || desc.includes('carburant')) {
              category = 'Transport';
            } else if (desc.includes('restaurant') || desc.includes('repas') || desc.includes('déjeuner')) {
              category = 'Restauration';
            } else if (desc.includes('hotel') || desc.includes('hébergement') || desc.includes('logement')) {
              category = 'Hébergement';
            } else if (desc.includes('equipement') || desc.includes('matériel') || desc.includes('fourniture')) {
              category = 'Équipement';
            } else if (desc.includes('formation') || desc.includes('cours') || desc.includes('formation')) {
              category = 'Formation';
            } else if (desc.includes('telephone') || desc.includes('téléphone') || desc.includes('communication')) {
              category = 'Communication';
            }
          }
          
          const amount = parseFloat(expense.total_amount || 0);
          if (!grouped[category]) {
            grouped[category] = { amount: 0, count: 0 };
          }
          grouped[category].amount += amount;
          grouped[category].count += 1;
        });

        const totalAmount = Object.values(grouped).reduce((sum, cat) => sum + cat.amount, 0);
        setTotal(totalAmount);

        // Convert to array with percentages
        const data: CategoryData[] = Object.entries(grouped)
          .map(([category, { amount, count }]) => ({
            category,
            amount,
            percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
            count,
          }))
          .sort((a, b) => b.amount - a.amount);

        setCategoryData(data);
      } catch (error) {
        console.error('Error loading expenses by category:', error);
        setCategoryData([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (categoryData.length === 0) {
    return (
      <EmptyState
        icon={Folder}
        title="Aucune dépense"
        description="Les dépenses par catégorie apparaîtront ici."
        variant="compact"
      />
    );
  }

  const colors = [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#10b981', // green-500
    '#3b82f6', // blue-500
    '#6366f1', // indigo-500
    '#8b5cf6', // purple-500
    '#ec4899', // pink-500
    '#6b7280', // gray-500
  ];

  const chartData = categoryData.map(item => ({
    name: item.category,
    value: item.amount,
    count: item.count,
  }));

  const COLORS = chartData.map((_, index) => colors[index % colors.length]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total dépenses</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(total)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Catégories</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{categoryData.length}</p>
          </div>
        </div>
      </div>

      {/* Chart - Use BarChart for better readability with many categories */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" opacity={0.5} />
            <XAxis
              type="number"
              tick={{ fill: 'currentColor', fontSize: 12, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              tickFormatter={(value) =>
                new Intl.NumberFormat('fr-FR', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)
              }
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'currentColor', fontSize: 11, className: 'text-gray-600 dark:text-gray-400' }}
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-600"
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-2 text-xs max-h-24 overflow-y-auto">
          {categoryData.slice(0, 8).map((item, index) => (
            <div key={item.category} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-gray-600 dark:text-gray-400 truncate">{item.category}</span>
              <span className="ml-auto font-semibold text-gray-900 dark:text-white">
                {item.percentage.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
