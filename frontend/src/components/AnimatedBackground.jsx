import React from 'react';

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      {/* Background base */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 dark:from-neutral-950 dark:via-neutral-900 dark:to-indigo-950/30" />
      
      {/* Pure CSS animated blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-screen animate-[blob_7s_infinite]" />
      <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-screen animate-[blob_9s_infinite_2s]" />
      <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-screen animate-[blob_11s_infinite_4s]" />
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
      `}} />
    </div>
  );
};

export default AnimatedBackground;
