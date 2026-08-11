import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { BADGE_DATA } from '@/constants/badges';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const BadgeUnlockModal = () => {
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { width, height } = useWindowSize();

  useEffect(() => {
    const handleBadgesUnlocked = (e) => {
      const newBadgeIds = e.detail || [];
      if (newBadgeIds.length > 0) {
        setUnlockedBadges(prev => [...prev, ...newBadgeIds]);
        if (!isOpen) {
          setCurrentIndex(0);
          setIsOpen(true);
        }
      }
    };

    window.addEventListener('badgesUnlocked', handleBadgesUnlocked);
    return () => window.removeEventListener('badgesUnlocked', handleBadgesUnlocked);
  }, [isOpen]);

  const handleNext = () => {
    if (currentIndex < unlockedBadges.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setUnlockedBadges([]);
      setCurrentIndex(0);
    }, 500);
  };

  if (!isOpen || unlockedBadges.length === 0) return null;

  const currentBadgeId = unlockedBadges[currentIndex];
  const badgeDef = BADGE_DATA.find(b => b.id === currentBadgeId);

  if (!badgeDef) {
    handleNext(); // Skip invalid badge
    return null;
  }

  const Icon = badgeDef.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <Confetti 
            width={width} 
            height={height} 
            recycle={false} 
            numberOfPieces={400} 
            gravity={0.15}
            style={{ zIndex: 9999 }}
          />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-white dark:bg-neutral-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Magical Background Glow */}
              <div className={`absolute top-0 left-0 w-full h-40 bg-gradient-to-b ${badgeDef.color} opacity-20 blur-3xl rounded-full translate-y-[-50%]`} />

              <div className="flex flex-col items-center text-center relative z-10 mt-6">
                <div className={`w-32 h-32 rounded-3xl flex items-center justify-center mb-6 shadow-xl bg-gradient-to-tr ${badgeDef.color} border-4 border-white dark:border-neutral-800`}>
                  <Icon className="w-16 h-16 text-white drop-shadow-md" />
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-sm font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-2">Badge Unlocked!</h2>
                  <h3 className="text-3xl font-black text-neutral-900 dark:text-white mb-3">{badgeDef.title}</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mb-8">
                    {badgeDef.description}
                  </p>
                </motion.div>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className="w-full py-3.5 px-6 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 text-white font-bold text-sm transition-colors shadow-lg"
                >
                  {currentIndex < unlockedBadges.length - 1 ? 'Next Badge' : 'Awesome!'}
                </motion.button>
                
                {unlockedBadges.length > 1 && (
                  <div className="mt-4 flex gap-1.5">
                    {unlockedBadges.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-indigo-500' : 'bg-neutral-300 dark:bg-neutral-700'}`} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BadgeUnlockModal;
