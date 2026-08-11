import React from 'react';
import { Loader2 } from 'lucide-react';

const PageLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full h-full">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
        <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin relative z-10" />
      </div>
      <p className="mt-4 text-sm font-medium text-neutral-500 dark:text-neutral-400 animate-pulse">
        Loading...
      </p>
    </div>
  );
};

export default PageLoader;
