import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Users, BookOpen, Calendar, Bell, LayoutDashboard, LogOut, Menu, X, Settings2, Building2, Code2, MessageSquare, MessageCircle, BarChart3, PanelLeftClose, PanelLeftOpen, ClipboardList , User, Mail, Shield, Phone, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '../ThemeToggle';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMessages } from '@/hooks/useMessages';
import { useAdmins } from '@/hooks/useAdmins';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed for smart sidebar
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const effectivelyCollapsed = isCollapsed && !isHovered;

  useEffect(() => {
    document.title = 'SVCET admin';
    const user = JSON.parse(localStorage.getItem('svcet_session_admin'));
    
    if (!user || user.role !== 'Admin') {
      navigate('/login');
      return;
    }

    // 8 hour session timeout (8 * 60 * 60 * 1000 = 28800000 ms)
    if (user.loginTimestamp && Date.now() - user.loginTimestamp > 28800000) {
      localStorage.removeItem('svcet_session_admin');
      navigate('/login');
    }
  }, [navigate]);

  const [user, setUser] = useState(JSON.parse(localStorage.getItem('svcet_session_admin')) || { name: 'Admin' });
  const { admins, updateAdmin } = useAdmins();
  const realUser = admins.find(a => a.name === user.name) || user;

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(JSON.parse(localStorage.getItem('svcet_session_admin')) || { name: 'Admin' });
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  const { messages } = useMessages();
  const sessionUser = JSON.parse(localStorage.getItem('svcet_session_admin')) || { name: 'Admin' };
  const initials = sessionUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const unreadMessagesCount = messages.filter(m => m.receiverName === sessionUser.name && !m.isRead).length;

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        const updatedUser = { ...sessionUser, avatar: base64String };
        localStorage.setItem('svcet_session_admin', JSON.stringify(updatedUser));
        setUser(updatedUser);
        if (realUser.id) {
          updateAdmin(realUser.id, { avatar: base64String });
        }
        window.dispatchEvent(new Event('storage'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('svcet_session_admin');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Students', path: '/admin/students', icon: <Users className="w-5 h-5" /> },
    { name: 'Faculty', path: '/admin/faculty', icon: <GraduationCap className="w-5 h-5" /> },
    ...(user.role === 'Super Admin' ? [{ name: 'Departments', path: '/admin/departments', icon: <Building2 className="w-5 h-5" /> }] : []),
    { name: 'Courses', path: '/admin/courses', icon: <BookOpen className="w-5 h-5" /> },
    { name: 'Timetable', path: '/admin/timetable', icon: <Calendar className="w-5 h-5" /> },
    { name: 'Daily Tasks', path: '/admin/daily-tasks', icon: <Code2 className="w-5 h-5" /> },
    { name: 'Notices', path: '/admin/notices', icon: <Bell className="w-5 h-5" /> },
    { name: 'Reports', path: '/admin/reports', icon: <BarChart3 className="w-5 h-5" /> },
    { name: 'Feedback', path: '/admin/feedback', icon: <MessageCircle className="w-5 h-5" /> },
    { name: 'Messages', path: '/admin/messages', icon: <MessageSquare className="w-5 h-5" />, badge: unreadMessagesCount },
    { name: 'Requests', path: '/admin/requests', icon: <ClipboardList className="w-5 h-5" /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings2 className="w-5 h-5" /> },
  ];

  return (
    <>
      <div className="flex h-[100dvh] bg-neutral-50 dark:bg-[#0a0a0a] text-neutral-900 dark:text-white transition-colors duration-300 font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-all duration-300 will-change-transform flex flex-col ${effectivelyCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className={`flex items-center h-20 border-b border-neutral-200 dark:border-neutral-800 ${effectivelyCollapsed ? 'justify-center' : 'justify-between px-6'}`}>
          {!effectivelyCollapsed && (
            <div className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105" onClick={() => setIsCollapsed(!isCollapsed)} title={isCollapsed ? "Pin Sidebar" : "Collapse Sidebar"}>
              <img src="/logo.png" alt="SVCET Logo" className="h-10 w-10 object-contain" />
              <div className="text-xl font-bold tracking-tight flex items-center">
                SVCET<span className="text-blue-500">admin</span>
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
              end={item.path === '/admin'}
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
              <div className="relative flex-shrink-0 flex items-center justify-center w-5 h-5">
                {item.icon}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-neutral-950" />
                )}
              </div>
              {!effectivelyCollapsed && (
                <div className="flex items-center justify-between w-full opacity-100 transition-opacity duration-300">
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
            <h2 className="text-xl font-semibold hidden sm:block">Control Panel</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-md hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 dark:hover:ring-offset-neutral-900 transition-all cursor-pointer overflow-hidden"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-4 md:p-8 z-10">
          <Outlet />
        </div>

        {/* Profile Modal */}
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogContent className="sm:max-w-md backdrop-blur-xl bg-white/70 dark:bg-neutral-900/70 border-white/20 dark:border-neutral-800/50 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold">Admin Profile</DialogTitle>
            </DialogHeader>
            <div className="mt-4 flex flex-col items-center">
              <div className="relative group">
                <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg ring-4 ring-indigo-50 dark:ring-indigo-900/30 mb-4 overflow-hidden">
                  {realUser?.avatar ? (
                    <img src={realUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <label className="absolute bottom-4 right-0 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors opacity-0 group-hover:opacity-100">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{realUser?.name || ''}</h2>
              <p className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-2 mt-1">
                <Shield className="w-4 h-4" /> {realUser?.role || ''}
              </p>
            </div>
            <div className="space-y-4 mt-6">
              {realUser?.email && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm border border-white/30 dark:border-neutral-700/30">
                  <Mail className="w-5 h-5 text-neutral-500" />
                  <div>
                    <p className="text-xs text-neutral-500">Email Address</p>
                    <p className="text-sm font-medium">{realUser.email}</p>
                  </div>
                </div>
              )}
              {realUser?.phone && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm border border-white/30 dark:border-neutral-700/30">
                  <Phone className="w-5 h-5 text-neutral-500" />
                  <div>
                    <p className="text-xs text-neutral-500">Phone Number</p>
                    <p className="text-sm font-medium">{realUser.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </main>
    </div>
    </>
  );
};

export default AdminLayout;
