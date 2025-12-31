'use client';

import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  TrendingUp,
  Calendar,
  AlertCircle,
  Users,
  FileText
} from 'lucide-react';

interface OverviewTabProps {
  data: {
    tasksCompleted: number;
    tasksTotal: number;
    timeSpent: number;
    timeEstimated: number;
    budgetUsed: number;
    budgetTotal: number;
    teamSize: number;
    filesCount: number;
    milestones: Array<{
      id: string;
      name: string;
      date: string;
      completed: boolean;
    }>;
    recentActivity: Array<{
      id: string;
      user: string;
      action: string;
      time: string;
    }>;
  };
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

export function OverviewTab({ data }: OverviewTabProps) {
  const tasksProgress = (data.tasksCompleted / data.tasksTotal) * 100;
  const timeProgress = (data.timeSpent / data.timeEstimated) * 100;
  const budgetProgress = (data.budgetUsed / data.budgetTotal) * 100;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tasks Card */}
        <motion.div variants={fadeInUp} className="glass-card p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="glass-badge p-3 rounded-lg bg-green-500/10">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="text-sm font-medium text-muted-accessible mb-1">
            Tâches complétées
          </h3>
          <p className="text-3xl font-black text-gray-900 dark:text-white mb-2">
            {data.tasksCompleted}<span className="text-lg text-muted-accessible">/{data.tasksTotal}</span>
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${tasksProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-accessible mt-2">
            {tasksProgress.toFixed(0)}% complété
          </p>
        </motion.div>

        {/* Time Card */}
        <motion.div variants={fadeInUp} className="glass-card p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="glass-badge p-3 rounded-lg bg-blue-500/10">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-sm font-medium text-muted-accessible mb-1">
            Temps passé
          </h3>
          <p className="text-3xl font-black text-gray-900 dark:text-white mb-2">
            {data.timeSpent}<span className="text-lg text-muted-accessible">h</span>
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(timeProgress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-accessible mt-2">
            Sur {data.timeEstimated}h estimées
          </p>
        </motion.div>

        {/* Budget Card */}
        <motion.div variants={fadeInUp} className="glass-card p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="glass-badge p-3 rounded-lg bg-purple-500/10">
              <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            {budgetProgress > 90 ? (
              <AlertCircle className="w-4 h-4 text-amber-600" />
            ) : (
              <TrendingUp className="w-4 h-4 text-purple-600" />
            )}
          </div>
          <h3 className="text-sm font-medium text-muted-accessible mb-1">
            Budget utilisé
          </h3>
          <p className="text-3xl font-black text-gray-900 dark:text-white mb-2">
            {(data.budgetUsed / 1000).toFixed(0)}k€
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                budgetProgress > 90 
                  ? 'bg-gradient-to-r from-amber-500 to-red-600' 
                  : 'bg-gradient-to-r from-purple-500 to-purple-600'
              }`}
              style={{ width: `${Math.min(budgetProgress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-accessible mt-2">
            Sur {(data.budgetTotal / 1000).toFixed(0)}k€ budget
          </p>
        </motion.div>

        {/* Team Card */}
        <motion.div variants={fadeInUp} className="glass-card p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="glass-badge p-3 rounded-lg bg-amber-500/10">
              <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-muted-accessible mb-1">
            Équipe
          </h3>
          <p className="text-3xl font-black text-gray-900 dark:text-white mb-4">
            {data.teamSize}
          </p>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-accessible" />
            <span className="text-sm text-muted-accessible">
              {data.filesCount} fichiers
            </span>
          </div>
        </motion.div>
      </div>

      {/* Milestones & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestones */}
        <motion.div variants={fadeInUp} className="glass-card p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="glass-badge p-2 rounded-lg bg-blue-500/10">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Jalons importants
            </h3>
          </div>

          <div className="space-y-3">
            {data.milestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  flex items-center gap-3 p-3 rounded-lg transition-all
                  ${milestone.completed 
                    ? 'bg-green-500/10 border border-green-500/30' 
                    : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }
                `}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${milestone.completed 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }
                `}>
                  {milestone.completed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`
                    text-sm font-semibold
                    ${milestone.completed 
                      ? 'text-green-700 dark:text-green-300 line-through' 
                      : 'text-gray-900 dark:text-white'
                    }
                  `}>
                    {milestone.name}
                  </p>
                  <p className="text-xs text-muted-accessible">
                    {new Date(milestone.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={fadeInUp} className="glass-card p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="glass-badge p-2 rounded-lg bg-purple-500/10">
              <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Activité récente
            </h3>
          </div>

          <div className="space-y-4">
            {data.recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {activity.user.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-semibold">{activity.user}</span>
                    {' '}
                    <span className="text-muted-accessible">{activity.action}</span>
                  </p>
                  <p className="text-xs text-muted-accessible mt-0.5">
                    {activity.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
