import { useState, useEffect } from 'react';

const STORAGE_KEY = 'svcet_timetable_v3'; // Bumped version for new schema

const defaultSchedule = [];

export const useTimetable = () => {
  const [schedules, setSchedulesState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSchedule));
    return defaultSchedule;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSchedulesState(JSON.parse(saved));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('timetableUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('timetableUpdated', handleStorageChange);
    };
  }, []);

  const setSchedules = (newSchedules) => {
    let updated;
    if (typeof newSchedules === 'function') {
      updated = newSchedules(schedules);
    } else {
      updated = newSchedules;
    }
    setSchedulesState(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('timetableUpdated'));
  };

  const addSchedule = (scheduleData) => {
    const newSchedule = {
      ...scheduleData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setSchedules(prev => [newSchedule, ...prev]);
  };

  const updateSchedule = (id, updatedData) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updatedData } : s));
  };

  const deleteSchedule = (id) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  return { schedules, addSchedule, updateSchedule, deleteSchedule };
};
