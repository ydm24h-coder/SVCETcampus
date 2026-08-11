import { useState, useEffect } from 'react';

const STORAGE_KEY = 'svcet_groups';

export const useGroups = () => {
  const [groups, setGroupsState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setGroupsState(JSON.parse(saved));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('groupsUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('groupsUpdated', handleStorageChange);
    };
  }, []);

  const setGroups = (newGroups) => {
    let updated;
    if (typeof newGroups === 'function') {
      updated = newGroups(groups);
    } else {
      updated = newGroups;
    }
    setGroupsState(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('groupsUpdated'));
  };

  const createGroup = (groupData) => {
    const newGroup = {
      ...groupData,
      id: `group_${Date.now()}`,
      isGroup: true,
      createdAt: new Date().toISOString()
    };
    setGroups(prev => [...prev, newGroup]);
    return newGroup;
  };

  return {
    groups,
    createGroup
  };
};
