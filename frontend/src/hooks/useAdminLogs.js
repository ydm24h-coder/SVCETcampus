import { useState, useEffect } from 'react';

const STORAGE_KEY = 'svcet_admin_logs';

export const useAdminLogs = () => {
  const [logs, setLogsState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return [];
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setLogsState(JSON.parse(saved));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('adminLogsUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('adminLogsUpdated', handleStorageChange);
    };
  }, []);

  const logAction = (adminName, actionMessage) => {
    const newLog = {
      id: Date.now().toString(),
      adminName: adminName || 'System',
      action: actionMessage,
      timestamp: new Date().toISOString()
    };

    // Use raw local storage directly to avoid stale state issues in fast successive calls
    const saved = localStorage.getItem(STORAGE_KEY);
    const currentLogs = saved ? JSON.parse(saved) : [];
    const updatedLogs = [newLog, ...currentLogs];
    
    // Keep only last 100 logs to prevent bloat
    if (updatedLogs.length > 100) {
      updatedLogs.length = 100;
    }

    setLogsState(updatedLogs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
    window.dispatchEvent(new Event('adminLogsUpdated'));
  };

  const clearLogs = () => {
    setLogsState([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new Event('adminLogsUpdated'));
  };

  return { logs, logAction, clearLogs };
};
