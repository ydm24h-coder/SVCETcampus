import { useState, useEffect } from 'react';

const STORAGE_KEY = 'svcet_courses';

const defaultCourses = [
  {
    id: 1,
    name: 'Full Stack Web Development (Python)',
    code: 'FSD-PY',
    dept: 'Computer Science',
    credits: 4,
    status: 'Active',
    roadmap: [
      { id: 101, title: 'Module 1: Introduction to Web Dev', description: 'HTML, CSS, and basic JavaScript' },
      { id: 102, title: 'Module 2: Python Fundamentals', description: 'Core Python concepts and data structures' },
      { id: 103, title: 'Module 3: Django Framework', description: 'Building backend APIs and views with Django' },
    ]
  },
  {
    id: 2,
    name: 'Full Stack Web Development (Java)',
    code: 'FSD-JV',
    dept: 'Computer Science',
    credits: 4,
    status: 'Active',
    roadmap: []
  },
  {
    id: 3,
    name: 'Data Science & Machine Learning',
    code: 'DS-ML',
    dept: 'Artificial Intelligence',
    credits: 3,
    status: 'Active',
    roadmap: []
  }
];

export const useCourses = () => {
  const [courses, setCoursesState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCourses));
    return defaultCourses;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCoursesState(JSON.parse(saved));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('coursesUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('coursesUpdated', handleStorageChange);
    };
  }, []);

  const setCourses = (newCourses) => {
    let updated;
    if (typeof newCourses === 'function') {
      updated = newCourses(courses);
    } else {
      updated = newCourses;
    }
    setCoursesState(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('coursesUpdated'));
  };

  const addCourse = (course) => {
    const newCourse = { ...course, id: Date.now() };
    setCourses(prev => [newCourse, ...prev]);
  };

  const updateCourse = (id, updatedFields) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
  };

  const deleteCourse = (id) => {
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  return { courses, setCourses, addCourse, updateCourse, deleteCourse };
};
