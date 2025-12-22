import React from 'react';
import { Task } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Trophy, TrendingUp, Target } from 'lucide-react';

interface AnalyticsViewProps {
  tasks: Task[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks }) => {
  
  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const winRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Streak Calculation (Simplistic: Consecutive days with at least 1 completed task looking back)
  const calculateStreak = () => {
    let streak = 0;
    const today = new Date();
    // check last 30 days
    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayHasCompletion = tasks.some(t => t.date === dateStr && t.status === 'done');
        if (dayHasCompletion) {
            streak++;
        } else if (i > 0) { // Allow today to be incomplete if it's currently today
             // Break if gap found (excluding today if checking strictly)
             // simplified logic: just consecutive activity
             if (dateStr !== new Date().toISOString().split('T')[0]) break; 
        }
    }
    return streak;
  };
  
  const streak = calculateStreak();

  // Data for Category Chart
  const categoryData = Object.entries(
    tasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  // Data for Weekly Progress (Last 7 days)
  const getLast7Days = () => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const tasksOnDay = tasks.filter(t => t.date === dateStr);
      const done = tasksOnDay.filter(t => t.status === 'done').length;
      result.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: done,
        total: tasksOnDay.length
      });
    }
    return result;
  };

  const weeklyData = getLast7Days();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-4 bg-indigo-50 rounded-full text-indigo-600">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Current Win Rate</p>
            <h3 className="text-2xl font-bold text-gray-800">{winRate}%</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-4 bg-emerald-50 rounded-full text-emerald-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Active Streak</p>
            <h3 className="text-2xl font-bold text-gray-800">{streak} Days</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-4 bg-amber-50 rounded-full text-amber-600">
            <Target size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Tasks Completed</p>
            <h3 className="text-2xl font-bold text-gray-800">{completedTasks} <span className="text-sm text-gray-400 font-normal">/ {totalTasks}</span></h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80">
          <h3 className="font-bold text-gray-700 mb-4">Weekly Performance</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
              <YAxis hide />
              <Tooltip cursor={{fill: '#f3f4f6'}} />
              <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80">
          <h3 className="font-bold text-gray-700 mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={categoryData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
