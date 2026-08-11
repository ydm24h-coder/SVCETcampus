import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, Clock, CalendarCheck, GraduationCap, AlertCircle, MessageSquare, ArrowRight, CheckCircle2, ListTodo, Plus, Trash2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useStudents } from '@/hooks/useStudents';
import { useTimetable } from '@/hooks/useTimetable';
import { useMessages } from '@/hooks/useMessages';
import { useNotices } from '@/hooks/useNotices';
import { useDepartments } from '@/hooks/useDepartments';
import { useNavigate } from 'react-router-dom';
import TimetablePreview from '@/components/TimetablePreview';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const { departments } = useDepartments();
  const [showReminder, setShowReminder] = useState(false);
  const sessionUser = JSON.parse(localStorage.getItem('svcet_session_faculty') || '{}');
  const facultyName = sessionUser.name || 'Demo Faculty';
  const facultyDept = sessionUser.department || 'CSE';
  
  const { students = [] } = useStudents();
  const { schedules: timetable = [] } = useTimetable();
  const { messages = [] } = useMessages();
  const { notices = [] } = useNotices();

  const [monitorDept, setMonitorDept] = useState(() => localStorage.getItem('svcet_faculty_monitor_dept') || 'All');
  const [monitorYear, setMonitorYear] = useState(() => localStorage.getItem('svcet_faculty_monitor_year') || 'All');

  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem(`svcet_faculty_todos_${facultyName}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [newTodo, setNewTodo] = useState('');
  const [newTodoUrgency, setNewTodoUrgency] = useState('Low');
  const [newTodoTime, setNewTodoTime] = useState('');

  useEffect(() => {
    localStorage.setItem('svcet_faculty_monitor_dept', monitorDept);
  }, [monitorDept]);

  useEffect(() => {
    localStorage.setItem('svcet_faculty_monitor_year', monitorYear);
  }, [monitorYear]);

  useEffect(() => {
    localStorage.setItem(`svcet_faculty_todos_${facultyName}`, JSON.stringify(todos));
  }, [todos, facultyName]);

  const handleAddTodo = () => {
    if (!newTodo.trim()) return;
    setTodos([{
      id: Date.now(),
      text: newTodo,
      urgency: newTodoUrgency,
      time: newTodoTime,
      completed: false
    }, ...todos]);
    setNewTodo('');
    setNewTodoTime('');
    setNewTodoUrgency('Low');
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const deptStudentsCount = students.filter(s => {
    // Only count real data (students with a register number)
    if (!s.registerNumber) return false;
    
    const matchDept = monitorDept === 'All' || s.department === monitorDept;
    const matchYear = monitorYear === 'All' || String(s.year) === monitorYear;
    return matchDept && matchYear;
  }).length;

  const getCardTitle = () => {
    if (monitorDept === 'All' && monitorYear === 'All') return 'Campus Students';
    if (monitorDept === 'All') return `Year ${monitorYear} Students`;
    if (monitorYear === 'All') return `${monitorDept} Students`;
    return `${monitorDept} (Yr ${monitorYear}) Students`;
  };

  // 2. Calculate Unread Messages
  const unreadMessagesCount = messages.filter(m => m.receiverName === facultyName && !m.isRead).length;

  // 3. Process Timetable for today
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()]; // e.g. 'Monday'
  
  // Find all slots taught by this faculty across all timetables
  let allFacultySlots = [];
  timetable.forEach(deptYearObj => {
    if (deptYearObj.type === 'Regular') {
      const todaySchedule = deptYearObj.data.find(d => d.day === todayName);
      if (todaySchedule) {
        todaySchedule.slots.forEach(slot => {
          if (slot.faculty === facultyName) {
            allFacultySlots.push({
              ...slot,
              targetDept: deptYearObj.department,
              targetYear: deptYearObj.year
            });
          }
        });
      }
    }
  });

  // Calculate Today's Attendance
  const todayDateStr = new Date().toISOString().split('T')[0];
  let totalMarked = 0;
  let totalPresent = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('svcet_attendance_') && key.endsWith(todayDateStr)) {
      // Key format: svcet_attendance_{dept} - Year {year}_{date}
      const classStr = key.replace('svcet_attendance_', '').replace(`_${todayDateStr}`, '');
      const parts = classStr.split(' - Year ');
      const dept = parts[0];
      const year = parts[1];
      
      const matchDept = monitorDept === 'All' || dept === monitorDept;
      const matchYear = monitorYear === 'All' || year === monitorYear;
      
      if (matchDept && matchYear) {
        try {
          const records = JSON.parse(localStorage.getItem(key));
          Object.values(records).forEach(status => {
            totalMarked++;
            if (status === 'present') totalPresent++;
          });
        } catch (e) {
          // ignore parse errors
        }
      }
    }
  }

  const attendancePercentage = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

  const nextClass = allFacultySlots.length > 0 ? allFacultySlots[0] : null;

  useEffect(() => {
    const hasSeenReminder = sessionStorage.getItem('svcet_faculty_reminder_seen');
    if (!hasSeenReminder) {
      setShowReminder(true);
      sessionStorage.setItem('svcet_faculty_reminder_seen', 'true');
    }
  }, []);

  const stats = [
    { 
      title: getCardTitle(), 
      value: deptStudentsCount.toString(), 
      icon: <Users className="w-5 h-5 text-indigo-500" />, 
      customTrend: (
        <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
          <select 
            value={monitorDept} 
            onChange={(e) => setMonitorDept(e.target.value)}
            className="text-[11px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-1 py-1 flex-1 outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm font-medium"
          >
            <option value="All">All Depts</option>
            {departments.map(d => <option key={d.name || d} value={d.name || d}>{d.name || d}</option>)}
          </select>
          <select 
            value={monitorYear} 
            onChange={(e) => setMonitorYear(e.target.value)}
            className="text-[11px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-1 py-1 w-[4.5rem] outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm font-medium"
          >
            <option value="All">All Yrs</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>
        </div>
      )
    },
    { 
      title: 'Today\'s Attendance', 
      value: '', 
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, 
      customTrend: totalMarked > 0 ? (
        <div className="mt-1 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300 space-y-2">
          <div className="flex justify-between items-center">
            <span>No. Present:</span>
            <span className="text-emerald-600 dark:text-emerald-400 text-base">{totalPresent}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>No. Absent:</span>
            <span className="text-red-500 dark:text-red-400 text-base">{totalMarked - totalPresent}</span>
          </div>
          <div className="flex justify-between items-center border-t border-neutral-200 dark:border-neutral-700 pt-2 mt-2">
            <span>Total Students:</span>
            <span className="text-neutral-800 dark:text-neutral-100 text-base">{totalMarked}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mt-1 truncate">
          No attendance taken
        </p>
      )
    },
    { 
      title: 'Unread Messages', 
      value: unreadMessagesCount.toString(), 
      icon: <MessageSquare className="w-5 h-5 text-orange-500" />, 
      trend: unreadMessagesCount > 0 ? 'Requires attention' : 'All caught up' 
    }
  ];

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
          Welcome, {facultyName.split(' ')[0]}!
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1 font-medium">Here is your automated academic overview for today.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div key={index} whileHover={{ y: -5 }} className="transition-transform" onClick={stat.onClick} style={{ cursor: stat.onClick ? 'pointer' : 'default' }}>
            <Card className={`border-white/40 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl shadow-lg transition-all h-full rounded-2xl overflow-hidden relative group ${stat.onClick ? 'hover:shadow-2xl hover:border-indigo-300 dark:hover:border-indigo-700' : 'hover:shadow-xl'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10 gap-2">
                <CardTitle className="text-[13px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider truncate">
                  {stat.title}
                </CardTitle>
                <div className="p-2.5 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700">
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                {stat.value && (
                  <div className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                    {stat.value}
                  </div>
                )}
                {stat.customTrend ? (
                  stat.customTrend
                ) : (
                  <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-1 truncate">
                    {stat.trend}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
        
        {/* Quick Actions (4th Card) */}
        <motion.div whileHover={{ y: -5 }} className="transition-transform h-full">
          <Card className="border-white/40 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl shadow-lg transition-all h-full rounded-2xl overflow-hidden relative group hover:shadow-xl">
             <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
             <CardHeader className="flex flex-row items-center justify-between pb-1 relative z-10 gap-2">
                <CardTitle className="text-[13px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider truncate">
                  Quick Actions
                </CardTitle>
                <div className="p-2 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 relative z-10 flex flex-col gap-1.5 mt-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full justify-start text-xs border-neutral-200/60 dark:border-neutral-700/60 bg-white/50 dark:bg-neutral-800/50 hover:bg-white dark:hover:bg-neutral-800 shadow-sm rounded-lg font-semibold h-8 px-2.5"
                  onClick={() => navigate('/faculty/attendance')}
                >
                  <CalendarCheck className="w-3.5 h-3.5 mr-2 text-indigo-500" /> Mark Attendance
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full justify-start text-xs border-neutral-200/60 dark:border-neutral-700/60 bg-white/50 dark:bg-neutral-800/50 hover:bg-white dark:hover:bg-neutral-800 shadow-sm rounded-lg font-semibold h-8 px-2.5"
                  onClick={() => navigate('/faculty/grades')}
                >
                  <GraduationCap className="w-3.5 h-3.5 mr-2 text-emerald-500" /> Update Marks
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full justify-start text-xs border-neutral-200/60 dark:border-neutral-700/60 bg-white/50 dark:bg-neutral-800/50 hover:bg-white dark:hover:bg-neutral-800 shadow-sm rounded-lg font-semibold h-8 px-2.5"
                  onClick={() => navigate('/faculty/messages')}
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-2 text-orange-500" /> Check Messages
                  {unreadMessagesCount > 0 && (
                    <span className="ml-auto bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{unreadMessagesCount}</span>
                  )}
                </Button>
              </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Modals have been removed or moved */}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pinned Timetables */}
        <div className="col-span-2">
          <Card className="border-indigo-100 dark:border-indigo-900 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md shadow-sm mb-6">
            <CardHeader className="border-b border-indigo-50 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/20">
              <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
                <CalendarCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Active Timetables
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {(notices || []).filter(n => {
                  if (!n.isTimetable) return false;
                  const targetAudience = n.targetAudience || 'Both';
                  const targetDept = n.targetDepartment || 'All';
                  const isTargetAudience = targetAudience === 'Both' || targetAudience === 'Faculty';
                  const isTargetDept = String(targetDept).toLowerCase() === 'all' || String(targetDept).toLowerCase() === String(facultyDept || '').toLowerCase();
                  return isTargetAudience && isTargetDept;
                }).length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-4">No active timetables</p>
                ) : (
                  (notices || []).filter(n => {
                  if (!n.isTimetable) return false;
                  const targetAudience = n.targetAudience || 'Both';
                  const targetDept = n.targetDepartment || 'All';
                  const isTargetAudience = targetAudience === 'Both' || targetAudience === 'Faculty';
                  const isTargetDept = String(targetDept).toLowerCase() === 'all' || String(targetDept).toLowerCase() === String(facultyDept || '').toLowerCase();
                  return isTargetAudience && isTargetDept;
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
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My To-Do List */}
        <motion.div variants={itemVariants}>
          <Card className="border-white/40 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl shadow-lg rounded-2xl h-full flex flex-col">
            <CardHeader className="border-b border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/50 rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 truncate">
                <ListTodo className="w-5 h-5 text-pink-500 shrink-0" />
                <span className="truncate">My To-Do List</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col">
              <div className="space-y-3 mb-4">
                <input 
                  type="text" 
                  placeholder="What needs to be done?" 
                  value={newTodo} 
                  onChange={(e) => setNewTodo(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                />
                <div className="flex gap-2">
                  <input 
                    type="time" 
                    value={newTodoTime}
                    onChange={(e) => setNewTodoTime(e.target.value)}
                    className="px-2 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                  />
                  <select 
                    value={newTodoUrgency}
                    onChange={(e) => setNewTodoUrgency(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                  <Button onClick={handleAddTodo} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 shadow-sm h-auto py-1.5">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 flex-1 overflow-y-auto min-h-[150px] max-h-[300px] pr-1">
                {todos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-neutral-400 dark:text-neutral-500 space-y-2 opacity-70">
                    <CheckCircle className="w-8 h-8" />
                    <p className="text-sm">You're all caught up!</p>
                  </div>
                ) : (
                  todos.map(todo => (
                    <div key={todo.id} className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${todo.completed ? 'bg-neutral-50 dark:bg-neutral-800/30 border-transparent opacity-60' : 'bg-white dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700/80 shadow-sm'}`}>
                      <div className="flex items-start gap-2.5 flex-1 overflow-hidden">
                        <button onClick={() => toggleTodo(todo.id)} className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${todo.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-neutral-300 dark:border-neutral-600 text-transparent hover:border-indigo-500'}`}>
                          <CheckCircle className="w-3 h-3" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-medium leading-tight truncate ${todo.completed ? 'line-through text-neutral-500' : 'text-neutral-800 dark:text-neutral-200'}`}>
                            {todo.text}
                          </p>
                          {(todo.time || todo.urgency) && (
                            <div className="flex items-center gap-1.5 mt-1">
                              {todo.time && <span className="text-[9px] bg-neutral-100 dark:bg-neutral-800/50 px-1.5 py-0.5 rounded text-neutral-500 dark:text-neutral-400 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {todo.time}</span>}
                              {todo.urgency && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold tracking-wide uppercase ${
                                  todo.urgency === 'High' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                                  todo.urgency === 'Medium' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                                  'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                }`}>
                                  {todo.urgency}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <button onClick={() => deleteTodo(todo.id)} className="text-neutral-300 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>

      {/* Assessment Reminder Dialog */}
      <Dialog open={showReminder} onOpenChange={setShowReminder}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 p-0 overflow-hidden rounded-2xl shadow-2xl">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-black text-white">Automated System Check</h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-neutral-600 dark:text-neutral-400 text-[15px] leading-relaxed text-center">
              Your dashboard has been synced with the latest automated data from the SVCET servers. Your classes for <strong className="text-neutral-900 dark:text-white">{todayName}</strong> have been loaded into your schedule.
            </p>
            <div className="pt-4 flex gap-3">
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md h-11" onClick={() => setShowReminder(false)}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default FacultyDashboard;
