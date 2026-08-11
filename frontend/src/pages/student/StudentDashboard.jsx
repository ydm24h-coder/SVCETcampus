import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Calendar, GraduationCap, Trophy, FileText, Bell, Clock, Star, Flame, AlertCircle, Code2, PlayCircle, CheckCircle, User, MapPin, Paperclip } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useNotices } from '@/hooks/useNotices';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import { useStudents } from '@/hooks/useStudents';
import { useAssessments } from '@/hooks/useAssessments';
import jsPDF from 'jspdf';
import TimetableModal from '@/components/TimetableModal';
import TimetablePreview from '@/components/TimetablePreview';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const StudentDashboard = () => {
  const { notices } = useNotices();
  const { students } = useLeaderboard();
  const { assessments } = useAssessments();
  const { students: allAuthStudents, updateStudent } = useStudents();
  const navigate = useNavigate();
  
  const currentUser = JSON.parse(localStorage.getItem('svcet_session_student')) || { name: 'Demo Student' };
  
  const studentProfile = allAuthStudents.find(s => s.name === currentUser.name) || {};
  const studentDept = studentProfile.department || 'All';
  const studentYear = studentProfile.year || 'All';

  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showAvatarCelebration, setShowAvatarCelebration] = useState(false);
  const [unlockedTier, setUnlockedTier] = useState(null);

  // Get gamification stats for current user
  const userStats = students.find(s => s.name === currentUser.name) || { stars: 0, streak: 0, activityLog: [], dailyTaskLog: [] };

  React.useEffect(() => {
    if (userStats.stars >= 200 && !localStorage.getItem(`svcet_avatar_epic_unlocked_${currentUser.name}`)) {
      setUnlockedTier({ name: 'Epic Tier', stars: 200, styles: 'Premium Micah Designs' });
      // eslint-disable-next-line
      setShowAvatarCelebration(true);
      localStorage.setItem(`svcet_avatar_epic_unlocked_${currentUser.name}`, 'true');
      localStorage.setItem(`svcet_avatar_rare_unlocked_${currentUser.name}`, 'true'); // Automatically clear lower tier to avoid double popup
      triggerConfetti();
    } else if (userStats.stars >= 50 && !localStorage.getItem(`svcet_avatar_rare_unlocked_${currentUser.name}`)) {
      setUnlockedTier({ name: 'Rare Tier', stars: 50, styles: 'Creative Notionists' });
      // eslint-disable-next-line
      setShowAvatarCelebration(true);
      localStorage.setItem(`svcet_avatar_rare_unlocked_${currentUser.name}`, 'true');
      triggerConfetti();
    }
  }, [userStats.stars, currentUser.name]);

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  
  // Get gamification stats for current user
  
  // Daily Task logic
  const { getDailyTask } = useDailyTasks();
  const dailyTask = getDailyTask() || { title: 'No Task Available', difficulty: 'Easy', problemStatement: '' };

  // --- Student Analytics (Grades & Attendance) ---
  const [studentAnalytics, setStudentAnalytics] = useState({
    mcqAvg: 0, codeAvg: 0, overall: 0, predictedGrade: 'N/A', assessmentsTaken: 0, completedAssessments: []
  });
  
  const [attendanceData, setAttendanceData] = useState({
    totalDays: 0, presentDays: 0, percentage: 0, history: []
  });

  React.useEffect(() => {
    if (!currentUser.name || !studentProfile.id) return;

    // 1. Calculate Grades
    const rawAssessments = localStorage.getItem('svcet_assessments');
    const parsed = rawAssessments ? JSON.parse(rawAssessments) : { mcq: [], code: [] };
    
    let mcqTotal = 0, mcqCount = 0, codeTotal = 0, codeCount = 0;
    const completed = [];

    const processSubmissions = (arr, isCode) => {
      if (!arr) return;
      arr.forEach(a => {
        const sub = a.submissions?.find(s => s.studentName === currentUser.name);
        if (sub && sub.score !== 'Pending') {
          let numScore = 0;
          if (typeof sub.score === 'string' && sub.score.includes('/')) numScore = parseInt(sub.score.split('/')[0], 10);
          else numScore = parseInt(sub.score, 10) || 0;

          if (isCode) { codeTotal += numScore; codeCount++; }
          else { mcqTotal += numScore; mcqCount++; }
          
          completed.push({
            id: a.id, name: a.title, type: isCode ? 'Code' : 'MCQ', score: numScore
          });
        }
      });
    };

    processSubmissions(parsed.mcq, false);
    processSubmissions(parsed.code, true);

    const mcqAvg = mcqCount > 0 ? Math.round(mcqTotal / mcqCount) : 0;
    const codeAvg = codeCount > 0 ? Math.round(codeTotal / codeCount) : 0;
    
    let overall = 0;
    if (mcqCount > 0 && codeCount > 0) overall = Math.round((mcqAvg + codeAvg) / 2);
    else if (mcqCount > 0) overall = mcqAvg;
    else if (codeCount > 0) overall = codeAvg;

    let predictedGrade = 'N/A';
    if (mcqCount > 0 || codeCount > 0) {
      if (overall >= 90) predictedGrade = 'O';
      else if (overall >= 80) predictedGrade = 'A+';
      else if (overall >= 70) predictedGrade = 'A';
      else if (overall >= 60) predictedGrade = 'B+';
      else if (overall >= 50) predictedGrade = 'B';
      else predictedGrade = 'U';
    }

    setStudentAnalytics({
      mcqAvg, codeAvg, overall, predictedGrade,
      assessmentsTaken: mcqCount + codeCount,
      completedAssessments: completed.sort((a,b) => b.id - a.id) // newest first
    });

    // 2. Calculate Attendance
    let tDays = 0;
    let pDays = 0;
    const history = [];
    
    const targetPrefix = `svcet_attendance_${studentProfile.department} - Year ${studentProfile.year}_`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(targetPrefix)) {
        const dateStr = key.replace(targetPrefix, '');
        const recordRaw = localStorage.getItem(key);
        if (recordRaw) {
          try {
            const record = JSON.parse(recordRaw);
            // Check if this student is in the record
            if (record[studentProfile.id]) {
              tDays++;
              const status = record[studentProfile.id];
              if (status === 'present') pDays++;
              history.push({ date: dateStr, status });
            }
          } catch(e) {}
        }
      }
    }
    
    // Sort history by date ascending
    history.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    setAttendanceData({
      totalDays: tDays,
      presentDays: pDays,
      percentage: tDays > 0 ? Math.round((pDays / tDays) * 100) : 0,
      history
    });

  }, [currentUser.name, studentProfile.id, studentProfile.department, studentProfile.year]);

  
  const today = new Date().toISOString().split('T')[0];
  const isDailyTaskCompleted = (userStats.dailyTaskLog || []).includes(today);
  
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [showReminder, setShowReminder] = useState(false);

  const safeAssessments = assessments || { code: [], mcq: [] };
  const allTests = [
    ...(safeAssessments.code || []).map(t => ({ ...t, type: 'Code', dueDate: t.dueDate || 'No Due Date' })),
    ...(safeAssessments.mcq || []).map(t => ({ ...t, type: 'MCQ', dueDate: t.dueDate || 'No Due Date' }))
  ].filter(t => t.status === 'Published')
   .filter(t => !t.targetDepartment || t.targetDepartment === 'All' || t.targetDepartment === studentDept)
   .filter(t => !t.targetYear || t.targetYear === 'All' || t.targetYear === studentYear.toString());

  const pendingTests = allTests.filter(t => {
    const isCompleted = (t.submissions || []).some(s => s.studentName === currentUser.name);
    return !isCompleted;
  });

  const pendingFees = Number(studentProfile.pendingFees) || 0;
  const hasPendingItems = pendingTests.length > 0 || pendingFees > 0;

  // Login session popup reminder logic
  React.useEffect(() => {
    const hasSeenReminder = sessionStorage.getItem('svcet_session_reminder_seen');
    if (!hasSeenReminder && hasPendingItems && !studentProfile.justPromoted) {
      // eslint-disable-next-line
      setShowReminder(true);
      sessionStorage.setItem('svcet_session_reminder_seen', 'true');
    }
  }, [hasPendingItems, studentProfile.justPromoted]);

  // Promotion Celebration Logic
  React.useEffect(() => {
    if (studentProfile.justPromoted) {
      // eslint-disable-next-line
      setShowPromotionModal(true);
      
      triggerConfetti();
    }
  }, [studentProfile.justPromoted]);

  const handleClosePromotionModal = () => {
    setShowPromotionModal(false);
    if (studentProfile.id) {
      updateStudent(studentProfile.id, { justPromoted: false });
    }
  };

  const sortedLeaderboard = [...students].sort((a, b) => b.stars - a.stars);
  const userRank = sortedLeaderboard.findIndex(s => s.name === currentUser.name) + 1;

  const stats = [
    { title: 'Total Stars', value: userStats.stars.toString(), icon: <Star className="w-5 h-5 fill-amber-500 text-amber-500" />, trend: 'Keep earning!' },
    { title: 'Current Rank', value: userRank > 0 ? `#${userRank}` : 'Unranked', icon: <Trophy className="w-5 h-5 text-yellow-500" />, trend: 'Leaderboard', onClick: () => navigate('/student/leaderboard') },
    { title: 'Current Streak', value: `${userStats.streak} Days`, icon: <Flame className="w-5 h-5 fill-orange-500 text-orange-500" />, trend: 'On fire!' },
    { title: 'Pending Works', value: pendingTests.length.toString(), icon: <FileText className="w-5 h-5 text-orange-500" />, trend: 'Requires action', onClick: () => navigate('/student/assessments') },
  ];

  
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="space-y-8 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden sm:overflow-x-visible px-2 sm:px-0"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Avatar Unlock Celebration Modal */}
      <Dialog open={showAvatarCelebration} onOpenChange={setShowAvatarCelebration}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-neutral-900 border-indigo-200 dark:border-indigo-800">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-4">
              <Star className="w-8 h-8 fill-amber-500 text-amber-500" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              XP Level Up!
            </DialogTitle>
            <DialogDescription className="text-lg mt-2">
              You reached <strong className="text-neutral-900 dark:text-white">{unlockedTier?.stars} Stars</strong>!
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4 space-y-4">
            <p className="text-neutral-600 dark:text-neutral-300">
              You've permanently unlocked the <strong>{unlockedTier?.name}</strong> avatars ({unlockedTier?.styles}). 
            </p>
            <p className="text-sm text-neutral-500">
              Go to your Settings to equip your new professional profile picture! Your stars were NOT consumed.
            </p>
          </div>
          <div className="flex justify-center pt-4">
            <Button 
              onClick={() => {
                setShowAvatarCelebration(false);
                navigate('/student/settings');
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-full"
            >
              <User className="w-4 h-4 mr-2" /> Equip New Avatar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent break-words whitespace-normal leading-tight">Welcome back, {currentUser.name}!</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Here is your automated academic summary for today.</p>
      </motion.div>

      {/* Daily Challenge Banner */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl transition-shadow">
        <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="relative z-10 w-full">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
              <Code2 className="w-3 h-3 mr-1" /> Daily Task
            </Badge>
            <Badge variant="outline" className={`border-none ${
              dailyTask.difficulty === 'Easy' ? 'bg-green-500/20 text-green-100' :
              dailyTask.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-100' :
              'bg-red-500/20 text-red-100'
            }`}>
              {dailyTask.difficulty}
            </Badge>
          </div>
          <h2 className="text-2xl font-bold mb-1">{dailyTask.title}</h2>
          <p className="text-blue-100 max-w-xl line-clamp-1">{dailyTask.problemStatement}</p>
        </div>
        <div className="relative z-10 shrink-0 w-full md:w-auto">
          {isDailyTaskCompleted ? (
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-xl flex items-center font-bold text-green-300 w-full justify-center">
              <CheckCircle className="w-5 h-5 mr-2" /> Completed Today
            </div>
          ) : (
            <Button className="w-full md:w-auto bg-white text-indigo-600 hover:bg-neutral-100 rounded-xl px-8 shadow-sm h-12 text-lg font-bold" onClick={() => navigate('/student/daily-task')}>
              <PlayCircle className="w-5 h-5 mr-2" /> Attempt Now
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div key={index} variants={itemVariants} whileHover={{ y: -5 }} onClick={stat.onClick} className={stat.onClick ? "cursor-pointer" : ""}>
            <Card className="border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md shadow-sm hover:shadow-md transition-all h-full border-t-4 hover:border-indigo-400" style={{ borderTopColor: index === 0 ? '#f59e0b' : index === 1 ? '#eab308' : index === 2 ? '#f97316' : '#3b82f6' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                <CardTitle className="text-sm font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider truncate">
                  {stat.title}
                </CardTitle>
                <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl shadow-inner">
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-neutral-900 dark:text-white">{stat.value}</div>
                <p className="text-xs font-medium text-neutral-500 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> {stat.trend}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 min-w-0">
        {/* Leaderboard & Timetables */}
        <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col gap-6 min-w-0 overflow-hidden">
                    {/* Pinned Timetables */}
          <motion.div variants={itemVariants} className="flex flex-col">
            <Card className="border-indigo-200 dark:border-indigo-900 bg-white/70 dark:bg-neutral-900/70 backdrop-blur shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <CardTitle className="flex items-center text-lg font-bold text-indigo-700 dark:text-indigo-400">
                  <Calendar className="w-5 h-5 mr-2" />
                  Active Timetables
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-4">
                {(notices || []).filter(n => {
                  if (!n.isTimetable) return false;
                  const targetAudience = n.targetAudience || 'Both';
                  const targetDept = n.targetDepartment || 'All';
                  const targetYear = n.targetYear || 'All';
                  const isTargetAudience = targetAudience === 'Both' || targetAudience === 'Student';
                  const isTargetDept = String(targetDept).toLowerCase() === 'all' || String(targetDept).toLowerCase() === String(studentDept || '').toLowerCase();
                  const isTargetYear = String(targetYear).toLowerCase() === 'all' || String(targetYear).toLowerCase() === String(studentYear || '').toLowerCase();
                  return isTargetAudience && isTargetDept && isTargetYear;
                }).map(notice => (
                  <div key={notice.id} className="p-4 bg-indigo-50/20 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 rounded-xl mb-4 overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100 leading-tight line-clamp-1">{notice.title}</p>
                        <p className="text-[11px] font-medium text-indigo-600/70 dark:text-indigo-400/70 flex items-center gap-1.5 mt-0.5">
                          {notice.scheduleData?.type === 'Exam' ? 'Exam Matrix' : 'Class Matrix'} • {notice.date}
                        </p>
                      </div>
                    </div>
                    {notice.isTimetable && notice.scheduleData && (
                      <TimetablePreview notice={notice} />
                    )}
                  </div>
                ))}
                {(notices || []).filter(n => {
                  if (!n.isTimetable) return false;
                  const targetAudience = n.targetAudience || 'Both';
                  const targetDept = n.targetDepartment || 'All';
                  const targetYear = n.targetYear || 'All';
                  const isTargetAudience = targetAudience === 'Both' || targetAudience === 'Student';
                  const isTargetDept = String(targetDept).toLowerCase() === 'all' || String(targetDept).toLowerCase() === String(studentDept || '').toLowerCase();
                  const isTargetYear = String(targetYear).toLowerCase() === 'all' || String(targetYear).toLowerCase() === String(studentYear || '').toLowerCase();
                  return isTargetAudience && isTargetDept && isTargetYear;
                }).length === 0 && (
                  <div className="text-sm font-medium text-neutral-500 text-center py-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">No active timetables.</div>
                )}
              </CardContent>
            </Card>
          </motion.div>


          <Card className="border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md flex flex-col h-full shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
              <CardTitle className="flex items-center text-lg font-bold truncate">
                <Trophy className="w-5 h-5 mr-2 text-yellow-500 shrink-0" />
                <span className="truncate">Live Leaderboard</span>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/student/leaderboard')} className="text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20">View All</Button>
            </CardHeader>
            <CardContent className="flex-1 pt-4 overflow-x-auto pb-4 custom-scrollbar">
              <div className="flex flex-col gap-4 min-w-max pr-2">
                {sortedLeaderboard.slice(0, 3).map((student, index) => {
                  const authProfile = allAuthStudents.find(s => s.name === student.name) || {};
                  
                  return (
                  <motion.div 
                    key={index} 
                    whileHover={{ scale: 1.02 }}
                    className={`flex items-center gap-5 p-4 rounded-xl border transition-all ${student.name === currentUser.name ? 'border-blue-300 bg-blue-50/80 dark:border-blue-800 dark:bg-blue-900/20 shadow-sm' : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:shadow-md'}`}
                  >
                    <div className="w-8 text-center font-black text-xl text-neutral-400 shrink-0">#{index + 1}</div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                      {authProfile.avatar ? (
                        <img src={authProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        student.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[15px] text-neutral-900 dark:text-white flex items-center gap-3">
                        <span className="whitespace-nowrap">{student.name}</span>
                        {student.name === currentUser.name && <Badge variant="default" className="text-[10px] bg-blue-500 hover:bg-blue-600 text-white shadow-sm shrink-0">YOU</Badge>}
                      </div>
                      <div className="text-xs text-neutral-500 flex items-center gap-1.5 mt-1 font-medium">
                        <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 shrink-0" /> {student.streak} Day Streak
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-xl text-amber-500 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/50">
                        {student.stars} <Star className="w-4 h-4 fill-amber-500 shrink-0" />
                      </div>
                    </div>
                  </motion.div>
                )})}
                {sortedLeaderboard.length === 0 && (
                  <div className="text-center p-8 text-neutral-500 border border-dashed rounded-xl border-neutral-300 dark:border-neutral-800">
                    No students on the leaderboard yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column: Practice & Notices */}
        <div className="flex flex-col gap-6 min-w-0 overflow-hidden">
          <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
            <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/20 flex flex-col overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 p-16 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="flex items-center text-emerald-700 dark:text-emerald-400">
                  <Code2 className="w-5 h-5 mr-2" />
                  Code Practice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 relative z-10">
                <p className="text-sm font-medium text-emerald-800/70 dark:text-emerald-200/70">
                  Sharpen your logic by solving built-in algorithmic challenges at your own pace.
                </p>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold" onClick={() => navigate('/student/practice')}>
                  Practice Now
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
            <Card className="border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-900/20 flex flex-col overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 p-16 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="flex items-center text-indigo-700 dark:text-indigo-400">
                  <FileText className="w-5 h-5 mr-2" />
                  Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 relative z-10">
                <p className="text-sm font-medium text-indigo-800/70 dark:text-indigo-200/70">
                  Apply for leave or official permissions to administration directly from here.
                </p>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-bold" onClick={() => navigate('/student/requests')}>
                  View Requests
                </Button>
              </CardContent>
            </Card>
          </motion.div>

                    {/* Notices */}
          <motion.div variants={itemVariants} className="flex-1 flex flex-col">
            <Card className="border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur flex flex-col flex-1 shadow-sm">
              <CardHeader className="pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <CardTitle className="flex items-center text-lg font-bold text-neutral-800 dark:text-neutral-200">
                  <Bell className="w-5 h-5 mr-2 text-indigo-500" />
                  Automated Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 flex-1 pt-4">
                {(notices || []).filter(n => {
                  if (n.targetStudent) return n.targetStudent === currentUser?.name;
                  const targetAudience = n.targetAudience || 'Both';
                  const targetDept = n.targetDepartment || 'All';
                  const targetYear = n.targetYear || 'All';
                  const isTargetAudience = targetAudience === 'Both' || targetAudience === 'Student';
                  const isTargetDept = String(targetDept).toLowerCase() === 'all' || String(targetDept).toLowerCase() === String(studentDept || '').toLowerCase();
                  const isTargetYear = String(targetYear).toLowerCase() === 'all' || String(targetYear).toLowerCase() === String(studentYear || '').toLowerCase();
                  return isTargetAudience && isTargetDept && isTargetYear;
                }).slice(0, 3).map(notice => (
                  <motion.div 
                    key={notice.id} 
                    whileHover={{ x: 5 }}
                    className="p-3 bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-100 dark:border-neutral-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:border-indigo-200 dark:hover:border-indigo-800/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedNotif(notice)}
                  >
                    <p className="text-sm font-bold text-neutral-900 dark:text-white leading-tight line-clamp-1 mb-1">{notice.title}</p>
                    <p className="text-[11px] font-medium text-neutral-500 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" /> {notice.date} • {notice.authorName || notice.sender}
                    </p>
                  </motion.div>
                ))}
                {(notices || []).filter(n => {
                  if (n.targetStudent) return n.targetStudent === currentUser?.name;
                  const targetAudience = n.targetAudience || 'Both';
                  const targetDept = n.targetDepartment || 'All';
                  const targetYear = n.targetYear || 'All';
                  const isTargetAudience = targetAudience === 'Both' || targetAudience === 'Student';
                  const isTargetDept = String(targetDept).toLowerCase() === 'all' || String(targetDept).toLowerCase() === String(studentDept || '').toLowerCase();
                  const isTargetYear = String(targetYear).toLowerCase() === 'all' || String(targetYear).toLowerCase() === String(studentYear || '').toLowerCase();
                  return isTargetAudience && isTargetDept && isTargetYear;
                }).length === 0 && (
                  <div className="text-sm font-medium text-neutral-500 text-center py-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">No automated alerts.</div>
                )}
                <Button variant="ghost" className="w-full text-indigo-600 dark:text-indigo-400 mt-2 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20" onClick={() => navigate('/student/notices')}>View all alerts</Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* --- Attendance & Grades Graphs --- */}
      <div className="grid lg:grid-cols-2 gap-6 min-w-0">
        {/* Attendance Graph */}
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur shadow-sm overflow-hidden flex flex-col h-full min-w-0">
          <CardHeader className="pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <CardTitle className="text-lg font-bold flex items-center">
              <User className="w-5 h-5 mr-2 text-indigo-500" />
              My Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col items-center justify-center">
            {attendanceData.totalDays > 0 ? (
              <div className="w-full flex flex-col items-center">
                <div className="relative w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Present', value: attendanceData.presentDays },
                          { name: 'Absent', value: attendanceData.totalDays - attendanceData.presentDays }
                        ]}
                        cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-neutral-900 dark:text-white">{attendanceData.percentage}%</span>
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-widest">Attendance</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-6 text-sm font-medium">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> {attendanceData.presentDays} Present</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> {attendanceData.totalDays - attendanceData.presentDays} Absent</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500 border border-dashed rounded-xl border-neutral-200 dark:border-neutral-800 w-full">
                No attendance records found yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grades Graph */}
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur shadow-sm overflow-hidden flex flex-col h-full min-w-0">
          <CardHeader className="pb-2 border-b border-neutral-100 dark:border-neutral-800 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center">
              <GraduationCap className="w-5 h-5 mr-2 text-indigo-500" />
              Assessment Grades
            </CardTitle>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800">{studentAnalytics.predictedGrade} Grade</Badge>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col">
            {studentAnalytics.completedAssessments.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...studentAnalytics.completedAssessments].reverse()} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-45} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {studentAnalytics.completedAssessments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 50 ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-8 text-neutral-500 border border-dashed rounded-xl border-neutral-200 dark:border-neutral-800 w-full">
                  No assessments graded yet.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Notification Popup Dialog */}
      <TimetableModal selectedNotif={selectedNotif} onClose={() => setSelectedNotif(null)} />

      {/* Login Session Due Reminder */}
      <Dialog open={showReminder} onOpenChange={setShowReminder}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 p-0 overflow-hidden">
          <div className="bg-orange-500 p-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-white" />
            <h2 className="text-lg font-bold text-white">Action Required</h2>
          </div>
          <div className="p-6 space-y-6">
            {pendingFees > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center text-red-600 dark:text-red-400">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                  Outstanding Fees
                </h3>
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80 font-medium uppercase tracking-wider mb-1">Amount Due</p>
                    <p className="text-2xl font-black text-red-700 dark:text-red-400">₹{pendingFees.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {pendingTests.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center text-orange-600 dark:text-orange-400">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Pending Assessments ({pendingTests.length})
                </h3>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2">
                  {pendingTests.map(test => (
                    <div key={test.id} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-lg flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-sm text-neutral-900 dark:text-white line-clamp-1">{test.title}</h4>
                        <p className="text-xs text-neutral-500 mt-0.5">Due: {test.dueDate}</p>
                      </div>
                      <Badge variant="outline" className="bg-white dark:bg-neutral-950 text-xs shrink-0 ml-2">{test.type}</Badge>
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200" onClick={() => {
                  setShowReminder(false);
                  navigate('/student/assessments');
                }}>
                  Go to Assessments
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cinematic Promotion Modal */}
      <Dialog open={showPromotionModal} onOpenChange={handleClosePromotionModal}>
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-indigo-900 to-blue-900 border-none text-white overflow-hidden shadow-2xl z-[100]">
          <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <DialogHeader className="relative z-10 text-center flex flex-col items-center pt-6">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(250,204,21,0.6)]"
            >
              <Trophy className="w-12 h-12 text-indigo-950" />
            </motion.div>
            <DialogTitle className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 mb-2 uppercase tracking-wider">
              Congratulations!
            </DialogTitle>
          </DialogHeader>
          <div className="relative z-10 text-center mt-2 space-y-4 pb-4">
            <p className="text-indigo-200 text-lg font-medium">
              You have been successfully promoted to
            </p>
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6, type: "spring" }}
              className="text-6xl font-black text-white drop-shadow-lg"
            >
              Year {studentProfile.year}
            </motion.div>
            <p className="text-indigo-200 mt-6 text-sm px-4">
              Your hard work and dedication have paid off. Keep up the great work in your new academic year!
            </p>
            <Button 
              className="w-full mt-8 bg-white text-indigo-900 hover:bg-neutral-100 font-bold text-lg h-12 rounded-xl" 
              onClick={handleClosePromotionModal}
            >
              Continue to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default StudentDashboard;
