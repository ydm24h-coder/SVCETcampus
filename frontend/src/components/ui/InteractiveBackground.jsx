import React from 'react';

const InteractiveBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Base background - completely static */}
      <div className="absolute inset-0 bg-gradient-to-tr from-neutral-50 to-white dark:from-neutral-950 dark:to-[#0a0a0a]" />
      
      {/* Soft CSS animated glows for the "Interactive" feel */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-600/5 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_1s]" />
    </div>
  );
};

export default InteractiveBackground;
