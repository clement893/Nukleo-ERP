'use client';

interface Task {
  id: string;
  title: string;
  description?: string;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  commentsCount: number;
  attachmentsCount: number;
}

interface Column {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

interface TasksTabProps {
  columns: Column[];
}

export default function TasksTab({ columns: _columns }: TasksTabProps) {
  return (
    <div>
      <p>Tasks Tab</p>
    </div>
  );
}
