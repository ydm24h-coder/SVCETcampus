import React from 'react';
import { Clock, CheckCircle2, XCircle, FileQuestion, UserCircle2, ShieldAlert } from 'lucide-react';

const RequestStatusBadge = ({ status }) => {
  const configs = {
    'Submitted': {
      bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200',
      Icon: Clock
    },
    'Under Review': {
      bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200',
      Icon: UserCircle2
    },
    'Waiting for Documents': {
      bg: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200',
      Icon: FileQuestion
    },
    'Approved': {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200',
      Icon: CheckCircle2
    },
    'Rejected': {
      bg: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200',
      Icon: XCircle
    },
    'Draft': {
      bg: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400 border-neutral-200',
      Icon: Clock
    },
    'Order': {
      bg: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200',
      Icon: ShieldAlert
    }
  };

  const config = configs[status] || configs['Submitted'];
  const Icon = config.Icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${config.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
};

export default RequestStatusBadge;
