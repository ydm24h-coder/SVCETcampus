import React, { useState } from 'react';
import { Bell, FileText, Calendar, Clock, User, MapPin, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AttachmentPreview from '@/components/AttachmentPreview';
import { useNotices } from '@/hooks/useNotices';
import jsPDF from 'jspdf';
import TimetablePreview from '@/components/TimetablePreview';
import autoTable from 'jspdf-autotable';

const StudentNoticesPage = () => {
  const { notices } = useNotices();
  const sessionUser = JSON.parse(localStorage.getItem('svcet_session_student')) || {};

  const studentNotices = (notices || []).filter(n => {
    if (n.targetStudent) return n.targetStudent === sessionUser?.name;
    
    const targetAudience = n.targetAudience || 'Both';
    const targetDept = n.targetDepartment || 'All';
    const targetYear = n.targetYear || 'All';

    const isTargetAudience = targetAudience === 'Both' || targetAudience === 'Student';
    const isTargetDept = String(targetDept).toLowerCase() === 'all' || String(targetDept).toLowerCase() === String(sessionUser?.department || '').toLowerCase();
    const isTargetYear = String(targetYear).toLowerCase() === 'all' || String(targetYear).toLowerCase() === String(sessionUser?.year || '').toLowerCase();
    
    return isTargetAudience && isTargetDept && isTargetYear;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'Medium': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    }
  };

  
  

  const handleDownload = (attachment, attachmentName) => {
    if (!attachment) return;
    const link = document.createElement("a");
    link.href = attachment;
    link.download = attachmentName || "Notice_Attachment";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notice Board</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Stay up to date with the latest announcements.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        {studentNotices.length === 0 ? (
          <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
            <CardContent className="flex flex-col items-center justify-center py-12 text-neutral-500">
              <Bell className="w-12 h-12 mb-4 text-neutral-300 dark:text-neutral-700" />
              <p>No notices available for you right now.</p>
            </CardContent>
          </Card>
        ) : (
          studentNotices.map((notice) => (
            <Card key={notice.id} className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-0">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">{notice.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="font-medium bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">From: {notice.sender}</span>
                      <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {notice.date}</span>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border self-start sm:self-auto ${getPriorityColor(notice.priority)}`}>
                    {notice.priority} Priority
                  </div>
                </div>

                <p className="text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">
                  {notice.content}
                </p>

                {notice.attachment && !notice.isTimetable && (
                  <AttachmentPreview 
                    attachment={notice.attachment} 
                    attachmentName={notice.attachmentName} 
                    onDownload={handleDownload} 
                  />
                )}                {notice.isTimetable && notice.scheduleData && (
                  <TimetablePreview notice={notice} />
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentNoticesPage;
