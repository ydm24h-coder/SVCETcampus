import { useState, useEffect } from 'react';

const STORAGE_KEY = 'svcet_departments_v2';

const defaultDepartments = [
  { id: 1, name: 'CSE', description: 'Computer Science and Engineering' },
  { id: 2, name: 'AIML', description: 'Artificial Intelligence and Machine Learning' },
  { id: 3, name: 'AIDS', description: 'Artificial Intelligence and Data Science' },
  { id: 4, name: 'CS', description: 'Computer Science (Cyber Security)' },
  { id: 5, name: 'IT', description: 'Information Technology' },
  { id: 6, name: 'EEE', description: 'Electrical and Electronics Engineering' },
  { id: 7, name: 'ECE', description: 'Electronics and Communication Engineering' },
  { id: 8, name: 'MECH', description: 'Mechanical Engineering' },
  { id: 9, name: 'CIVIL', description: 'Civil Engineering' }
];

export const useDepartments = () => {
  const [departments, setDepartmentsState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {
        console.error('Error parsing departments:', e);
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDepartments));
    return defaultDepartments;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const validDepartments = parsed.filter(d => typeof d === 'object' && d !== null && d.name);
          setDepartmentsState(validDepartments);
        } catch (e) {
          console.error('Error parsing departments:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('departmentsUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('departmentsUpdated', handleStorageChange);
    };
  }, []);

  const setDepartments = (newDepartments) => {
    let updated;
    if (typeof newDepartments === 'function') {
      updated = newDepartments(departments);
    } else {
      updated = newDepartments;
    }
    setDepartmentsState(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('departmentsUpdated'));
  };

  const addDepartment = (department) => {
    const newDepartment = { ...department, id: Date.now() };
    setDepartments(prev => [newDepartment, ...prev]);
  };

  const updateDepartment = (id, updatedFields) => {
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...updatedFields } : d));
  };

  const deleteDepartment = (id) => {
    setDepartments(prev => prev.filter(d => d.id !== id));
  };

  return { departments, setDepartments, addDepartment, updateDepartment, deleteDepartment };
};
