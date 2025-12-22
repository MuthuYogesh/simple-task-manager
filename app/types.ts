export type TaskStatus = 'todo' | 'in-progress' | 'partially-complete' | 'done';

export type Category = 'Work' | 'Personal' | 'Health' | 'Learning' | 'Finance';

export interface Task {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  status: TaskStatus;
  category: Category;
  pendingReason?: string; // For partially complete tasks
}

export interface ViewProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
}