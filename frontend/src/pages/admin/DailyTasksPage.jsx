import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Code2, PlayCircle, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useDailyTasks } from '@/hooks/useDailyTasks';

const AdminDailyTasksPage = () => {
  const { tasks, publishedHistory, addTask, updateTask, deleteTask } = useDailyTasks();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const defaultTaskData = {
    title: '',
    difficulty: 'Easy',
    problemStatement: '',
    starterCode: {
      python: 'def solve(input_data):\n    pass',
      cpp: '#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n    }\n};',
      c: '#include <stdio.h>\n\nvoid solve() {\n}',
      java: 'class Solution {\n    public void solve() {\n    }\n}'
    },
    testCases: [
      { input: '', expectedOutput: '' }
    ]
  };

  const [formData, setFormData] = useState(defaultTaskData);
  const [activeCodeTab, setActiveCodeTab] = useState('python');

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.difficulty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingTask(null);
    setFormData(defaultTaskData);
    setActiveCodeTab('python');
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData(task);
    setActiveCodeTab('python');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingTask) {
      updateTask(editingTask.id, formData);
    } else {
      addTask(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Tasks Management</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Manage algorithmic challenges for the student platform.</p>
        </div>
        <Button onClick={openCreateModal} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add New Task
        </Button>
      </div>

      <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <CardTitle>Task Library</CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                <span>Cycle Progress:</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {publishedHistory?.length || 0} / {tasks.length} Published
                </Badge>
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input 
                placeholder="Search tasks..." 
                className="pl-9 border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 dark:bg-neutral-950/50 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Task Title</th>
                  <th className="px-4 py-3 font-medium">Difficulty</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredTasks.map((task, index) => (
                  <tr key={task.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-4 py-4 font-mono text-neutral-500">#{task.id}</td>
                    <td className="px-4 py-4 font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-indigo-500" />
                      {task.title}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className={`
                        ${task.difficulty === 'Easy' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50' : ''}
                        ${task.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50' : ''}
                        ${task.difficulty === 'Hard' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50' : ''}
                      `}>
                        {task.difficulty}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400" onClick={() => openEditModal(task)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-red-600 dark:hover:text-red-400" onClick={() => handleDelete(task.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-neutral-500">
                      No tasks found. Try a different search term or add a new task.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3 space-y-2">
                <label className="text-sm font-medium">Task Title</label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="e.g. Two Sum" 
                />
              </div>
              <div className="col-span-1 space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <select 
                  className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Problem Statement (Markdown supported)</label>
              <Textarea 
                value={formData.problemStatement} 
                onChange={(e) => setFormData({...formData, problemStatement: e.target.value})} 
                placeholder="Describe the algorithm requirements..."
                className="min-h-[150px]"
              />
            </div>

            <div className="space-y-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <label className="text-sm font-medium flex items-center gap-2"><Code2 className="w-4 h-4" /> Starter Code Templates</label>
              
              <div className="flex border border-neutral-200 dark:border-neutral-800 rounded-t-md overflow-hidden bg-neutral-50 dark:bg-neutral-950">
                {['python', 'cpp', 'c', 'java'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => setActiveCodeTab(lang)}
                    className={`flex-1 py-2 text-xs font-mono font-medium transition-colors ${activeCodeTab === lang ? 'bg-indigo-500 text-white' : 'text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
              <Textarea 
                value={formData.starterCode[activeCodeTab]} 
                onChange={(e) => setFormData({
                  ...formData, 
                  starterCode: {
                    ...formData.starterCode,
                    [activeCodeTab]: e.target.value
                  }
                })} 
                className="font-mono text-xs min-h-[200px] rounded-t-none bg-neutral-900 text-neutral-100 border-neutral-800 focus-visible:ring-indigo-500"
                spellCheck="false"
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">Test Cases</label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setFormData({
                    ...formData,
                    testCases: [...(formData.testCases || []), { input: '', expectedOutput: '' }]
                  })}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Test Case
                </Button>
              </div>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {(formData.testCases || []).map((tc, index) => (
                  <div key={index} className="p-3 border border-neutral-200 dark:border-neutral-800 rounded-md bg-neutral-50 dark:bg-neutral-950 relative">
                    <div className="absolute top-2 right-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                        onClick={() => {
                          const newTc = [...formData.testCases];
                          newTc.splice(index, 1);
                          setFormData({...formData, testCases: newTc});
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-xs font-semibold mb-2">Test Case {index + 1}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1 block">Input</label>
                        <Textarea 
                          value={tc.input}
                          onChange={(e) => {
                            const newTc = [...formData.testCases];
                            newTc[index].input = e.target.value;
                            setFormData({...formData, testCases: newTc});
                          }}
                          className="min-h-[80px] font-mono text-xs"
                          placeholder="e.g. nums = [2,7,11,15]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1 block">Expected Output</label>
                        <Textarea 
                          value={tc.expectedOutput}
                          onChange={(e) => {
                            const newTc = [...formData.testCases];
                            newTc[index].expectedOutput = e.target.value;
                            setFormData({...formData, testCases: newTc});
                          }}
                          className="min-h-[80px] font-mono text-xs"
                          placeholder="e.g. [0,1]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {(!formData.testCases || formData.testCases.length === 0) && (
                  <div className="text-center p-4 border border-dashed rounded-md text-sm text-neutral-500">
                    No test cases added. Click "Add Test Case" to create one.
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Save className="w-4 h-4 mr-2" /> Save Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDailyTasksPage;
