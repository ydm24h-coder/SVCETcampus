import { useState, useEffect } from 'react';

const STORAGE_KEY = 'svcet_grades_v2';

const defaultGrades = [];

export const useGrades = () => {
  const [grades, setGradesState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultGrades));
    return defaultGrades;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setGradesState(JSON.parse(saved));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('gradesUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('gradesUpdated', handleStorageChange);
    };
  }, []);

  const setGrades = (newGrades) => {
    let updated;
    if (typeof newGrades === 'function') {
      updated = newGrades(grades);
    } else {
      updated = newGrades;
    }
    setGradesState(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('gradesUpdated'));
  };

  const updateGrade = (id, field, value) => {
    setGrades(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  return { grades, setGrades, updateGrade };
};
