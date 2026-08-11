import React, { useState } from 'react';
import { Bell, Check, Clock, AlertCircle, FileText, Calendar, MapPin, User, Paperclip } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useNotices } from '@/hooks/useNotices';
import { useMessages } from '@/hooks/useMessages';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import TimetableModal from '@/components/TimetableModal';
import autoTable from 'jspdf-autotable';

export const NotificationCenter = () => {
  const { notices } = useNotices();
  const { messages, markAsRead: markMessageAsRead } = useMessages();
  const navigate = useNavigate();

  // Create local read state, persisting to localStorage so it is saved instantly
  const [readIds, setReadIds] = useState(() => {
    const saved = localStorage.getItem('svcet_read_notices');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  // State for the full view popup
  const [selectedNotif, setSelectedNotif] = useState(null);
  
  // State for History Modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' or 'unread'

  const currentUser = JSON.parse(localStorage.getItem('svcet_session_student')) || 
                      JSON.parse(localStorage.getItem('svcet_session_faculty')) || 
                      { name: 'Demo User' };
  
  const filteredNotices = notices.filter(n => {
    // If targeted at a specific student
    if (n.targetStudent) {
      return n.targetStudent === currentUser?.name;
    }
    // If it's a broadcast notice, check audience targeting if student
    if (currentUser?.role === 'Student') {
      const targetAudience = n.targetAudience || 'Both';
      const targetDept = n.targetDepartment || 'All';
      const targetYear = n.targetYear || 'All';
      
      const isTargetAudience = targetAudience === 'Both' || targetAudience === 'Student';
      const isTargetDept = String(targetDept).toLowerCase() === 'all' || String(targetDept).toLowerCase() === String(currentUser?.department || '').toLowerCase();
      const isTargetYear = String(targetYear).toLowerCase() === 'all' || String(targetYear).toLowerCase() === String(currentUser?.year || '').toLowerCase();
      return isTargetAudience && isTargetDept && isTargetYear;
    }
    return true; // For faculty or legacy notices without target fields
  });

  const historyNotices = filteredNotices.filter(n => {
    const matchesSearch = (n?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (n?.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || (filterType === 'unread' && !readIds.has(n.id));
    return matchesSearch && matchesFilter;
  });

  const unreadMessages = messages.filter(m => m.receiverName === currentUser.name && !m.isRead);
  const unreadCount = filteredNotices.filter(n => !readIds.has(n.id)).length + unreadMessages.length;

  const updateReadIds = (newSet) => {
    setReadIds(newSet);
    localStorage.setItem('svcet_read_notices', JSON.stringify(Array.from(newSet)));
  };

  const markAllRead = () => {
    updateReadIds(new Set(filteredNotices.map(n => n.id)));
    if (unreadMessages.length > 0) {
      markMessageAsRead(unreadMessages.map(m => m.id));
    }
  };

  const handleNotificationClick = (notif) => {
    if (notif.isMessageNotification) {
      markMessageAsRead([notif.id]);
      if (currentUser.role === 'Student') {
        navigate('/student/messages');
      } else {
        navigate('/faculty/messages');
      }
      return;
    }
    // Mark as read when clicked and save instantly
    const newSet = new Set(readIds);
    newSet.add(notif.id);
    updateReadIds(newSet);
    setSelectedNotif(notif);
  };

  
  
  return (
    <>
      <Popover>
        <PopoverTrigger className="relative p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-neutral-900"></span>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 mr-4 mt-2 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-xl" align="end">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-blue-600 dark:text-blue-400 hover:bg-transparent hover:underline" onClick={markAllRead}>
                Mark all as read
              </Button>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {filteredNotices.length > 0 || unreadMessages.length > 0 ? (
              <div className="flex flex-col">
                {unreadMessages.map(msg => (
                  <div 
                    key={`msg-${msg.id}`} 
                    onClick={() => handleNotificationClick({ ...msg, isMessageNotification: true })}
                    className={`p-4 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors cursor-pointer bg-indigo-50/50 dark:bg-indigo-900/10`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 bg-indigo-500`} />
                      <div>
                        <p className={`text-sm font-semibold text-neutral-900 dark:text-white`}>
                          New Message from {msg.senderName}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1 leading-snug line-clamp-2">{msg.content}</p>
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
                          <Clock className="w-3 h-3" /> {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Direct Message
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredNotices.map(notif => {
                  const isRead = readIds.has(notif.id);
                  return (
                  <div 
                    key={notif.id} 
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors cursor-pointer ${!isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                      <div>
                        <p className={`text-sm ${!isRead ? 'font-semibold text-neutral-900 dark:text-white' : 'font-medium text-neutral-700 dark:text-neutral-300'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1 leading-snug line-clamp-2">{notif.content}</p>
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
                          <Clock className="w-3 h-3" /> {notif.date} • {notif.authorName}
                        </div>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            ) : (
              <div className="p-8 text-center text-neutral-500">
                <Bell className="w-8 h-8 mx-auto mb-3 text-neutral-300 dark:text-neutral-700" />
                <p className="text-sm">You're all caught up!</p>
              </div>
            )}
          </div>
          <div className="p-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
            <Button variant="ghost" className="w-full text-xs font-medium h-8" onClick={() => setIsHistoryOpen(true)}>
              View All History
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* History Modal */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 p-0 overflow-hidden">
          <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-6 h-6 text-indigo-500" />
                  Notification History
                </div>
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={markAllRead} className="text-xs">
                    <Check className="w-4 h-4 mr-1" /> Mark all read
                  </Button>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="flex gap-4 mt-6">
              <Input 
                placeholder="Search notifications..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <div className="flex bg-neutral-100 dark:bg-neutral-900 rounded-lg p-1">
                <button 
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filterType === 'all' ? 'bg-white dark:bg-neutral-800 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilterType('unread')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filterType === 'unread' ? 'bg-white dark:bg-neutral-800 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                >
                  Unread
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 bg-neutral-50/50 dark:bg-neutral-900/10">
            {historyNotices.length > 0 ? (
              <div className="flex flex-col gap-2 p-4">
                {historyNotices.map(notif => {
                  const isRead = readIds.has(notif.id);
                  return (
                    <div 
                      key={notif.id} 
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-5 rounded-xl border transition-all cursor-pointer ${
                        !isRead 
                          ? 'bg-white dark:bg-neutral-900 border-blue-200 dark:border-blue-900/50 shadow-sm hover:shadow-md' 
                          : 'bg-white/60 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 hover:bg-white dark:hover:bg-neutral-900'
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className={`mt-1 shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${!isRead ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                          <Bell className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-1">
                            <h4 className={`text-base ${!isRead ? 'font-bold text-neutral-900 dark:text-white' : 'font-semibold text-neutral-700 dark:text-neutral-300'}`}>
                              {notif.title}
                            </h4>
                            <span className="text-xs text-neutral-400 whitespace-nowrap flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3" /> {notif.date}
                            </span>
                          </div>
                          <p className={`text-sm mb-2 ${!isRead ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-500'}`}>
                            {notif.content}
                          </p>
                          <div className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-[10px] text-neutral-600 dark:text-neutral-300">
                              {notif.authorName?.substring(0, 1) || 'A'}
                            </span>
                            {notif.authorName} {notif.authorRole ? `(${notif.authorRole})` : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-neutral-500">
                <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">No notifications found</h3>
                <p className="text-sm">Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Notification Popup Dialog */}
      <Dialog open={!!selectedNotif} onOpenChange={(open) => !open && setSelectedNotif(null)}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2 text-xs text-neutral-500">
              <Clock className="w-4 h-4" />
              <span>{selectedNotif?.date}</span>
              <span className="mx-1">•</span>
              <span className="font-medium text-indigo-600 dark:text-indigo-400">{selectedNotif?.authorName}</span>
            </div>
            <DialogTitle className="text-xl leading-tight">{selectedNotif?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
              {selectedNotif?.content}
            </p>
            {selectedNotif?.attachment && !selectedNotif?.isTimetable && (
              <div className="mt-4">
                <Button variant="secondary" size="sm" onClick={() => handleDownload(selectedNotif.attachment, selectedNotif.attachmentName)} className="flex items-center text-indigo-600 dark:text-indigo-400">
                  <Paperclip className="w-4 h-4 mr-2" /> Download Attachment
                </Button>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-between">
            {selectedNotif?.isTimetable && (
              <Button onClick={() => exportScheduleToPDF(selectedNotif)} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center">
                <FileText className="w-4 h-4 mr-2" /> 
                {selectedNotif.scheduleData?.attachment ? "Download Attached Document" : "Download Timetable PDF"}
              </Button>
            )}
            <Button onClick={() => setSelectedNotif(null)} className="bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700 ml-auto">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
