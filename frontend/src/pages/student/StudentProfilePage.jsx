import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useStudents } from '@/hooks/useStudents';
import { BADGE_DATA } from '@/constants/badges';
import { ActivityHeatmap } from '@/components/ui/ActivityHeatmap';
import { ArrowLeft, Edit2, Check, X, Globe, Award, Activity, Star, Flame, Code2, Target, Trophy, User } from 'lucide-react';

const StudentProfilePage = () => {
  const { studentName } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('svcet_session_student')) || {};
  const { students: leaderboardStudents } = useLeaderboard();
  const { students: adminStudents, updateStudent } = useStudents();
  
  const decodedName = studentName ? decodeURIComponent(studentName) : undefined;
  const targetName = decodedName || user?.name;
  const isSelf = !studentName || decodedName === user?.name;
  
  const userStats = leaderboardStudents.find(s => s.name === targetName) || { stars: 0, streak: 0, badges: [], dailyTaskLog: [] };
  const studentProfile = adminStudents.find(s => s.name === targetName) || { department: 'All', year: 'All' };
  
  const [isEditingSocials, setIsEditingSocials] = useState(false);
  const [hoveredBadge, setHoveredBadge] = useState(null);
  const [socials, setSocials] = useState({
    github: studentProfile?.github || '',
    linkedin: studentProfile?.linkedin || '',
    portfolio: studentProfile?.portfolio || ''
  });

  if (!targetName) {
    return <Navigate to="/student" replace />;
  }
  
  const initials = (targetName || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const userRank = leaderboardStudents.findIndex(s => s.name === targetName) + 1;
  const studentDept = studentProfile.department || 'All';
  const studentYear = studentProfile.year || 'All';

  const calculateProfileStrength = () => {
    let s = 25;
    if (studentProfile.phone) s += 15;
    if (studentProfile.bio) s += 20;
    if (studentProfile.github) s += 15;
    if (studentProfile.linkedin) s += 15;
    if (studentProfile.skills) s += 10;
    return Math.min(s, 100);
  };
  
  const profileStrength = calculateProfileStrength();

  const handleSaveSocials = () => {
    updateStudent(studentProfile.id, socials);
    setIsEditingSocials(false);
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-20">
      
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
        {isSelf && (
          <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Your Profile
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Identity & Socials */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-900/5 border border-neutral-200 dark:border-neutral-800 relative overflow-hidden text-center flex flex-col items-center">
            
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-10"></div>
            
            {/* Avatar */}
            <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-4xl shadow-xl ring-4 ring-white dark:ring-neutral-900 mb-6 relative z-10 overflow-hidden">
              {studentProfile.avatar ? (
                <img src={studentProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white relative z-10">{targetName}</h1>
            {studentProfile.registerNumber && (
              <p className="text-sm font-mono text-neutral-500 mt-1 relative z-10">{studentProfile.registerNumber}</p>
            )}
            
            <p className="text-neutral-600 dark:text-neutral-400 font-medium mt-3 relative z-10 bg-neutral-100 dark:bg-neutral-800 px-4 py-1.5 rounded-full inline-block">
              {studentDept !== 'All' ? `${studentDept} Dept` : 'Enrolled Student'} {studentYear !== 'All' ? `• Year ${studentYear}` : ''}
            </p>
            
            <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-sm border border-blue-200 dark:border-blue-800/50">
              <Trophy className="w-4 h-4" /> Global Rank: #{userRank > 0 ? userRank : '-'}
            </div>

            {/* Profile Strength */}
            {isSelf && (
              <div className="w-full mt-8 space-y-2 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Profile Strength</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{profileStrength}%</span>
                </div>
                <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000"
                    style={{ width: `${profileStrength}%` }}
                  />
                </div>
              </div>
            )}

            {/* Social Media Links */}
            <div className="w-full mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-neutral-800 dark:text-neutral-200">Connect</h3>
                {isSelf && !isEditingSocials && (
                  <button onClick={() => setIsEditingSocials(true)} className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1 font-medium transition-colors">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
              </div>
              
              {isEditingSocials ? (
                <div className="space-y-3 text-left">
                  <div>
                    <label className="text-xs font-semibold text-neutral-500 mb-1 flex items-center gap-1.5"><Code2 className="w-3.5 h-3.5"/> GitHub URL</label>
                    <input 
                      type="url" 
                      value={socials.github} 
                      onChange={e => setSocials({...socials, github: e.target.value})}
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-500 mb-1 flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> LinkedIn URL</label>
                    <input 
                      type="url" 
                      value={socials.linkedin} 
                      onChange={e => setSocials({...socials, linkedin: e.target.value})}
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-500 mb-1 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5"/> Portfolio URL</label>
                    <input 
                      type="url" 
                      value={socials.portfolio} 
                      onChange={e => setSocials({...socials, portfolio: e.target.value})}
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={handleSaveSocials} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-colors">
                      <Check className="w-4 h-4" /> Save
                    </button>
                    <button onClick={() => setIsEditingSocials(false)} className="px-4 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-bold transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {studentProfile.github ? (
                    <a href={studentProfile.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white group">
                      <Code2 className="w-5 h-5 text-neutral-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
                      <span className="font-medium text-sm overflow-hidden text-ellipsis whitespace-nowrap">{studentProfile.github.replace('https://', '')}</span>
                    </a>
                  ) : isSelf && (
                    <button onClick={() => setIsEditingSocials(true)} className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <Code2 className="w-5 h-5" /> <span className="font-medium text-sm">Add GitHub</span>
                    </button>
                  )}

                  {studentProfile.linkedin ? (
                    <a href={studentProfile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors text-neutral-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 group">
                      <User className="w-5 h-5 text-neutral-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      <span className="font-medium text-sm overflow-hidden text-ellipsis whitespace-nowrap">{studentProfile.linkedin.replace('https://', '').replace('www.', '')}</span>
                    </a>
                  ) : isSelf && (
                    <button onClick={() => setIsEditingSocials(true)} className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <User className="w-5 h-5" /> <span className="font-medium text-sm">Add LinkedIn</span>
                    </button>
                  )}

                  {studentProfile.portfolio ? (
                    <a href={studentProfile.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors text-neutral-700 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 group">
                      <Globe className="w-5 h-5 text-neutral-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                      <span className="font-medium text-sm overflow-hidden text-ellipsis whitespace-nowrap">{studentProfile.portfolio.replace('https://', '')}</span>
                    </a>
                  ) : isSelf && (
                    <button onClick={() => setIsEditingSocials(true)} className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <Globe className="w-5 h-5" /> <span className="font-medium text-sm">Add Portfolio</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bio & Skills */}
            {(studentProfile.bio || studentProfile.skills) && (
              <div className="w-full mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-left space-y-4">
                {studentProfile.bio && (
                  <div>
                    <h3 className="font-bold text-neutral-800 dark:text-neutral-200 mb-2 text-sm uppercase tracking-wider">About</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">"{studentProfile.bio}"</p>
                  </div>
                )}
                {studentProfile.skills && (
                  <div>
                    <h3 className="font-bold text-neutral-800 dark:text-neutral-200 mb-3 text-sm uppercase tracking-wider">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {studentProfile.skills.split(',').map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Stats, Activity, Badges */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-lg shadow-amber-900/5 border border-amber-100 dark:border-amber-900/20 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Star className="w-16 h-16 text-amber-500"/></div>
              <Star className="w-8 h-8 text-amber-500 mb-2 relative z-10" />
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 relative z-10">Total Stars</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 relative z-10">{userStats.stars}</p>
            </div>
            
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-lg shadow-orange-900/5 border border-orange-100 dark:border-orange-900/20 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Flame className="w-16 h-16 text-orange-500"/></div>
              <Flame className="w-8 h-8 text-orange-500 mb-2 relative z-10" />
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 relative z-10">Day Streak</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 relative z-10">{userStats.streak}</p>
            </div>
            
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-lg shadow-blue-900/5 border border-blue-100 dark:border-blue-900/20 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Code2 className="w-16 h-16 text-blue-500"/></div>
              <Code2 className="w-8 h-8 text-blue-500 mb-2 relative z-10" />
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 relative z-10">Tasks Solved</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 relative z-10">{userStats.completedTasks || 0}</p>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-lg shadow-green-900/5 border border-green-100 dark:border-green-900/20 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Target className="w-16 h-16 text-green-500"/></div>
              <Target className="w-8 h-8 text-green-500 mb-2 relative z-10" />
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 relative z-10">Practices</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 relative z-10">{userStats.practiceLog?.length || 0}</p>
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-red-900/5 border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-neutral-900 dark:text-white">
              <Activity className="w-5 h-5 text-red-500" />
              Activity & Graphs
            </h3>
            <ActivityHeatmap activityLog={userStats.dailyTaskLog || []} />
          </div>

          {/* Achievements Showcase */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-900/5 border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-lg font-bold mb-6 flex items-center justify-between text-neutral-900 dark:text-white">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-indigo-500" />
                Achievements
              </div>
              <span className="text-sm font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-3 py-1 rounded-full">
                {userStats.badges?.length || 0} / {BADGE_DATA.length} Unlocked
              </span>
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {BADGE_DATA.map((badge) => {
                const isUnlocked = userStats.badges?.includes(badge.id) || userStats.badges?.includes(badge.title);
                const Icon = badge.icon;
                
                return (
                  <div 
                    key={badge.id} 
                    onMouseEnter={() => setHoveredBadge(badge.id)}
                    onMouseLeave={() => setHoveredBadge(null)}
                    className="relative"
                  >
                    <div 
                      className={`flex flex-col items-center p-4 rounded-2xl border transition-all hover:scale-[1.02] cursor-help h-full ${
                        isUnlocked 
                          ? 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 shadow-sm' 
                          : 'bg-neutral-50/50 dark:bg-neutral-900/50 border-dashed border-neutral-300 dark:border-neutral-700 opacity-60 grayscale'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-md border-2 ${
                        isUnlocked 
                          ? `bg-gradient-to-tr ${badge.color} border-white/20 text-white` 
                          : 'bg-neutral-200 dark:bg-neutral-800 border-transparent text-neutral-400'
                      }`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <span className="text-xs font-bold leading-tight text-center text-neutral-800 dark:text-neutral-200">{badge.title}</span>
                    </div>

                    <AnimatePresence>
                      {hoveredBadge === badge.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 5, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-48 z-50 pointer-events-none"
                        >
                          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl rounded-xl p-4 text-center relative flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-md border-2 ${
                              isUnlocked 
                                ? `bg-gradient-to-tr ${badge.color} border-white/20 text-white` 
                                : 'bg-neutral-200 dark:bg-neutral-800 border-transparent text-neutral-400'
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <h4 className="font-bold text-sm text-neutral-900 dark:text-white mb-1 leading-tight">{badge.title}</h4>
                            <p className="text-[11px] text-neutral-500 leading-snug">
                              {isUnlocked ? badge.description : 'Keep practicing and completing tasks to unlock this badge!'}
                            </p>
                            {/* Arrow */}
                            <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white dark:bg-neutral-900 border-b border-r border-neutral-200 dark:border-neutral-700 rotate-45" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
