import { useState, useEffect } from 'react';

const STORAGE_KEY = 'svcet_materials';

const defaultMaterials = [];

export const useMaterials = () => {
  const [materials, setMaterialsState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMaterials));
    return defaultMaterials;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMaterialsState(JSON.parse(saved));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('materialsUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('materialsUpdated', handleStorageChange);
    };
  }, []);

  const setMaterials = (newMaterials) => {
    let updated;
    if (typeof newMaterials === 'function') {
      updated = newMaterials(materials);
    } else {
      updated = newMaterials;
    }
    setMaterialsState(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('materialsUpdated'));
  };

  const addMaterial = (material) => {
    const newMat = {
      id: Date.now(), // default fallback
      ...material,    // this will now correctly preserve material.id if it was passed in!
    };
    setMaterials(prev => [newMat, ...prev]);
  };

  const updateMaterial = (id, updatedFields) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...updatedFields } : m));
  };

  const deleteMaterial = (id) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  return { materials, setMaterials, addMaterial, updateMaterial, deleteMaterial };
};
