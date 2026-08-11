import { useState, useEffect } from 'react';

const STORAGE_KEY = 'svcet_leaderboard';

const defaultLeaderboard = [];

const calculateStreak = (log) => {
  if (!log || log.length === 0) return 0;
  const dates = [...new Set(log)].sort((a, b) => new Date(b) - new Date(a));
  
  const getUTCStr = (d) => d.toISOString().split('T')[0];
  
  const today = new Date();
  const todayStr = getUTCStr(today);
  
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = getUTCStr(yesterday);
  
  let streak = 0;
  let currentDate = new Date(today);
  
  if (dates.includes(todayStr)) {
    streak = 1;
    currentDate.setUTCDate(currentDate.getUTCDate() - 1);
  } else if (dates.includes(yesterdayStr)) {
    streak = 1;
    currentDate.setUTCDate(currentDate.getUTCDate() - 2);
  } else {
    return 0;
  }

  while (true) {
    const checkStr = getUTCStr(currentDate);
    if (dates.includes(checkStr)) {
      streak++;
      currentDate.setUTCDate(currentDate.getUTCDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};

export const useLeaderboard = () => {
  const [students, setStudentsState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // Migration: Purge the 1500 mock students with random stars
      if (parsed.length === 1500) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        return [];
      }

      // Recalculate streak dynamically on load
      return parsed.map(s => ({ ...s, streak: calculateStreak(s.dailyTaskLog) }));
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultLeaderboard));
    return defaultLeaderboard;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setStudentsState(parsed.map(s => ({ ...s, streak: calculateStreak(s.dailyTaskLog) })));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('leaderboardUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('leaderboardUpdated', handleStorageChange);
    };
  }, []);

  const setStudents = (newStudents) => {
    let updated;
    if (typeof newStudents === 'function') {
      updated = newStudents(students);
    } else {
      updated = newStudents;
    }
    
    // Always sort by stars descending
    updated.sort((a, b) => b.stars - a.stars);
    
    setStudentsState(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('leaderboardUpdated'));
  };

  const completeTask = (studentName, earnedStars) => {
    setStudents(prev => {
      let student = prev.find(s => s.name === studentName);
      
      if (!student) {
        student = {
          id: Date.now(),
          name: studentName,
          course: 'Enrolled',
          stars: 0,
          streak: 0,
          badges: [],
          activityLog: [],
          dailyTaskLog: [],
          avatar: studentName[0].toUpperCase()
        };
        prev = [...prev, student];
      }

      return prev.map(s => {
        if (s.name === studentName) {
          const newStars = s.stars + earnedStars;
          const newBadges = [...(s.badges || [])];
          const newActivityLog = [...(s.activityLog || [])];
          
          const today = new Date().toISOString().split('T')[0];
          if (!newActivityLog.includes(today)) {
            newActivityLog.push(today);
          }
          
          const newCompletedTasks = (s.completedTasks || 0) + 1;
          
          let studentState = { ...s, stars: newStars, badges: newBadges, completedTasks: newCompletedTasks, activityLog: newActivityLog };
          
          const evaluateBadges = (state, badgesArray, unlockedArray) => {
            const check = (id, condition) => {
              if (condition && !badgesArray.includes(id)) {
                badgesArray.push(id);
                unlockedArray.push(id);
              }
            };
            
            check('first_steps', state.completedTasks >= 1);
            check('task_master', state.completedTasks >= 10);
            check('completionist', state.completedTasks >= 50);
            check('unstoppable', state.completedTasks >= 100);
            
            check('hot_streak', state.streak >= 3);
            check('week_warrior', state.streak >= 7);
            check('consistency_king', state.streak >= 30);
            
            check('star_scholar', state.stars >= 500);
            check('galaxy_brain', state.stars >= 2000);
            check('supernova', state.stars >= 5000);
            
            check('practice_makes_perfect', (state.practiceLog?.length || 0) >= 5);
            check('training_regimen', (state.practiceLog?.length || 0) >= 20);
            
            const hour = new Date().getHours();
            const dayOfWeek = new Date().getDay();
            check('early_bird', hour < 7);
            check('night_owl', hour >= 22);
            check('weekend_warrior', dayOfWeek === 0 || dayOfWeek === 6);
            
            check('the_regular', (state.activityLog?.length || 0) >= 10);
            check('veteran', (state.activityLog?.length || 0) >= 50);
          };

          const newlyUnlocked = [];
          evaluateBadges(studentState, newBadges, newlyUnlocked);

          if (newlyUnlocked.length > 0) {
            window.dispatchEvent(new CustomEvent('badgesUnlocked', { detail: newlyUnlocked }));
          }

          return { ...studentState, badges: newBadges };
        }
        return s;
      });
    });
  };

  const completeDailyTask = (studentName) => {
    setStudents(prev => {
      let student = prev.find(s => s.name === studentName);
      if (!student) {
        student = {
          id: Date.now(),
          name: studentName,
          course: 'Enrolled',
          stars: 0,
          streak: 0,
          badges: [],
          activityLog: [],
          dailyTaskLog: [],
          completedTasks: 0,
          avatar: studentName[0].toUpperCase()
        };
        prev = [...prev, student];
      }

      return prev.map(s => {
        if (s.name === studentName) {
          const today = new Date().toISOString().split('T')[0];
          const newActivityLog = [...(s.activityLog || [])];
          const newDailyTaskLog = [...(s.dailyTaskLog || [])];
          
          if (!newActivityLog.includes(today)) {
            newActivityLog.push(today);
          }
          
          if (newDailyTaskLog.includes(today)) {
            return { ...s, activityLog: newActivityLog };
          }
          
          newDailyTaskLog.push(today);
          const newStreak = calculateStreak(newDailyTaskLog);
          const newStars = s.stars + 15;
          const newBadges = [...(s.badges || [])];
          const newCompletedTasks = (s.completedTasks || 0) + 1;
          let studentState = { 
            ...s, 
            streak: newStreak, 
            stars: newStars, 
            activityLog: newActivityLog, 
            dailyTaskLog: newDailyTaskLog, 
            badges: newBadges,
            completedTasks: newCompletedTasks
          };
          
          const evaluateBadges = (state, badgesArray, unlockedArray) => {
            const check = (id, condition) => {
              if (condition && !badgesArray.includes(id)) {
                badgesArray.push(id);
                unlockedArray.push(id);
              }
            };
            check('first_steps', state.completedTasks >= 1);
            check('task_master', state.completedTasks >= 10);
            check('completionist', state.completedTasks >= 50);
            check('unstoppable', state.completedTasks >= 100);
            check('hot_streak', state.streak >= 3);
            check('week_warrior', state.streak >= 7);
            check('consistency_king', state.streak >= 30);
            check('star_scholar', state.stars >= 500);
            check('galaxy_brain', state.stars >= 2000);
            check('supernova', state.stars >= 5000);
            check('practice_makes_perfect', (state.practiceLog?.length || 0) >= 5);
            check('training_regimen', (state.practiceLog?.length || 0) >= 20);
            const hour = new Date().getHours();
            const dayOfWeek = new Date().getDay();
            check('early_bird', hour < 7);
            check('night_owl', hour >= 22);
            check('weekend_warrior', dayOfWeek === 0 || dayOfWeek === 6);
            check('the_regular', (state.activityLog?.length || 0) >= 10);
            check('veteran', (state.activityLog?.length || 0) >= 50);
          };

          evaluateBadges(studentState, newBadges, newlyUnlocked);

          if (newlyUnlocked.length > 0) {
            window.dispatchEvent(new CustomEvent('badgesUnlocked', { detail: newlyUnlocked }));
          }

          return { ...studentState, badges: newBadges };
        }
        return s;
      });
    });
  };

  const completePracticeTask = (studentName, taskId) => {
    setStudents(prev => {
      let student = prev.find(s => s.name === studentName);
      if (!student) {
        student = {
          id: Date.now(),
          name: studentName,
          course: 'Enrolled',
          stars: 0,
          streak: 0,
          badges: [],
          activityLog: [],
          dailyTaskLog: [],
          completedTasks: 0,
          practiceLog: [],
          avatar: studentName[0].toUpperCase()
        };
        prev = [...prev, student];
      }

      return prev.map(s => {
        if (s.name === studentName) {
          const newPracticeLog = [...(s.practiceLog || [])];
          
          if (!newPracticeLog.includes(taskId)) {
            newPracticeLog.push(taskId);
            
            // Optionally, we could give them a few stars for practicing
            const newStars = s.stars + 5;
            const newCompletedTasks = (s.completedTasks || 0) + 1;
            const newBadges = [...(s.badges || [])];
            let newlyUnlocked = [];
            
            let studentState = { ...s, practiceLog: newPracticeLog, stars: newStars, completedTasks: newCompletedTasks, badges: newBadges };
            
            const evaluateBadges = (state, badgesArray, unlockedArray) => {
              const check = (id, condition) => {
                if (condition && !badgesArray.includes(id)) {
                  badgesArray.push(id);
                  unlockedArray.push(id);
                }
              };
              check('first_steps', state.completedTasks >= 1);
              check('task_master', state.completedTasks >= 10);
              check('completionist', state.completedTasks >= 50);
              check('unstoppable', state.completedTasks >= 100);
              check('hot_streak', state.streak >= 3);
              check('week_warrior', state.streak >= 7);
              check('consistency_king', state.streak >= 30);
              check('star_scholar', state.stars >= 500);
              check('galaxy_brain', state.stars >= 2000);
              check('supernova', state.stars >= 5000);
              check('practice_makes_perfect', (state.practiceLog?.length || 0) >= 5);
              check('training_regimen', (state.practiceLog?.length || 0) >= 20);
              const hour = new Date().getHours();
              const dayOfWeek = new Date().getDay();
              check('early_bird', hour < 7);
              check('night_owl', hour >= 22);
              check('weekend_warrior', dayOfWeek === 0 || dayOfWeek === 6);
              check('the_regular', (state.activityLog?.length || 0) >= 10);
              check('veteran', (state.activityLog?.length || 0) >= 50);
            };

            evaluateBadges(studentState, newBadges, newlyUnlocked);

            if (newlyUnlocked.length > 0) {
              window.dispatchEvent(new CustomEvent('badgesUnlocked', { detail: newlyUnlocked }));
            }

            return { ...studentState, badges: newBadges };
          }
          return s;
        }
        return s;
      });
    });
  };

  const unlockAvatar = (studentName, avatarId, cost) => {
    let success = false;
    setStudents(prev => {
      return prev.map(s => {
        if (s.name === studentName) {
          if (s.stars >= cost) {
            const newUnlocked = [...(s.unlockedAvatars || [])];
            if (!newUnlocked.includes(avatarId)) {
              newUnlocked.push(avatarId);
              success = true;
              return { ...s, stars: s.stars - cost, unlockedAvatars: newUnlocked };
            }
          }
        }
        return s;
      });
    });
    return success;
  };

  return { students, setStudents, completeTask, completeDailyTask, completePracticeTask, unlockAvatar };
};
