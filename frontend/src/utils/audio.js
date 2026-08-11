// A collection of synthesized sounds using the Web Audio API

const getAudioContext = () => {
  return new (window.AudioContext || window.webkitAudioContext)();
};

export const playMacNotificationSound = () => {
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    
    // Create two oscillators for a richer, bell-like tone
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Sine wave for the pure fundamental tone
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, t); // A5
    
    // Triangle wave for slight harmonic richness
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1760, t); // A6 (an octave higher)
    
    // Attack and decay envelope
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.4, t + 0.02); // Fast attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.8); // Smooth resonant decay
    
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 1);
    osc2.stop(t + 1);
  } catch (e) {
    console.warn('Audio failed', e);
  }
};

export const playAchievementSound = () => {
  // Celebration sound removed per user request
};

export const playSadSound = () => {
  // Sad sound removed per user request
};
