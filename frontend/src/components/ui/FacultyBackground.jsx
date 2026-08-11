import React from 'react';

const FacultyBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-neutral-50 dark:bg-[#0a0a0a]">
      {/* Faculty specific gradient vibe */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-amber-500/10 dark:bg-amber-600/5 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-[pulse_12s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-500/10 dark:bg-orange-600/5 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-[pulse_15s_ease-in-out_infinite_2s]" />
    </div>
  );
};

export default FacultyBackground;
