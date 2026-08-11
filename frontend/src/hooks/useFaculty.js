import { useState, useEffect } from 'react';

const STORAGE_KEY = 'svcet_faculty';

const defaultFaculty = [];

export const useFaculty = () => {
  const [faculty, setFacultyState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultFaculty));
    return defaultFaculty;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setFacultyState(JSON.parse(saved));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('facultyUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('facultyUpdated', handleStorageChange);
    };
  }, []);

  const setFaculty = (newFaculty) => {
    let updated;
    if (typeof newFaculty === 'function') {
      updated = newFaculty(faculty);
    } else {
      updated = newFaculty;
    }
    setFacultyState(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('facultyUpdated'));
  };

  const addFaculty = (facultyData) => {
    const newFac = {
      ...facultyData,
      id: Date.now()
    };
    setFaculty(prev => [newFac, ...prev]);
  };

  const deleteFaculty = (id) => {
    setFaculty(prev => prev.filter(f => f.id !== id));
  };

  const updateFaculty = (id, updatedData) => {
    setFaculty(prev => prev.map(f => f.id === id ? { ...f, ...updatedData } : f));
  };

  const applyBulkUpdates = (updatesArray) => {
    setFacultyState(prev => {
      const updated = prev.map(fac => {
        const update = updatesArray.find(u => u.id === fac.id);
        if (update) {
          return { ...fac, ...update.data };
        }
        return fac;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    window.dispatchEvent(new Event('facultyUpdated'));
  };

  const bulkDeleteFaculty = (ids) => {
    setFacultyState(prev => {
      const updated = prev.filter(f => !ids.includes(f.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    window.dispatchEvent(new Event('facultyUpdated'));
  };

  const bulkAddFaculty = (facultyArray) => {
    setFacultyState(prev => {
      const timestamp = Date.now();
      const newFaculty = facultyArray.map((fac, index) => ({
        ...fac,
        id: timestamp + index
      }));
      
      const updated = [...newFaculty, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    window.dispatchEvent(new Event('facultyUpdated'));
  };

  return { faculty, addFaculty, deleteFaculty, updateFaculty, applyBulkUpdates, bulkDeleteFaculty, bulkAddFaculty };
};
