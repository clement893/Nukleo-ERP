'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Receipt, 
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Search,
  Calendar,
  DollarSign,
  FileText,
  Download,
  CreditCard,
  Coffee,
  Car,
  Home
} from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';

// Mock data pour la démo
const mockExpenses = [
  {
    id: 1,
    employee: 'Marie Dubois',
    description: 'Déplacement client - Rencontre Acme Corp',
    category: 'Transport',
    amount: 125.50,
    date: '2026-01-08',
    status: 'approved',
    requestDate: '2026-01-09',
    approvedBy: 'Sophie Laurent',
    receipt: true,
    avatar: 'MD',
    color: 'bg-blue-500'
  },
  {
    id: 2,
    employee: 'Jean Martin',
    description: 'Matériel bureau - Écran externe',
    category: 'Équipement',
    amount: 389.99,
    date: '2026-01-10',
    status: 'pending',
    requestDate: '2026-01-11',
    approvedBy: null,
    receipt: true,
    avatar: 'JM',
    color: 'bg-purple-500'
  },
  {
    id: 3,
    employee: 'Sophie Laurent',
    description: 'Formation en ligne - Leadership',
    category: 'Formation',
    amount: 299.00,
    date: '2026-01-05',
    status: 'approved',
    requestDate: '2026-01-06',
    approvedBy: 'Direction',
    receipt: true,
    avatar: 'SL',
    color: 'bg-green-500'
  },
  {
    id: 4,
    employee: 'Pierre Durand',
    description: 'Repas client - Restaurant Le Gourmet',
    category: 'Repas',
    amount: 156.75,
    date: '2026-01-12',
    status: 'pending',
    requestDate: '2026-01-13',
    approvedBy: null,
    receipt: false,
    avatar: 'PD',
    color: 'bg-orange-500'
  },
  {
    id: 5,
    employee: 'Claire Petit',
    description: 'Hébergement - Conférence Toronto',
    category: 'Hébergement',
    amount: 425.00,
    date: '2026-01-15',
    status: 'approved',
    requestDate: '2026-01-16',
    approvedBy: 'Sophie Laurent',
    receipt: true,
    avatar: 'CP',
    color: 'bg-pink-500'
  },
  {
    id: 6,
    employee: 'Luc Bernard',
    description: 'Abonnement logiciel - Figma Pro',
    category: 'Logiciel',
    amount: 45.00,
    date: '2026-01-01',
    status: 'approved',
    requestDate: '2026-01-02',
    approvedBy: 'Sophie Laurent',
    receipt: true,
    avatar: 'LB',
    color: 'bg-cyan-500'
  },
  {
    id: 7,
    employee: 'Thomas Moreau',
    description: 'Parking - Visite client',
    category: 'Transport',
    amount: 25.00,
    date: '2026-01-14',
    status: 'rejected',
    requestDate: '2026-01-14',
    approvedBy: 'Sophie Laurent',
    receipt: false,
    avatar: 'TM',
    color: 'bg-indigo-500'
  },
];

const statusConfig = {
  approved: { 
    label: 'Approuvé', 
    color: 'bg-green-500/10 text-green-600 border-green-500/30',
    icon: CheckCircle2,
    iconColor: 'text-green-500'
  },
  pending: { 
    label: 'En attente', 
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    icon: Clock,
    iconColor: 'text-orange-500'
  },
  rejected: { 
    label: 'Rejeté', 
    color: 'bg-red-500/10 text-red-600 border-red-500/30',
    icon: XCircle,
    iconColor: 'text-red-500'
  },
};

const categoryConfig = {
  'Transport': { icon: Car, color: 'text-blue-500' },
  'Équipement': { icon: CreditCard, color: 'text-purple-500' },
  'Formation': { icon: FileText, color: 'text-green-500' },
  'Repas': { icon: Coffee, color: 'text-orange-500' },
  'Hébergement': { icon: Home, color: 'text-pink-500' },
  'Logiciel': { icon: CreditCard, color: 'text-cyan-500' },
};

export default function ExpensesDemoPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Calculate stats
  const totalExpenses = mockExpenses.length;
  const approvedExpenses = mockExpenses.filter(e => e.status === 'approved').length;
  const pendingExpenses = mockExpenses.filter(e => e.status === 'pending').length;
  // rejectedExpenses is calculated but not displayed

  const totalAmount = mockExpenses.reduce((sum, e) => sum + e.amount, 0);
  const approvedAmount = mockExpenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);
  const pendingAmount = mockExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);

  // Get unique categories
  const categories = Array.from(new Set(mockExpenses.map(e => e.category))).sort();

  // Filter expenses
  const filteredExpenses = mockExpenses.filter(expense => {
    const matchesSearch = searchQuery === '' ||
      expense.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <PageContainer className="flex flex-col h-full">
      <MotionDiv variant="slideUp" duration="normal" className="flex flex-col flex-1 space-y-6">
        {/* Hero Header */}
        <div className="relative rounded-2xl overflow-hidden -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-12 3xl:-mx-16 4xl:-mx-20 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 3xl:px-16 4xl:px-20 pt-6 pb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
            backgroundSize: '200px 200px'
          }} />
          
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Compte de Dépenses
              </h1>
              <p className="text-white/80 text-lg">
                Gérez et approuvez les dépenses de votre équipe
              </p>
            </div>
            <Button className="hover-nukleo bg-white text-[#523DC9] hover:bg-white/90">
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle dépense
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                <Receipt className="w-6 h-6 text-[#523DC9]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {totalExpenses}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Dépenses</div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {approvedExpenses}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Approuvées</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(approvedAmount)}
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <Clock className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {pendingExpenses}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En Attente</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(pendingAmount)}
            </div>
          </Card>

          <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/30">
                <DollarSign className="w-6 h-6 text-[#3B82F6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(totalAmount)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Montant Total</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par employé ou description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="approved">Approuvé</option>
              <option value="pending">En attente</option>
              <option value="rejected">Rejeté</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <Button variant="outline" className="hover-nukleo">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>

        {/* Expenses List */}
        <div className="space-y-4">
          {filteredExpenses.map((expense) => {
            const CategoryIcon = categoryConfig[expense.category as keyof typeof categoryConfig]?.icon || Receipt;
            const categoryColor = categoryConfig[expense.category as keyof typeof categoryConfig]?.color || 'text-gray-500';
            
            return (
              <Card key={expense.id} className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:border-[#523DC9]/40 transition-all duration-200 cursor-pointer group">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Section - Employee Info */}
                  <div className="flex items-start gap-4 lg:w-1/4">
                    <div className={`w-14 h-14 rounded-full ${expense.color} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                      {expense.avatar}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-[#523DC9] transition-colors mb-1">
                        {expense.employee}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <CategoryIcon className={`w-4 h-4 ${categoryColor}`} />
                        <span>{expense.category}</span>
                      </div>
                      <Badge className={`${statusConfig[expense.status as keyof typeof statusConfig].color} border`}>
                        {statusConfig[expense.status as keyof typeof statusConfig].label}
                      </Badge>
                    </div>
                  </div>

                  {/* Middle Section - Description & Details */}
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-900 dark:text-white mb-3">
                      {expense.description}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Date: {new Date(expense.date).toLocaleDateString('fr-CA')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <FileText className="w-4 h-4" />
                        <span>Reçu: {expense.receipt ? '✓ Oui' : '✗ Non'}</span>
                      </div>
                    </div>
                    {expense.status === 'approved' && expense.approvedBy && (
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        Approuvé par {expense.approvedBy}
                      </div>
                    )}
                  </div>

                  {/* Right Section - Amount & Actions */}
                  <div className="flex flex-col items-end justify-between lg:w-1/6">
                    <div className="text-right mb-4">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(expense.amount)}
                      </div>
                    </div>
                    {expense.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" className="hover-nukleo bg-green-500 hover:bg-green-600 text-white">
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="hover-nukleo border-red-500 text-red-500">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {expense.receipt && (
                      <Button size="sm" variant="outline" className="hover-nukleo mt-2">
                        <FileText className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Summary by Category */}
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Dépenses par catégorie</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => {
              const categoryExpenses = mockExpenses.filter(e => e.category === category && e.status === 'approved');
              const categoryTotal = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
              const CategoryIcon = categoryConfig[category as keyof typeof categoryConfig]?.icon || Receipt;
              const categoryColor = categoryConfig[category as keyof typeof categoryConfig]?.color || 'text-gray-500';
              
              return (
                <div key={category} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className={`p-3 rounded-lg bg-gray-100 dark:bg-gray-800`}>
                    <CategoryIcon className={`w-6 h-6 ${categoryColor}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{category}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{categoryExpenses.length} dépenses</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(categoryTotal)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </MotionDiv>
    </PageContainer>
  );
}
