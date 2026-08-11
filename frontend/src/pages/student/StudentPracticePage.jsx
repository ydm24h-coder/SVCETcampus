import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Filter, Code2, Play, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useDailyTasks } from '@/hooks/useDailyTasks';

const StudentPracticePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  
  const { students } = useLeaderboard();
  const { tasks } = useDailyTasks();
  const sessionUser = JSON.parse(localStorage.getItem('svcet_session_student')) || { name: 'Demo Student' };
  const userStats = students.find(s => s.name === sessionUser.name) || { practiceLog: [] };
  const practiceLog = userStats.practiceLog || []; // Assuming we might track practice separately later

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'All' || task.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Code2 className="w-8 h-8 text-indigo-600" />
          Code Practice
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Sharpen your skills by solving our built-in algorithmic challenges.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input 
            placeholder="Search problems..." 
            className="pl-9 bg-white dark:bg-neutral-900"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Easy', 'Medium', 'Hard'].map(diff => (
            <Button
              key={diff}
              variant={difficultyFilter === diff ? "default" : "outline"}
              className={difficultyFilter === diff ? "bg-indigo-600 hover:bg-indigo-700" : "bg-white dark:bg-neutral-900"}
              onClick={() => setDifficultyFilter(diff)}
            >
              {diff}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-[#1a1a1a] text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Title</th>
                <th className="px-6 py-4 font-semibold">Difficulty</th>
                <th className="px-6 py-4 font-semibold text-right hidden sm:table-cell">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const isSolved = practiceLog.includes(task.id);
                  return (
                    <tr 
                      key={task.id} 
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/student/practice/${task.id}`)}
                    >
                      <td className="px-6 py-4">
                        {isSolved ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-neutral-300 dark:border-neutral-700"></div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">
                        {task.id}. {task.title}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`border-none ${
                          task.difficulty === 'Easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          task.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {task.difficulty}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right hidden sm:table-cell">
                        <Button 
                          size="sm" 
                          className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/student/practice/${task.id}`);
                          }}
                        >
                          <Play className="w-4 h-4 mr-2" /> Attempt
                        </Button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-neutral-500">
                    No problems found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentPracticePage;
