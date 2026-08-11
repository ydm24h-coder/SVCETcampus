import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, MessageSquare, FileText } from 'lucide-react';
import { playMacNotificationSound } from '@/utils/audio';

const GlobalNotification = () => {
  const [notification, setNotification] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const showNotification = (payload) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setNotification(payload);
      playMacNotificationSound();
      
      timerRef.current = setTimeout(() => {
        setNotification(null);
      }, 5000);
    };

    const handleNewAlert = (e) => {
      const notice = e.detail;
      const sessionStudent = JSON.parse(localStorage.getItem('svcet_session_student'));
      const sessionFaculty = JSON.parse(localStorage.getItem('svcet_session_faculty'));
      const sessionAdmin = JSON.parse(localStorage.getItem('svcet_session_admin'));
      
      const currentUser = sessionStudent || sessionFaculty || sessionAdmin || {};
      const role = sessionStudent ? 'Student' : (sessionFaculty ? 'Faculty' : (sessionAdmin ? 'Admin' : 'Unknown'));
      const currentUserName = currentUser.name || 'Admin';
      
      // Do not notify the author who just created it, except for a generic success or if desired.
      // But typically, we just want to ensure privacy across other users.
      // Let's filter out if the current user is not the target audience.
      if (role === 'Admin' || role === 'Super Admin' || notice.authorName === currentUserName) {
        showNotification({ type: 'notice', data: notice });
        return;
      }
      
      if (notice.targetStudent && notice.targetStudent !== currentUserName) return;

      const targetAudience = notice.targetAudience || 'Both';
      const targetDept = notice.targetDepartment || 'All';
      const targetYear = notice.targetYear || 'All';

      const isTargetAudience = targetAudience === 'Both' || targetAudience === role;
      const isTargetDept = String(targetDept).toLowerCase() === 'all' || String(targetDept).toLowerCase() === String(currentUser?.department || '').toLowerCase();
      const isTargetYear = String(targetYear).toLowerCase() === 'all' || String(targetYear).toLowerCase() === String(currentUser?.year || '').toLowerCase();
      
      if (isTargetAudience && isTargetDept && isTargetYear) {
        showNotification({ type: 'notice', data: notice });
      }
    };

    const handleNewMessage = (e) => {
      const msg = e.detail;
      const currentUser = JSON.parse(localStorage.getItem('svcet_session_student')) || 
                          JSON.parse(localStorage.getItem('svcet_session_faculty')) || 
                          JSON.parse(localStorage.getItem('svcet_session_admin')) || {};
      const currentUserName = currentUser.name || 'Admin';
      
      const groups = JSON.parse(localStorage.getItem('svcet_groups')) || [];
      const isMyGroup = groups.some(g => g.name === msg.receiverName && g.members.includes(currentUserName));

      // Notify if I am the direct receiver OR if it's a group I belong to (and I didn't send it)
      if (msg.senderName === currentUserName) return; // Don't notify myself for messages I sent
      if (msg.receiverName !== currentUserName && !isMyGroup) return;
      
      showNotification({ type: 'message', data: msg });
    };

    const handleNewRequest = (e) => {
      const req = e.detail;
      const currentUser = JSON.parse(localStorage.getItem('svcet_session_student')) || 
                          JSON.parse(localStorage.getItem('svcet_session_faculty')) || 
                          JSON.parse(localStorage.getItem('svcet_session_admin')) || {};
      
      const currentUserName = currentUser.name || 'Admin';
      
      // Prevent notifying the sender
      if (req.submittedBy === currentUserName) return;

      const isAdmin = currentUserName === 'Super Admin' || currentUserName === 'Admin';
      const isRecipient = 
        req.to === currentUserName || 
        req.to === currentUser.email || 
        req.to === currentUser.registerNumber || 
        req.to === currentUser.facultyId ||
        (req.to === 'Principal' && isAdmin);

      if (isRecipient) {
        showNotification({ 
          type: 'request', 
          data: { 
            title: `New Request from ${req.submittedBy}`, 
            content: req.subject 
          } 
        });
      }
    };

    window.addEventListener('newNotificationAlert', handleNewAlert);
    window.addEventListener('newMessageAlert', handleNewMessage);
    window.addEventListener('newRequestAlert', handleNewRequest);
    
    return () => {
      window.removeEventListener('newNotificationAlert', handleNewAlert);
      window.removeEventListener('newMessageAlert', handleNewMessage);
      window.removeEventListener('newRequestAlert', handleNewRequest);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-6 right-6 z-[100] w-80 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-4 cursor-pointer"
          onClick={() => setNotification(null)}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setNotification(null); }}
            className="absolute top-2 right-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex gap-3">
            {notification.type === 'message' ? (
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 animate-pulse" />
              </div>
            ) : notification.type === 'request' ? (
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 animate-pulse" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
            )}
            
            <div>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-1 pr-4">
                {notification.type === 'message' 
                  ? `New Message from ${notification.data.senderName}` 
                  : notification.type === 'request'
                    ? notification.data.title
                    : notification.data.title}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                {notification.data.content}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalNotification;
