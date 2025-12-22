import React, { useState, useEffect } from 'react';
import { LayoutGrid, Calendar as CalendarIcon, Kanban, PieChart, Plus, Sparkles, X, Table } from 'lucide-react';
import { Task, TaskStatus, Category } from './types';
import CalendarView from './components/CalendarView';
import KanbanView from './components/KanbanView';
import GridView from './components/GridView';
import MatrixView from './components/MatrixView';
import AnalyticsView from './components/AnalyticsView';
import Auth from './components/Auth';
import { api } from './services/api';
import { generateTasksFromGoal } from './services/geminiService';

// Simple ID generator
const uuid = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<'calendar' | 'kanban' | 'grid' | 'analytics' | 'matrix'>('matrix');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));

  // AI Loading State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGoal, setAiGoal] = useState('');

  // Initial Data Fetch (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) fetchTasks();
  }, [isAuthenticated]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await api.getTasks();
      setTasks(data);
    } catch (error: any) {
      console.error("Failed to load tasks. Ensure backend is running.", error);
      // If auth failed, clear and show login
      if (error?.message?.includes('401') || error?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsAuthenticated(false);
        setUsername(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: TaskStatus) => {
    try {
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      await api.updateTask(id, { status });
    } catch (error) {
      console.error(error);
      fetchTasks(); // Revert on error
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    try {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      await api.updateTask(id, updates);
    } catch (error) {
      console.error(error);
      fetchTasks();
    }
  };

  const handleToggleStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const newStatus = task.status === 'done' ? 'todo' : 'done';
      handleUpdateStatus(id, newStatus);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== id));
      await api.deleteTask(id);
    } catch (error) {
      console.error(error);
      fetchTasks();
    }
  };

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTaskPayload = {
      id: uuid(), // Generate ID in frontend for simplicity
      title: formData.get('title') as string,
      date: formData.get('date') as string,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      category: formData.get('category') as Category,
      status: 'todo' as TaskStatus
    };

    try {
      // Optimistic update
      setTasks(prev => [...prev, newTaskPayload as Task]);
      setIsModalOpen(false);
      
      await api.createTask(newTaskPayload);
    } catch (error) {
      console.error(error);
      // fetchTasks(); // Optional: Revert if needed
    }
  };

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    try {
        const today = new Date().toISOString().split('T')[0];
        const newTasksData = await generateTasksFromGoal(aiGoal, today);
        
        // Add IDs and Date to generated tasks
        const tasksWithMeta = newTasksData.map(t => ({ 
            ...t, 
            id: uuid(),
            date: today 
        })) as Task[];
        
        // Save generated tasks to backend
        await api.createTask(tasksWithMeta);
        
        // Update local state
        setTasks(prev => [...prev, ...tasksWithMeta]);
        
        setIsAIModalOpen(false);
        setAiGoal('');
    } catch (error) {
        console.error(error);
        alert('Failed to generate tasks. Please check your API key.');
    } finally {
        setAiLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <Auth onLogin={() => { setIsAuthenticated(true); setUsername(localStorage.getItem('username')); fetchTasks(); }} />;
  }

  return (
    <div className="min-h-screen flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutGrid className="text-indigo-600" /> TaskFlow AI
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track consistency, visualize progress.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
            onClick={() => setIsAIModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-sm font-medium transition-colors"
          >
            <Sparkles size={16} /> AI Assistant
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-shadow shadow-sm shadow-indigo-200 text-sm font-medium"
          >
            <Plus size={16} /> New Task
          </button>
          {username && (
            <div className="flex items-center gap-2 ml-3">
              <span className="text-sm text-gray-600">{username}</span>
              <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('username'); setIsAuthenticated(false); setUsername(null); }} className="text-sm text-red-600 hover:text-red-700">Logout</button>
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-fit overflow-x-auto">
        {[
          { id: 'matrix', icon: Table, label: 'Matrix' },
          { id: 'kanban', icon: Kanban, label: 'Board' },
          { id: 'calendar', icon: CalendarIcon, label: 'Calendar' },
          { id: 'grid', icon: LayoutGrid, label: 'List' },
          { id: 'analytics', icon: PieChart, label: 'Analytics' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              view === tab.id 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* View Content */}
      <div className="flex-1">
        {loading && tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p>Loading your tasks...</p>
            </div>
        ) : (
            <>
                {view === 'calendar' && <CalendarView tasks={tasks} />}
                {view === 'kanban' && (
                  <KanbanView 
                    tasks={tasks} 
                    onUpdateStatus={handleUpdateStatus} 
                    onToggleStatus={handleToggleStatus}
                    onUpdateTask={handleUpdateTask}
                    onDelete={handleDelete}
                  />
                )}
                {view === 'grid' && (
                  <GridView 
                    tasks={tasks} 
                    onToggleStatus={handleToggleStatus} 
                    onUpdateStatus={handleUpdateStatus} 
                    onUpdateTask={handleUpdateTask}
                    onDelete={handleDelete} 
                  />
                )}
                {view === 'matrix' && (
                  <MatrixView 
                    tasks={tasks}
                    onUpdateTask={handleUpdateTask}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    onUpdateStatus={handleUpdateStatus}
                  />
                )}
                {view === 'analytics' && <AnalyticsView tasks={tasks} />}
            </>
        )}
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Add New Task</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input required name="title" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="e.g., Read 10 pages" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input required name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select name="category" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white">
                    <option value="Personal">Personal</option>
                    <option value="Work">Work</option>
                    <option value="Health">Health</option>
                    <option value="Learning">Learning</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input name="startTime" type="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input name="endTime" type="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" />
                 </div>
              </div>
              
              <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors mt-2">
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {isAIModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border-t-4 border-purple-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="text-purple-500" size={20} /> AI Plan Generator
              </h3>
              <button onClick={() => setIsAIModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAIGenerate} className="space-y-4">
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">What is your goal?</label>
                <textarea 
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  required 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all h-24 resize-none" 
                  placeholder="e.g., I want to start training for a half-marathon, or I need to organize my home office."
                />
              </div>
              
              <button 
                type="submit" 
                disabled={aiLoading}
                className={`w-full bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors flex justify-center items-center gap-2 ${aiLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {aiLoading ? (
                  <>Processing...</>
                ) : (
                  <>Generate Plan <Sparkles size={16} /></>
                )}
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Powered by Google Gemini 2.5 Flash. Generates actionable tasks added directly to your board.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
