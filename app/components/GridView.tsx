import React from 'react';
import { ViewProps } from '../types';
import { Check, Trash2, Download, Clock, AlertTriangle } from 'lucide-react';

const GridView: React.FC<ViewProps> = ({ tasks, onToggleStatus, onDelete }) => {
  
  const sortedTasks = [...tasks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleExport = () => {
    const headers = ['ID', 'Title', 'Date', 'Start Time', 'End Time', 'Category', 'Status', 'Pending Notes'];
    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + tasks.map(t => `${t.id},"${t.title}",${t.date},${t.startTime || ''},${t.endTime || ''},${t.category},${t.status},"${t.pendingReason || ''}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tasks_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold text-gray-700">All Tasks List</h3>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <Download size={16} /> Export to CSV
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 bg-gray-50/50">
              <th className="px-6 py-3 font-medium w-12">#</th>
              <th className="px-6 py-3 font-medium">Task Name</th>
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium">Date & Time</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedTasks.map((task, index) => (
              <tr key={task.id} className="hover:bg-gray-50 group transition-colors">
                <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleStatus(task.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                          task.status === 'done' 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-gray-300 hover:border-indigo-400'
                        }`}
                      >
                        {task.status === 'done' && <Check size={12} strokeWidth={3} />}
                      </button>
                      <span className={`font-medium ${task.status === 'done' ? 'line-through text-gray-400 transition-all duration-300' : 'text-gray-800'}`}>
                        {task.title}
                      </span>
                    </div>
                    {task.pendingReason && task.status === 'partially-complete' && (
                        <div className="flex items-center gap-1 text-xs text-amber-600 ml-8 bg-amber-50 px-2 py-0.5 rounded w-fit">
                            <AlertTriangle size={10} />
                            {task.pendingReason}
                        </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium 
                    ${task.category === 'Work' ? 'bg-purple-100 text-purple-700' : 
                      task.category === 'Health' ? 'bg-green-100 text-green-700' :
                      task.category === 'Finance' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'}`}>
                    {task.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                  <div>{task.date}</div>
                  {(task.startTime || task.endTime) && (
                      <div className="flex items-center gap-1 text-gray-400 mt-1">
                          <Clock size={12} />
                          {task.startTime || '...'} - {task.endTime || '...'}
                      </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`capitalize text-xs font-medium px-2 py-1 rounded border ${
                    task.status === 'done' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                    task.status === 'partially-complete' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                    task.status === 'in-progress' ? 'bg-blue-50 border-blue-200 text-blue-700' : 
                    'bg-gray-50 border-gray-200 text-gray-500'
                  }`}>
                    {task.status.replace('-', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => onDelete(task.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GridView;
