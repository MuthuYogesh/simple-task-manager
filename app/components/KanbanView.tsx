import React, { useState } from 'react';
import { ViewProps, TaskStatus, Task } from '../types';
import { GripVertical, MoreHorizontal, Calendar as CalendarIcon, Tag, Clock } from 'lucide-react';

const KanbanView: React.FC<ViewProps> = ({ tasks, onUpdateStatus }) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const columns: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-50' },
    { id: 'partially-complete', title: 'Partially Done', color: 'bg-amber-50' },
    { id: 'done', title: 'Done', color: 'bg-emerald-50' },
  ];

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onUpdateStatus(taskId, status);
    }
    setDraggedTaskId(null);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full overflow-x-auto pb-4">
      {columns.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        
        return (
          <div 
            key={col.id} 
            className={`flex-1 min-w-[280px] rounded-xl p-4 ${col.color} border border-transparent transition-colors ${draggedTaskId ? 'border-dashed border-gray-300' : ''}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                {col.title}
                <span className="bg-white px-2 py-0.5 rounded-full text-xs text-gray-500 shadow-sm">
                  {colTasks.length}
                </span>
              </h3>
              <MoreHorizontal size={16} className="text-gray-400 cursor-pointer" />
            </div>

            <div className="space-y-3">
              {colTasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 cursor-move hover:shadow-md transition-shadow group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-600 flex items-center gap-1">
                      <Tag size={10} /> {task.category}
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600">
                      <GripVertical size={14} />
                    </button>
                  </div>
                  
                  <h4 className="font-medium text-gray-800 mb-3">{task.title}</h4>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                        <CalendarIcon size={12} />
                        <span>{task.date}</span>
                    </div>
                    {(task.startTime) && (
                        <div className="flex items-center gap-1">
                            <Clock size={12} /> {task.startTime}
                        </div>
                    )}
                  </div>
                  {(task as any).pendingItems && (
                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-amber-600 italic">
                        "{(task as any).pendingItems}"
                    </div>
                  )}
                  {/* show completed items when available */}
                  {(task as any).completedItems && (
                    <div className="mt-2 text-xs text-emerald-700 italic">
                        "{(task as any).completedItems}"
                    </div>
                  )}
                </div>
              ))}
              {colTasks.length === 0 && (
                <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                  Drop items here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanView;
