import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Star, TrendingUp, Award, Flame, CheckCircle } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ActivityHeatmap } from '@/components/ui/ActivityHeatmap';
import { BADGE_DATA } from '@/constants/badges';

import { useStudents } from '@/hooks/useStudents';

const LeaderboardPage = () => {
  const { students } = useLeaderboard();
  const navigate = useNavigate();
  
  // Get current logged in student
  const sessionUser = JSON.parse(localStorage.getItem('svcet_session_student')) || { name: 'Demo Student' };
  
  // Find current student rank
  const currentUserIndex = students.findIndex(s => s.name === sessionUser.name);
  const currentUserData = currentUserIndex !== -1 ? students[currentUserIndex] : null;
  const currentRank = currentUserIndex !== -1 ? currentUserIndex + 1 : '-';

  const { students: allAuthStudents } = useStudents();
  
  const getAvatar = (name) => {
    const profile = allAuthStudents.find(s => s.name === name);
    return profile?.avatar;
  };
  
  const renderAvatar = (name, fallbackInitials) => {
    const avatarPath = getAvatar(name);
    if (avatarPath) return <img src={avatarPath} alt="Avatar" className="w-full h-full object-cover" />;
    return fallbackInitials || name?.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent flex items-center gap-3">
            <Trophy className="w-10 h-10 text-amber-500" />
            Global Leaderboard
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-lg">
            Compete with your peers, complete assessments, and earn stars!
          </p>
        </div>
        
        {/* Current User Stats Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex items-center gap-6 shadow-sm w-full md:w-auto">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-inner overflow-hidden">
              {renderAvatar(sessionUser.name)}
            </div>
            <div>
              <p className="text-sm text-neutral-500 font-medium">Your Rank</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                #{currentRank} <TrendingUp className="w-4 h-4 text-green-500" />
              </p>
            </div>
          </div>
          <div className="h-10 w-px bg-neutral-200 dark:bg-neutral-800"></div>
          <div>
            <p className="text-sm text-neutral-500 font-medium">Total Stars</p>
            <p className="text-2xl font-bold text-amber-500 flex items-center gap-1">
              {currentUserData ? currentUserData.stars : 0} <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </p>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {students.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 pt-12 pb-8 items-end relative">
          {/* 2nd Place */}
          <div className="flex flex-col items-center cursor-pointer group" onClick={() => navigate('/student/profile/' + students[1].name)}>
            <div className="relative mb-4 group-hover:-translate-y-2 transition-transform duration-300">
              <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-neutral-300 to-neutral-400 flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 border-white dark:border-neutral-950 z-10 relative overflow-hidden">
                {renderAvatar(students[1].name, students[1].avatar)}
              </div>
              <div className="absolute -bottom-3 -right-2 bg-neutral-200 text-neutral-700 rounded-full p-1.5 shadow-md border-2 border-white dark:border-neutral-950 z-20">
                <Medal className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-gradient-to-b from-neutral-200 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 w-full rounded-t-2xl flex flex-col items-center p-6 h-40 border border-b-0 border-neutral-300 dark:border-neutral-700 shadow-inner group-hover:brightness-105 transition-all">
              <h3 className="font-bold text-lg text-center line-clamp-1">{students[1].name}</h3>
              <p className="text-sm text-neutral-500 mb-3">{students[1].course}</p>
              <div className="mt-auto flex items-center gap-1 text-amber-500 font-bold bg-white dark:bg-neutral-950 px-3 py-1 rounded-full shadow-sm">
                {students[1].stars} <Star className="w-4 h-4 fill-amber-500" />
              </div>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center cursor-pointer group -mt-8" onClick={() => navigate('/student/profile/' + students[0].name)}>
            <Trophy className="w-12 h-12 text-amber-400 absolute -top-16 drop-shadow-md animate-bounce" />
            <div className="relative mb-4 group-hover:-translate-y-2 transition-transform duration-300">
              <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-amber-500/20 border-4 border-white dark:border-neutral-950 z-10 relative ring-4 ring-amber-100 dark:ring-amber-900/30 overflow-hidden">
                {renderAvatar(students[0].name, students[0].avatar)}
              </div>
              <div className="absolute -bottom-3 -right-2 bg-amber-400 text-white rounded-full p-2 shadow-md border-2 border-white dark:border-neutral-950 z-20">
                <Award className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-gradient-to-b from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-neutral-900 w-full rounded-t-2xl flex flex-col items-center p-6 h-48 border border-b-0 border-amber-200 dark:border-amber-800 shadow-inner group-hover:brightness-105 transition-all">
              <h3 className="font-bold text-xl text-center line-clamp-1">{students[0].name}</h3>
              <p className="text-sm text-neutral-500 mb-3">{students[0].course}</p>
              <div className="mt-auto flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold bg-white dark:bg-neutral-950 px-4 py-1.5 rounded-full shadow-sm text-lg border border-amber-100 dark:border-amber-900/50">
                {students[0].stars} <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
              </div>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center cursor-pointer group" onClick={() => navigate('/student/profile/' + students[2].name)}>
            <div className="relative mb-4 group-hover:-translate-y-2 transition-transform duration-300">
              <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-orange-300 to-amber-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 border-white dark:border-neutral-950 z-10 relative overflow-hidden">
                {renderAvatar(students[2].name, students[2].avatar)}
              </div>
              <div className="absolute -bottom-3 -right-2 bg-orange-400 text-white rounded-full p-1.5 shadow-md border-2 border-white dark:border-neutral-950 z-20">
                <Medal className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-gradient-to-b from-orange-100/50 to-neutral-50 dark:from-orange-900/20 dark:to-neutral-900 w-full rounded-t-2xl flex flex-col items-center p-6 h-36 border border-b-0 border-orange-200/50 dark:border-orange-900/30 shadow-inner group-hover:brightness-105 transition-all">
              <h3 className="font-bold text-lg text-center line-clamp-1">{students[2].name}</h3>
              <p className="text-sm text-neutral-500 mb-3">{students[2].course}</p>
              <div className="mt-auto flex items-center gap-1 text-amber-500 font-bold bg-white dark:bg-neutral-950 px-3 py-1 rounded-full shadow-sm">
                {students[2].stars} <Star className="w-4 h-4 fill-amber-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List Rankings (4th onwards) */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex items-center justify-between">
          <h3 className="font-bold text-lg">Top 500 Rankings</h3>
          <span className="text-sm text-neutral-500 font-medium">Out of {students.length} Students</span>
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {students.slice(0, 500).map((student, index) => {
            const isCurrentUser = student.name === sessionUser.name;
            
            return (
              <div 
                key={student.id} 
                onClick={() => navigate('/student/profile/' + student.name)}
                className={`flex items-center justify-between p-4 px-6 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer ${
                  isCurrentUser ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-8 font-bold text-lg text-center ${
                    index === 0 ? 'text-amber-500' :
                    index === 1 ? 'text-neutral-400' :
                    index === 2 ? 'text-orange-400' :
                    'text-neutral-400'
                  }`}>
                    #{index + 1}
                  </div>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden ${
                    isCurrentUser ? 'bg-gradient-to-tr from-blue-500 to-indigo-500' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}>
                    {renderAvatar(student.name, student.avatar)}
                  </div>
                  <div>
                    <p className={`font-semibold ${isCurrentUser ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                      {student.name} {isCurrentUser && <span className="text-xs ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full">You</span>}
                    </p>
                    <p className="text-xs text-neutral-500">{student.course}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 font-bold px-4 py-1.5 rounded-full border border-amber-100 dark:border-amber-900/20">
                  {student.stars} <Star className="w-4 h-4 fill-amber-500" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
