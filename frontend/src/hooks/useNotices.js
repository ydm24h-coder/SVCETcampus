import { useState, useEffect } from 'react';

const STORAGE_KEY = 'svcet_notices';

const defaultNotices = [];

export const useNotices = () => {
  const [notices, setNoticesState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultNotices));
    return defaultNotices;
  });

  useEffect(() => {
    const handleStorageChange = (e) => {
      // Check if it's our specific event, or a native storage event
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setNoticesState(prev => {
          if (parsed.length > prev.length) {
            // A new notice was added
            const newNotice = parsed[0]; // Newest is at index 0
            window.dispatchEvent(new CustomEvent('newNotificationAlert', { detail: newNotice }));
          }
          return parsed;
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('noticesUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('noticesUpdated', handleStorageChange);
    };
  }, []);

  const setNotices = (newNotices) => {
    let updated;
    if (typeof newNotices === 'function') {
      updated = newNotices(notices);
    } else {
      updated = newNotices;
    }
    setNoticesState(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('noticesUpdated'));
  };

  const addNotice = (notice) => {
    const newNotice = {
      ...notice,
      id: Date.now(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    setNotices(prev => [newNotice, ...prev]);
    // Dispatch alert for the same window (storage event only fires for OTHER windows)
    window.dispatchEvent(new CustomEvent('newNotificationAlert', { detail: newNotice }));
  };

  const updateNotice = (id, updatedFields) => {
    setNotices(prev => prev.map(n => n.id === id ? { ...n, ...updatedFields } : n));
  };

  const deleteNotice = (id) => {
    setNotices(prev => prev.filter(n => n.id !== id));
  };

  return { notices, setNotices, addNotice, updateNotice, deleteNotice };
};
