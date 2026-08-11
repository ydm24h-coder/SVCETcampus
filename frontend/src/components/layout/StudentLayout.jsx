import AnimatedBackground from '@/components/AnimatedBackground';
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Folders,
  FileCode,
  GraduationCap, 
  Settings2,
  LogOut, 
  Menu,
  X,
  Bell,
  Trophy,
  Star,
  Flame,
  Award,
  Code2,
  MessageSquare,
  ClipboardList,
  User,
  Activity,
  ChevronLeft, 
  ChevronRight, 
  Layout, 
  Target, 
  ChevronUp, 
  Search, 
  Zap, 
  CheckCircle,
  UserCircle,
  Network,
  FolderGit2,
  Briefcase
} from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { NotificationCenter } from '../NotificationCenter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useStudents } from '@/hooks/useStudents';
import { useMessages } from '@/hooks/useMessages';
import { BADGE_DATA } from '@/constants/badges';
import { ActivityHeatmap } from '@/components/ui/ActivityHeatmap';
import BadgeUnlockModal from '@/components/ui/BadgeUnlockModal';

const StudentLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const effectivelyCollapsed = isCollapsed && !isHovered;
  const { students } = useLeaderboard();
  const { students: adminStudents } = useStudents();

  useEffect(() => {
    document.title = 'SVCETstudents';
    const user = JSON.parse(localStorage.getItem('svcet_session_student'));
    
    if (!user || user.role !== 'Student') {
      navigate('/login');
      return;
    }

    // 8 hour session timeout (8 * 60 * 60 * 1000 = 28800000 ms)
    if (user.loginTimestamp && Date.now() - user.loginTimestamp > 28800000) {
      localStorage.removeItem('svcet_session_student');
      navigate('/login');
    }
  }, [navigate]);

  const [user, setUser] = useState(JSON.parse(localStorage.getItem('svcet_session_student')) || {});

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(JSON.parse(localStorage.getItem('svcet_session_student')) || {});
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const profileUser = JSON.parse(localStorage.getItem('svcet_session_student')) || {};
  const initials = (profileUser.name || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  
  const userStats = students.find(s => s.name === user.name) || { stars: 0, streak: 0, badges: [] };
  const userRank = students.findIndex(s => s.name === user.name) + 1;
  
  const studentProfile = adminStudents.find(s => s.name === user.name) || {};
  
  const studentDept = studentProfile.department || 'All';
  const studentYear = studentProfile.year || 'All';

  const handleLogout = () => {
    localStorage.removeItem('svcet_session_student');
    navigate('/login');
  };

  const { messages } = useMessages();
  const sessionUser = JSON.parse(localStorage.getItem('svcet_session_student')) || {};
  const studentName = sessionUser.name || '';
  
  const unreadMessagesCount = messages.filter(m => m.receiverName === studentName && !m.isRead).length;

  const navItems = [
    { name: 'Dashboard', path: '/student', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'My Courses', path: '/student/courses', icon: <BookOpen className="w-5 h-5" /> },
    { name: 'Materials', path: '/student/materials', icon: <Folders className="w-5 h-5" /> },
    { name: 'Assessments', path: '/student/assessments', icon: <FileCode className="w-5 h-5" /> },
    { name: 'Code Practice', path: '/student/practice', icon: <Code2 className="w-5 h-5" /> },
    { name: 'Notice Board', path: '/student/notices', icon: <Bell className="w-5 h-5" /> },
    { name: 'Messages', path: '/student/messages', icon: <MessageSquare className="w-5 h-5" />, badge: unreadMessagesCount },
    { name: 'Requests', path: '/student/requests', icon: <ClipboardList className="w-5 h-5" /> },
    { name: 'Leaderboard', path: '/student/leaderboard', icon: <Trophy className="w-5 h-5" /> },
    { name: 'My Grades', path: '/student/grades', icon: <GraduationCap className="w-5 h-5" /> },
    // Professional & SkillHub Module
    { name: 'SkillHub', path: '/student/skillhub', icon: <Network className="w-5 h-5" /> },
    { name: 'Achievements', path: '/student/achievements', icon: <Award className="w-5 h-5" /> },
    { name: 'Settings', path: '/student/settings', icon: <Settings2 className="w-5 h-5" /> },
  ];

  return (
    <>
      <AnimatedBackground />
      <div className="flex h-[100dvh] bg-transparent text-neutral-900 dark:text-white transition-colors duration-300 font-sans relative z-10">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-all duration-300 will-change-transform flex flex-col ${effectivelyCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className={`flex items-center h-20 border-b border-neutral-200 dark:border-neutral-800 ${effectivelyCollapsed ? 'justify-center' : 'justify-between px-6'}`}>
          {!effectivelyCollapsed && (
            <div className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105" onClick={() => setIsCollapsed(!isCollapsed)} title={isCollapsed ? "Pin Sidebar" : "Collapse Sidebar"}>
              <img src="/logo.png" alt="SVCET Logo" className="h-10 w-10 object-contain" />
              <div className="text-xl font-bold tracking-tight flex items-center">
                SVCET<span className="text-blue-500">student</span>
              </div>
            </div>
          )}
          {effectivelyCollapsed && (
            <img src="/logo.png" alt="SVCET Logo" className="h-8 w-8 object-contain cursor-pointer transition-transform hover:scale-110" onClick={() => setIsCollapsed(false)} title="Expand Sidebar" />
          )}
          <button className="lg:hidden p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 sidebar-scroll overflow-x-hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/student'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => 
                `flex items-center py-3 rounded-xl transition-all font-medium whitespace-nowrap ${effectivelyCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} ${
                  isActive 
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                    : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                }`
              }
              title={effectivelyCollapsed ? item.name : undefined}
            >
              <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 relative">
                {item.icon}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </div>
              {!effectivelyCollapsed && (
                <div className="flex items-center justify-between flex-1 opacity-100 transition-opacity duration-300">
                  <span>{item.name}</span>
                  {item.badge > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={`p-4 border-t border-neutral-200 dark:border-neutral-800 flex ${effectivelyCollapsed ? 'justify-center' : ''}`}>
          <button 
            onClick={handleLogout}
            title={effectivelyCollapsed ? "Sign Out" : undefined}
            className={`flex items-center py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium overflow-hidden ${effectivelyCollapsed ? 'justify-center px-0 w-12' : 'gap-3 px-4 w-full'}`}
          >
            <div className="flex-shrink-0 flex items-center justify-center w-5 h-5">
              <LogOut className="w-5 h-5" />
            </div>
            {!effectivelyCollapsed && <span className="whitespace-nowrap">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative">

        {/* Header */}
        <header className="h-20 bg-white/40 dark:bg-neutral-950/40 backdrop-blur-2xl border-b border-white/20 dark:border-white/10 shadow-sm z-10 flex items-center justify-between px-6 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold hidden sm:block">Student Portal</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationCenter />
            <button 
              onClick={() => navigate('/student/profile')}
              className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 dark:hover:ring-offset-neutral-900 transition-all cursor-pointer overflow-hidden"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 z-10 relative">
          <Outlet />
        </div>
      </main>
    </div>
    <BadgeUnlockModal />
    </>
  );
};

export default StudentLayout;
