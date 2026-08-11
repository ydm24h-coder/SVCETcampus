import React from 'react';
import { Clock, CheckCircle2, XCircle, FileText, MessageSquare } from 'lucide-react';

const RequestTimeline = ({ timeline = [], currentStage }) => {
  return (
    <div className="relative border-l border-neutral-200 dark:border-neutral-700 ml-3 md:ml-4 space-y-6 pb-4">
      {timeline.map((event, index) => {
        const isLast = index === timeline.length - 1;
        let Icon = Clock;
        let bgColor = 'bg-neutral-100 dark:bg-neutral-800';
        let iconColor = 'text-neutral-500';

        if (event.action === 'Approved') {
          Icon = CheckCircle2;
          bgColor = 'bg-emerald-100 dark:bg-emerald-900/30';
          iconColor = 'text-emerald-500';
        } else if (event.action === 'Rejected') {
          Icon = XCircle;
          bgColor = 'bg-red-100 dark:bg-red-900/30';
          iconColor = 'text-red-500';
        } else if (event.action === 'Comment Added') {
          Icon = MessageSquare;
          bgColor = 'bg-blue-100 dark:bg-blue-900/30';
          iconColor = 'text-blue-500';
        } else if (event.action === 'Request Created') {
          Icon = FileText;
          bgColor = 'bg-indigo-100 dark:bg-indigo-900/30';
          iconColor = 'text-indigo-500';
        }

        return (
          <div key={index} className="relative pl-6 md:pl-8">
            <span className={`absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white dark:ring-neutral-900 ${bgColor}`}>
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </span>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">
                  {event.stage} - {event.action}
                </h3>
                <span className="text-xs text-neutral-500 font-mono">
                  {new Date(event.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">By: {event.user}</p>
              {event.remarks && (
                <div className="mt-2 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg text-sm text-neutral-700 dark:text-neutral-300 border border-neutral-100 dark:border-neutral-800">
                  {event.remarks}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RequestTimeline;
