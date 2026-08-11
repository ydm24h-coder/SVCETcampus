import { useState, useEffect } from 'react';

const STORAGE_KEY = 'svcet_feedback';

export const useFeedback = () => {
  const [feedbacks, setFeedbacksState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY || e.type === 'feedbackUpdated') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setFeedbacksState(JSON.parse(saved));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('feedbackUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('feedbackUpdated', handleStorageChange);
    };
  }, []);

  const setFeedbacks = (newFeedbacks) => {
    let updated;
    if (typeof newFeedbacks === 'function') {
      updated = newFeedbacks(feedbacks);
    } else {
      updated = newFeedbacks;
    }
    setFeedbacksState(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('feedbackUpdated'));
  };

  const addFeedback = (feedback) => {
    const newFeedback = {
      ...feedback,
      id: Date.now(),
      status: 'Pending',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    setFeedbacks(prev => [newFeedback, ...prev]);
  };

  const updateFeedbackStatus = (id, newStatus) => {
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
  };

  const deleteFeedback = (id) => {
    setFeedbacks(prev => prev.filter(f => f.id !== id));
  };

  return { feedbacks, addFeedback, updateFeedbackStatus, deleteFeedback };
};
