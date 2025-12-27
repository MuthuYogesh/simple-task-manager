import React from 'react';
import { ViewProps, Task } from '../types';
import { Clock, CheckCircle2, Circle, AlertCircle, HelpCircle } from 'lucide-react';

const MatrixView: React.FC<ViewProps> = ({ tasks, onUpdateTask, onDelete }) => {
  // Group tasks by date
  const tasksByDate = tasks.reduce((acc, task) => {
    if (!acc[task.date]) {
      acc[task.date] = [];
    }
    acc[task.date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Sort dates
  const sortedDates = Object.keys(tasksByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-emerald-50 border-emerald-200';
      case 'partially-complete': return 'bg-amber-50 border-amber-200';
      case 'in-progress': return 'bg-blue-50 border-blue-200';
      default: return 'bg-white border-gray-200';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {sortedDates.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
          No tasks found. Add a task to see the matrix.
        </div>
      )}

      {sortedDates.map(date => (
        <div key={date} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Row Header: The Day */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-indigo-600 font-bold">
                {new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
              </span>
              <span className="text-gray-500">
                {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </span>
            </h3>
            <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
              {tasksByDate[date].length} Tasks
            </span>
          </div>

          {/* Row Content: The Tasks Columns */}
          <div className="p-6 overflow-x-auto">
            <div className="flex gap-4 min-w-min">
              {tasksByDate[date].map(task => (
                <div 
                  key={task.id} 
                  className={`w-72 flex-shrink-0 border rounded-lg p-4 transition-all ${getStatusColor(task.status)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider
                      ${task.category === 'Work' ? 'bg-purple-100 text-purple-700' : 
                        task.category === 'Health' ? 'bg-green-100 text-green-700' :
                        task.category === 'Finance' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'}`}>
                      {task.category}
                    </span>
                    {(task.startTime || task.endTime) && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 font-mono">
                        <Clock size={10} />
                        {task.startTime || '--:--'} - {task.endTime || '--:--'}
                      </div>
                    )}
                  </div>

                  <h4 className={`font-medium text-gray-900 mb-4 ${task.status === 'done' ? 'line-through text-opacity-50' : ''}`}>
                    {task.title}
                  </h4>

                  {/* Matrix Controls */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-white/50 p-1 rounded-lg border border-gray-100">
                      <button 
                        onClick={() => onUpdateTask(task.id, { status: 'todo' })}
                        className={`flex-1 flex justify-center p-1.5 rounded hover:bg-white transition-colors ${task.status === 'todo' ? 'bg-white shadow-sm ring-1 ring-gray-200' : 'text-gray-400'}`}
                        title="Incomplete / Todo"
                      >
                        <Circle size={16} />
                      </button>
                      <button 
                        onClick={() => onUpdateTask(task.id, { status: 'partially-complete' })}
                        className={`flex-1 flex justify-center p-1.5 rounded hover:bg-white transition-colors ${task.status === 'partially-complete' ? 'bg-amber-100 text-amber-600 shadow-sm' : 'text-gray-400'}`}
                        title="Partially Complete"
                      >
                        <AlertCircle size={16} />
                      </button>
                      <button 
                        onClick={() => onUpdateTask(task.id, { status: 'done' })}
                        className={`flex-1 flex justify-center p-1.5 rounded hover:bg-white transition-colors ${task.status === 'done' ? 'bg-emerald-100 text-emerald-600 shadow-sm' : 'text-gray-400'}`}
                        title="Complete"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </div>

                    {/* Partial Reason Input */}
                    {task.status === 'partially-complete' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-2">
                        <label className="text-[10px] uppercase font-bold text-amber-700 mb-1 block">What did you complete?</label>
                        <textarea
                          value={(task as any).completedItems || ''}
                          onChange={(e) => onUpdateTask(task.id, { completedItems: e.target.value })}
                          placeholder="e.g. Solved 3 problems"
                          className="w-full text-xs p-2 border border-amber-200 rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                          rows={2}
                        />
                        <label className="text-[10px] uppercase font-bold text-amber-700 mb-1 block">What remains pending?</label>
                        <textarea
                          value={(task as any).pendingItems || ''}
                          onChange={(e) => onUpdateTask(task.id, { pendingItems: e.target.value })}
                          placeholder="e.g. Need to review solutions"
                          className="w-full text-xs p-2 border border-amber-200 rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                          rows={2}
                        />
                      </div>
                    )}

                    {/* Actual start/end time editing */}
                    <div className="mt-2 space-y-1">
                      <label className="text-[10px] font-medium text-gray-600">Actual Start</label>
                      <input type="time" value={(task as any).actualStartTime || ''} onChange={(e) => onUpdateTask(task.id, { actualStartTime: e.target.value })} className="w-full text-xs p-2 border rounded" />
                      <label className="text-[10px] font-medium text-gray-600">Actual End</label>
                      <input type="time" value={(task as any).actualEndTime || ''} onChange={(e) => onUpdateTask(task.id, { actualEndTime: e.target.value })} className="w-full text-xs p-2 border rounded" />
                    </div>
                    
                    {/* Status Text Label */}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100/50">
                        <span className="text-xs font-medium text-gray-500 capitalize">
                            {task.status.replace('-', ' ')}
                        </span>
                        <button onClick={() => onDelete(task.id)} className="text-xs text-red-300 hover:text-red-500">
                            Delete
                        </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Empty State Placeholder for the day */}
              <div className="w-48 flex-shrink-0 border-2 border-dashed border-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-300 gap-2 min-h-[180px]">
                <HelpCircle size={24} className="opacity-20" />
                <span className="text-xs font-medium">No more tasks</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MatrixView;
