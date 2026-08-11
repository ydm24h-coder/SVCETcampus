import { useState, useEffect } from 'react';

const STORAGE_KEY = 'svcet_students';

// We provide one demo student by default so the login page doesn't break if localStorage is cleared.
const defaultStudents = [];

export const useStudents = () => {
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
    window.addEventListener('studentsUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('studentsUpdated', handleStorageChange);
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
    window.dispatchEvent(new Event('studentsUpdated'));
  };

  const addStudent = (studentData) => {
    const newStudent = {
      ...studentData,
      id: Date.now()
    };
    setStudents(prev => [newStudent, ...prev]);
  };



  const deleteStudent = (id) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const updateStudent = (id, updatedData) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updatedData } : s));
  };

  const bulkUpdateStudents = (ids, updatedData) => {
    setStudents(prev => prev.map(s => ids.includes(s.id) ? { ...s, ...updatedData } : s));
  };

  const applyBulkUpdates = (updatesArray) => {
    setStudentsState(prev => {
      const updated = prev.map(student => {
        const update = updatesArray.find(u => u.id === student.id);
        if (update) {
          return { ...student, ...update.data };
        }
        return student;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    window.dispatchEvent(new Event('studentsUpdated'));
  };

  const bulkDeleteStudents = (ids) => {
    setStudentsState(prev => {
      const updated = prev.filter(s => !ids.includes(s.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    window.dispatchEvent(new Event('studentsUpdated'));
  };

  const bulkAddStudents = (studentsArray) => {
    setStudentsState(prev => {
      // Create new students with unique IDs based on timestamp + index
      const timestamp = Date.now();
      const newStudents = studentsArray.map((student, index) => ({
        ...student,
        id: timestamp + index
      }));
      
      const updated = [...newStudents, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    window.dispatchEvent(new Event('studentsUpdated'));
  };

  // Auth helper
  const getStudentByCredentials = (registerNumber, password) => {
    return students.find(s => s.registerNumber === registerNumber && s.password === password);
  };

  return { students, addStudent, deleteStudent, updateStudent, bulkUpdateStudents, applyBulkUpdates, bulkDeleteStudents, bulkAddStudents, getStudentByCredentials };
};
