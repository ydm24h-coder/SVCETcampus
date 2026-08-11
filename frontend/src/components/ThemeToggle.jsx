import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

const getActiveUserKey = () => {
  const admin = JSON.parse(localStorage.getItem('svcet_session_admin'));
  const faculty = JSON.parse(localStorage.getItem('svcet_session_faculty'));
  const student = JSON.parse(localStorage.getItem('svcet_session_student'));
  
  if (admin) return `theme_${admin.name}`;
  if (faculty) return `theme_${faculty.name}`;
  if (student) return `theme_${student.name}`;
  return 'theme_default';
};

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    const userKey = getActiveUserKey();
    return localStorage.getItem(userKey) || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const userKey = getActiveUserKey();
    localStorage.setItem(userKey, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
