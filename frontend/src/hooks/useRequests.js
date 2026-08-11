import { useState, useEffect } from 'react';

const STORAGE_KEY = 'svcet_requests';

export const useRequests = () => {
  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing requests', e);
        return [];
      }
    }
    return [];
  });

  const saveRequests = (updater) => {
    setRequests(prev => {
      const newRequests = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRequests));
      window.dispatchEvent(new Event('svcet_requests_updated'));
      return newRequests;
    });
  };

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.type === 'svcet_requests_updated') {
        // Handled by dispatch
      }
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setRequests(JSON.parse(saved));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('svcet_requests_updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('svcet_requests_updated', handleStorageChange);
    };
  }, []);

  const addRequest = (newRequest) => {
    const request = {
      ...newRequest,
      id: `REQ-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
      status: newRequest.status || 'Submitted', 
      currentStage: newRequest.workflow ? newRequest.workflow[0] : 'Review',
      timeline: [
        {
          stage: 'Submitted',
          action: newRequest.status === 'Draft' ? 'Draft Saved' : 'Request Created',
          user: newRequest.submittedBy || 'System',
          timestamp: Date.now(),
          remarks: 'Initial Submission'
        }
      ],
      isRead: false,
      isStarred: false,
      trash: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    saveRequests(prev => [request, ...prev]);
    
    if (request.status !== 'Draft') {
      window.dispatchEvent(new CustomEvent('newRequestAlert', { detail: request }));
    }
    
    return request;
  };

  const updateRequestStatus = (id, newStatus, currentStage, nextStage, userDetails, remarks = '') => {
    saveRequests(prev => prev.map(req => {
      if (req.id === id) {
        const newTimeline = [...(req.timeline || [])];
        newTimeline.push({
          stage: currentStage,
          action: newStatus,
          user: userDetails,
          timestamp: Date.now(),
          remarks: remarks
        });
        
        return {
          ...req,
          status: newStatus,
          currentStage: nextStage,
          assignedTo: nextStage === 'Completed' ? 'None' : nextStage,
          timeline: newTimeline,
          reply: remarks,
          isRead: false,
          updatedAt: Date.now()
        };
      }
      return req;
    }));
  };

  const addCommentToRequest = (id, commentStr, userDetails) => {
    saveRequests(prev => prev.map(req => {
      if (req.id === id) {
        const newTimeline = [...(req.timeline || [])];
        newTimeline.push({
          stage: req.currentStage,
          action: 'Comment Added',
          user: userDetails,
          timestamp: Date.now(),
          remarks: commentStr
        });
        return { ...req, timeline: newTimeline, updatedAt: Date.now() };
      }
      return req;
    }));
  };

  const deleteRequests = (ids) => {
    saveRequests(prev => prev.filter(req => !ids.includes(req.id)));
  };

  const moveToTrash = (ids) => {
    saveRequests(prev => prev.map(req => 
      ids.includes(req.id) ? { ...req, trash: true } : req
    ));
  };

  const markAsRead = (ids) => {
    saveRequests(prev => prev.map(req => 
      ids.includes(req.id) ? { ...req, isRead: true } : req
    ));
  };

  const toggleStar = (id) => {
    saveRequests(prev => prev.map(req => 
      req.id === id ? { ...req, isStarred: !req.isStarred } : req
    ));
  };

  return {
    requests,
    addRequest,
    updateRequestStatus,
    addCommentToRequest,
    deleteRequests,
    moveToTrash,
    markAsRead,
    toggleStar
  };
};
