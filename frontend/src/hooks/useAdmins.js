import { useState, useEffect } from 'react';

const STORAGE_KEY = 'svcet_admins';

// Default super admin
const defaultAdmins = [
  {
    id: 'admin_0',
    name: 'Super Admin',
    email: 'chandrumani1825@gmail.com',
    password: 'c#An@24M',
    role: 'Super Admin',
    createdAt: new Date().toISOString()
  }
];

export const useAdmins = () => {
  const [admins, setAdminsState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAdmins));
    return defaultAdmins;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setAdminsState(JSON.parse(saved));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('adminsUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('adminsUpdated', handleStorageChange);
    };
  }, []);

  const setAdmins = (newAdmins) => {
    let updated;
    if (typeof newAdmins === 'function') {
      updated = newAdmins(admins);
    } else {
      updated = newAdmins;
    }
    setAdminsState(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('adminsUpdated'));
  };

  const addAdmin = (adminData) => {
    const newAdmin = {
      ...adminData,
      id: `admin_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setAdmins(prev => [...prev, newAdmin]);
  };

  const deleteAdmin = (id) => {
    // Prevent deleting the super admin
    if (id === 'admin_0') return false;
    setAdmins(prev => prev.filter(a => a.id !== id));
    return true;
  };

  const updateAdmin = (id, updatedData) => {
    setAdmins(prev => prev.map(a => a.id === id ? { ...a, ...updatedData } : a));
    return true;
  };

  return { admins, addAdmin, updateAdmin, deleteAdmin };
};
