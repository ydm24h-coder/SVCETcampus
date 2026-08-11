import { useState, useEffect } from 'react';
import { dailyTasks as defaultTasks } from "@database/frontend_mock/dailyTasks";

export const useDailyTasks = () => {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('svcet_daily_tasks');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: if saved is just an array, convert to the new object structure
      if (Array.isArray(parsed)) {
        return {
          tasks: parsed,
          dailyAssignment: null,
          publishedHistory: []
        };
      }
      return parsed;
    }
    return {
      tasks: defaultTasks,
      dailyAssignment: null,
      publishedHistory: []
    };
  });

  useEffect(() => {
    localStorage.setItem('svcet_daily_tasks', JSON.stringify(data));
  }, [data]);

  const addTask = (task) => {
    setData(prev => {
      const newId = prev.tasks.length > 0 ? Math.max(...prev.tasks.map(t => t.id)) + 1 : 1;
      return { ...prev, tasks: [...prev.tasks, { ...task, id: newId }] };
    });
  };

  const updateTask = (id, updatedTask) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updatedTask } : t)
    }));
  };

  const deleteTask = (id) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id),
      // Clean up history if the task is deleted
      publishedHistory: prev.publishedHistory.filter(historyId => historyId !== id),
      dailyAssignment: prev.dailyAssignment?.taskId === id ? null : prev.dailyAssignment
    }));
  };

  const getDailyTask = () => {
    if (!data.tasks || data.tasks.length === 0) return null;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we already have an assignment for today
    if (data.dailyAssignment && data.dailyAssignment.date === today) {
      return data.tasks.find(t => t.id === data.dailyAssignment.taskId) || null;
    }
    
    // It's a new day, we need to pick a new task.
    let currentHistory = [...data.publishedHistory];
    
    // Filter tasks that haven't been published yet
    let availableTasks = data.tasks.filter(t => !currentHistory.includes(t.id));
    
    // If all tasks have been published, start a new cycle
    if (availableTasks.length === 0) {
      currentHistory = [];
      availableTasks = [...data.tasks];
    }
    
    // Randomly select from available tasks
    const randomIndex = Math.floor(Math.random() * availableTasks.length);
    const selectedTask = availableTasks[randomIndex];
    
    // Add to history
    currentHistory.push(selectedTask.id);
    
    const newAssignment = {
      date: today,
      taskId: selectedTask.id
    };
    
    // We update state asynchronously for persistence, but return the task immediately
    setTimeout(() => {
      setData(prev => ({
        ...prev,
        dailyAssignment: newAssignment,
        publishedHistory: currentHistory
      }));
    }, 0);
    
    return selectedTask;
  };

  return { 
    tasks: data.tasks, 
    publishedHistory: data.publishedHistory,
    addTask, 
    updateTask, 
    deleteTask, 
    getDailyTask 
  };
};
