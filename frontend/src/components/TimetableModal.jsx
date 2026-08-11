import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Paperclip } from 'lucide-react';
import TimetableViewer from './TimetableViewer';

const TimetableModal = ({ selectedNotif, onClose }) => {
  if (!selectedNotif) return null;

  const handleDownload = (attachment, attachmentName) => {
    if (!attachment) return;
    const link = document.createElement("a");
    link.href = attachment;
    link.download = attachmentName || "Notice_Attachment";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scheduleData = selectedNotif.scheduleData;
  const isTimetable = selectedNotif.isTimetable && scheduleData;

  return (
    <Dialog open={!!selectedNotif} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${isTimetable ? 'max-w-4xl' : 'sm:max-w-[500px]'} bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 max-h-[90vh] flex flex-col overflow-hidden`}>
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-2 mb-2 text-xs text-neutral-500">
            <Clock className="w-4 h-4" />
            <span>{selectedNotif.date}</span>
            <span className="mx-1">•</span>
            <span className="font-medium text-indigo-600 dark:text-indigo-400">{selectedNotif.authorName || selectedNotif.sender}</span>
          </div>
          <DialogTitle className="text-xl leading-tight">{selectedNotif.title}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 overflow-y-auto flex-1 pr-2 space-y-6">
          <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
            {selectedNotif.content}
          </p>
          
          {selectedNotif.attachment && !isTimetable && (
            <div>
              <Button variant="secondary" size="sm" onClick={() => handleDownload(selectedNotif.attachment, selectedNotif.attachmentName)} className="flex items-center text-indigo-600 dark:text-indigo-400">
                <Paperclip className="w-4 h-4 mr-2" /> Download Attachment
              </Button>
            </div>
          )}
          
          {isTimetable && (
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
              <TimetableViewer scheduleData={scheduleData} title={selectedNotif.title} />
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end shrink-0 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <Button onClick={onClose} className="bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimetableModal;
