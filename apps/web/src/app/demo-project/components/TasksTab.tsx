'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  User,
  Flag,
  MessageSquare,
  Paperclip
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  commentsCount?: number;
  attachmentsCount?: number;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
}

interface TasksTabProps {
  columns: Column[];
}

const priorityConfig = {
  low: { color: 'text-gray-500', bg: 'bg-gray-500/10', label: 'Basse' },
  medium: { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Moyenne' },
  high: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Haute' }
};

function TaskCard({ task }: { task: Task }) {
  const priority = priorityConfig[task.priority];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      className="glass-card p-4 rounded-lg cursor-pointer group hover:shadow-lg transition-all"
    >
      {/* Task Title */}
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* Task Description */}
      {task.description && (
        <p className="text-xs text-muted-accessible mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Task Meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Priority */}
          <div className={`${priority.bg} ${priority.color} px-2 py-1 rounded text-xs font-medium flex items-center gap-1`}>
            <Flag className="w-3 h-3" />
            <span className="hidden sm:inline">{priority.label}</span>
          </div>

          {/* Due Date */}
          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-muted-accessible">
              <Calendar className="w-3 h-3" />
              <span className="hidden sm:inline">
                {new Date(task.dueDate).toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'short' 
                })}
              </span>
            </div>
          )}
        </div>

        {/* Assignee Avatar */}
        {task.assignee && (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {task.assignee.charAt(0)}
          </div>
        )}
      </div>

      {/* Task Footer */}
      {(task.commentsCount || task.attachmentsCount) && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
          {task.commentsCount && task.commentsCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-accessible">
              <MessageSquare className="w-3 h-3" />
              <span>{task.commentsCount}</span>
            </div>
          )}
          {task.attachmentsCount && task.attachmentsCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-accessible">
              <Paperclip className="w-3 h-3" />
              <span>{task.attachmentsCount}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function KanbanColumn({ column }: { column: Column }) {
  return (
    <div className="flex-1 min-w-[280px] flex flex-col">
      {/* Column Header */}
      <div className="glass-card p-4 rounded-xl mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${column.color}`} />
            <h3 className="font-bold text-gray-900 dark:text-white">
              {column.title}
            </h3>
            <span className="glass-badge px-2 py-0.5 rounded-full text-xs font-bold text-muted-accessible">
              {column.tasks.length}
            </span>
          </div>
          <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {column.tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}

        {/* Add Task Button */}
        <button className="w-full glass-card p-3 rounded-lg flex items-center justify-center gap-2 text-muted-accessible hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 transition-all group">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Ajouter une tâche</span>
        </button>
      </div>
    </div>
  );
}

export function TasksTab({ columns }: TasksTabProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="glass-card p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'kanban'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Liste
          </button>
        </div>

        <button className="glass-button px-4 py-2 rounded-lg flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Nouvelle tâche</span>
        </button>
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {columns.map((column) => (
            <KanbanColumn key={column.id} column={column} />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="glass-card p-6 rounded-xl">
          <p className="text-center text-muted-accessible">
            Vue liste en cours de développement...
          </p>
        </div>
      )}
    </div>
  );
}
