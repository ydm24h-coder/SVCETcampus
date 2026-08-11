import React, { useState } from 'react';
import { Calendar, Download, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import TimetableViewer from './TimetableViewer';

const TimetablePreview = ({ notice }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!notice || !notice.scheduleData) return null;

  return (
    <>
      <div 
        onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
        className="mt-4 flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white/50 dark:bg-neutral-900/30 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors shadow-sm"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg shrink-0">
            <Table className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate text-neutral-800 dark:text-neutral-200">
              {notice.title || 'Timetable Schedule'}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-medium">
              Click to view timetable
            </span>
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-5xl h-[85vh] p-0 flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 rounded-2xl" onClick={(e) => e.stopPropagation()}>
          <DialogTitle className="sr-only">Timetable Viewer</DialogTitle>
          
          <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-sm shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <Table className="w-5 h-5 text-indigo-500 shrink-0" />
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                {notice.title || 'Timetable Schedule'}
              </span>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-4 md:p-8 bg-neutral-50 dark:bg-neutral-950/50">
             <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm">
               <TimetableViewer scheduleData={notice.scheduleData} title={notice.title} />
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TimetablePreview;
