export type TaskStatus = 'todo' | 'in-progress' | 'partially-complete' | 'done';

export type Category = 'Work' | 'Personal' | 'Health' | 'Learning' | 'Finance';

export interface Task {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  actualStartTime?: string; // HH:mm - actual manual start
  actualEndTime?: string; // HH:mm - actual manual end
  status: TaskStatus;
  category: Category;
  pendingItems?: string; // For partially complete tasks: what is pending
  completedItems?: string; // For completed tasks: what was completed
}

export interface ViewProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
}