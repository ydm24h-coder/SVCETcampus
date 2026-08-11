import { useState, useEffect } from 'react';

const STORAGE_KEY = 'svcet_attendance_v2';

const defaultStudents = [];

export const useAttendance = () => {
  const [students, setStudentsState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStudents));
    return defaultStudents;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setStudentsState(JSON.parse(saved));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('attendanceUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('attendanceUpdated', handleStorageChange);
    };
  }, []);

  const setStudents = (newStudents) => {
    let updated;
    if (typeof newStudents === 'function') {
      updated = newStudents(students);
    } else {
      updated = newStudents;
    }
    setStudentsState(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('attendanceUpdated'));
  };

  const markStatus = (id, status) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  return { students, markStatus };
};
