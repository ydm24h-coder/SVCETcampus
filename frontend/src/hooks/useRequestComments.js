import { useState, useEffect } from 'react';

const STORAGE_KEY = 'svcet_request_comments';

export const useRequestComments = (requestId) => {
  const [comments, setComments] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing request comments', e);
      }
    }
    return [];
  });

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.type === 'svcet_request_comments_updated') {
        // handled internally by saveComments if in same window
      }
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setComments(JSON.parse(saved));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('svcet_request_comments_updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('svcet_request_comments_updated', handleStorageChange);
    };
  }, []);

  const saveComments = (updater) => {
    setComments(prev => {
      const newComments = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newComments));
      window.dispatchEvent(new Event('svcet_request_comments_updated'));
      return newComments;
    });
  };

  const addComment = (requestId, userDetails, message, attachment = null) => {
    const newComment = {
      id: `COM-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
      requestId,
      user: userDetails,
      message,
      attachment,
      timestamp: Date.now()
    };
    saveComments(prev => [...prev, newComment]);
    return newComment;
  };

  // Filter comments for the current request
  const requestComments = comments.filter(c => c.requestId === requestId).sort((a, b) => a.timestamp - b.timestamp);

  return {
    comments: requestComments,
    addComment
  };
};
