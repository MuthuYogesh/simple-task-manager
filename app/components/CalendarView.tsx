import React from 'react';
import { Task } from '../types';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getTasksForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.date === dateStr);
  };

  const getDayColor = (dayTasks: Task[]) => {
    if (dayTasks.length === 0) return 'bg-white border-gray-200';
    
    const completed = dayTasks.filter(t => t.status === 'done').length;
    const partial = dayTasks.filter(t => t.status === 'partially-complete').length;
    const total = dayTasks.length;
    
    if (total === 0) return 'bg-white border-gray-200';

    const ratio = completed / total;

    if (ratio === 1) return 'bg-emerald-100 border-emerald-300';
    if (partial > 0) return 'bg-amber-50 border-amber-200'; // Any partial task marks day as warning
    if (ratio >= 0.5) return 'bg-blue-50 border-blue-200';
    
    return 'bg-white border-gray-200';
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded"></div> All Done</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-50 border border-amber-200 rounded"></div> Partial</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div> In Progress</div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-medium text-gray-400 text-sm py-2">
            {day}
          </div>
        ))}

        {emptySlots.map(slot => (
          <div key={`empty-${slot}`} className="h-32 bg-gray-50/50 rounded-lg"></div>
        ))}

        {daysArray.map(day => {
          const dayTasks = getTasksForDay(day);
          const colorClass = getDayColor(dayTasks);
          const isToday = day === today.getDate();

          return (
            <div 
              key={day} 
              className={`h-32 p-2 rounded-lg border flex flex-col transition-all hover:shadow-md ${colorClass} ${isToday ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
            >
              <span className={`text-sm font-semibold mb-2 ${isToday ? 'text-indigo-600' : 'text-gray-600'}`}>
                {day}
              </span>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                {dayTasks.map(task => (
                  <div key={task.id} className="text-xs flex items-center gap-1 truncate text-gray-700">
                    {task.status === 'done' ? <CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> : 
                     task.status === 'partially-complete' ? <AlertCircle size={12} className="text-amber-500 shrink-0" /> :
                     <Circle size={12} className="text-gray-400 shrink-0" />
                    }
                    <span className={task.status === 'done' ? 'line-through opacity-50' : ''}>
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
