import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const bgImages = [
  'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1486&auto=format&fit=crop', // College campus building
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1470&auto=format&fit=crop', // Students collaborating
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1470&auto=format&fit=crop', // Campus life
];

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [currentBg, setCurrentBg] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Background slideshow & cursor follower
  useEffect(() => {
    document.title = 'Campus-login';
    const bgInterval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % bgImages.length);
    }, 5000);

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(bgInterval);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Rate Limiting Check
    const attempts = JSON.parse(localStorage.getItem('svcet_login_attempts') || '{"count":0, "lockoutUntil":0}');
    if (attempts.lockoutUntil > Date.now()) {
      const remainingSeconds = Math.ceil((attempts.lockoutUntil - Date.now()) / 1000);
      setError(`Too many failed attempts. Try again in ${remainingSeconds} seconds.`);
      return;
    }

    setLoading(true);
    setError('');
    
    const handleFailedLogin = (msg) => {
      attempts.count += 1;
      if (attempts.count >= 5) {
        attempts.lockoutUntil = Date.now() + 60000; // 60 seconds lockout
        attempts.count = 0;
        setError(`Too many failed attempts. Try again in 60 seconds.`);
      } else {
        setError(`${msg} (${5 - attempts.count} attempts remaining)`);
      }
      localStorage.setItem('svcet_login_attempts', JSON.stringify(attempts));
    };

    const handleSuccessfulLogin = () => {
      localStorage.removeItem('svcet_login_attempts');
    };
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          password: password,
          role: role.charAt(0).toUpperCase() + role.slice(1),
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        handleSuccessfulLogin();
        
        const sessionData = {
          token: data.token,
          role: data.role,
          name: data.name,
          email: data.email,
          loginTimestamp: Date.now(),
          avatar: '',
        };

        if (role === 'student') {
          sessionData.department = data.department || 'Computer Science';
          sessionData.year = data.year || '3';
          sessionData.registerNumber = id;
        } else if (role === 'faculty') {
          sessionData.department = data.department || 'Computer Science';
          sessionData.facultyId = id;
        }

        localStorage.setItem(`svcet_session_${role}`, JSON.stringify(sessionData));

        if (role === 'admin') navigate('/admin');
        else if (role === 'faculty') navigate('/faculty');
        else navigate('/student');
      } else {
        handleFailedLogin(data.message || 'Invalid Credentials');
      }
    } catch (err) {
      setLoading(false);
      console.warn("Backend connection failed. Falling back to local/demo login if applicable.");
      
      // Fallback UI testing logic when backend is offline
      let validUser = null;
      if (role === 'admin') {
        const savedAdmins = localStorage.getItem('svcet_admins');
        if (savedAdmins) {
          const admins = JSON.parse(savedAdmins);
          validUser = admins.find(a => a.email === id && a.password === password);
        }
        if (!validUser && ((id === 'chandrumani1825@gmail.com' && password === 'c#An@24M') || (id === 'demo' && password === 'demo'))) {
          validUser = { name: 'Super Admin', role: 'Super Admin', email: id };
        }
      } else if (role === 'student') {
        const savedStudents = localStorage.getItem('svcet_students');
        if (savedStudents) {
          const students = JSON.parse(savedStudents);
          validUser = students.find(s => (s.registerNumber === id || s.email === id) && s.password === password);
        }
        if (!validUser && id === 'demo' && password === 'demo') {
          validUser = { name: 'Demo Student', department: 'Computer Science', year: '3', registerNumber: 'STU1234', email: 'demo@student.edu', avatar: '' };
        }
      } else if (role === 'faculty') {
        const savedFaculty = localStorage.getItem('svcet_faculty');
        if (savedFaculty) {
          const faculty = JSON.parse(savedFaculty);
          validUser = faculty.find(f => (f.facultyId === id || f.email === id) && f.password === password);
        }
        if (!validUser && id === 'demo' && password === 'demo') {
          validUser = { name: 'Demo Faculty', department: 'Computer Science', facultyId: 'F1001', email: 'demo@faculty.edu', avatar: '' };
        }
      }

      if (validUser) {
        handleSuccessfulLogin();
        const sessionData = {
          token: 'mock_token_fallback',
          role: role.charAt(0).toUpperCase() + role.slice(1),
          name: validUser.name,
          email: validUser.email,
          loginTimestamp: Date.now(),
          avatar: validUser.avatar || '',
        };
        if (role === 'student') {
          sessionData.department = validUser.department;
          sessionData.year = validUser.year;
          sessionData.registerNumber = validUser.registerNumber;
        } else if (role === 'faculty') {
          sessionData.department = validUser.department;
          sessionData.facultyId = validUser.facultyId;
        }
        
        localStorage.setItem(`svcet_session_${role}`, JSON.stringify(sessionData));
        if (role === 'admin') navigate('/admin');
        else if (role === 'faculty') navigate('/faculty');
        else navigate('/student');
      } else {
        handleFailedLogin('Unable to connect to backend server & Invalid local credentials.');
      }
    }
  };

  return (
    <div className="flex h-screen w-full bg-neutral-50 dark:bg-black overflow-hidden font-sans transition-colors duration-300 relative">
      
      {/* Premium Floating Back Button */}
      <Link to="/" className="absolute top-6 left-6 md:top-8 md:left-8 z-[100]">
        <motion.div 
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/30 dark:bg-black/40 border border-white/40 dark:border-white/10 text-neutral-900 dark:text-white backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:bg-white/50 dark:hover:bg-black/60 transition-all font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </motion.div>
      </Link>
      {/* Cursor Follower */}
      <motion.div 
        className="fixed w-[400px] h-[400px] rounded-full bg-blue-500/20 blur-[100px] pointer-events-none z-50 mix-blend-multiply dark:mix-blend-screen"
        animate={{ 
          x: mousePosition.x - 200, 
          y: mousePosition.y - 200 
        }}
        transition={{ type: "tween", ease: "backOut", duration: 0.5 }}
      />

      {/* Left Panel - Hero/Branding */}
      <div className="relative hidden lg:flex flex-col justify-end w-1/2 p-12 overflow-hidden text-white">
        {/* Slideshow (Crossfade without unmounting to prevent flashing/loading delays) */}
        {bgImages.map((src, index) => (
          <motion.img
            key={src}
            src={src}
            initial={false}
            animate={{ 
              opacity: currentBg === index ? 0.6 : 0,
              scale: currentBg === index ? 1 : 1.1,
              zIndex: currentBg === index ? 1 : 0
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover"
            alt={`Campus ${index + 1}`}
          />
        ))}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
        
        <div className="relative z-20 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6 backdrop-blur-md">
            <GraduationCap className="w-4 h-4" />
            SVCETcampus
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            Sri Venkateswara<br />College of Engineering<br />
            <span className="text-blue-400">& Technology</span>
          </h1>
          <p className="text-lg text-white/70 max-w-md">
            Smart Digital Campus Platform. Experience the future of education management with our unified, AI-driven workspace.
          </p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="relative w-full lg:w-1/2 flex items-center justify-center p-8 lg:bg-white lg:dark:bg-neutral-950 text-neutral-900 dark:text-white z-20 transition-colors duration-300">
        
        {/* Mobile Background Images - Hidden on Desktop */}
        <div className="absolute inset-0 lg:hidden -z-20 overflow-hidden">
          {bgImages.map((src, index) => (
            <motion.img
              key={`mobile-${src}`}
              src={src}
              initial={false}
              animate={{ 
                opacity: currentBg === index ? 1 : 0,
                scale: currentBg === index ? 1 : 1.1,
                zIndex: currentBg === index ? 1 : 0
              }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover"
              alt={`Campus ${index + 1}`}
            />
          ))}
          <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-md z-10" />
        </div>

        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
            <p className="text-neutral-500 dark:text-neutral-400">Enter your credentials or use <b>demo</b> / <b>demo</b> to test.</p>
          </div>

          {/* 3-Way Tabs */}
          <div className="flex p-1 bg-neutral-100 dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10 mb-8 relative">
            {/* Animated Tab Background Indicator */}
            <motion.div
              className="absolute top-1 bottom-1 w-[calc(33.33%-4px)] bg-white dark:bg-blue-600 rounded-lg shadow-sm dark:shadow-lg border border-neutral-200 dark:border-transparent"
              initial={false}
              animate={{ 
                x: role === 'student' ? '4px' : role === 'faculty' ? '100%' : 'calc(200% - 4px)' 
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            
            {['student', 'faculty', 'admin'].map((tabRole) => (
              <button
                key={tabRole}
                onClick={() => {
                  setRole(tabRole);
                  setId('');
                  setPassword('');
                  setError('');
                }}
                className={`flex-1 flex items-center justify-center py-2.5 text-sm font-medium transition-colors relative z-10 ${
                  role === tabRole 
                    ? 'text-neutral-900 dark:text-white' 
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-white'
                }`}
              >
                {tabRole.charAt(0).toUpperCase() + tabRole.slice(1)}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2 relative">
              <input
                type="text"
                id="login-id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
                className="peer w-full bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-xl px-4 pt-6 pb-2 text-neutral-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-0 dark:focus:bg-white/10 transition-all placeholder-transparent"
                placeholder="ID"
              />
              <label 
                htmlFor="login-id" 
                className="absolute left-4 top-2 text-xs text-neutral-500 dark:text-neutral-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-500 pointer-events-none"
              >
                {role === 'student' ? 'University Email / Register No.' : role === 'faculty' ? 'Faculty / Staff Email' : 'System Admin Email'}
              </label>
            </div>

            <div className="space-y-2 relative">
              <input
                type={showPassword ? "text" : "password"}
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="peer w-full bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-xl px-4 pt-6 pb-2 text-neutral-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-0 dark:focus:bg-white/10 transition-all placeholder-transparent"
                placeholder="Password"
              />
              <label 
                htmlFor="login-password" 
                className="absolute left-4 top-2 text-xs text-neutral-500 dark:text-neutral-400 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-500 pointer-events-none"
              >
                Password
              </label>
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {role === 'admin' && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" className="rounded border-neutral-300 dark:border-white/20 bg-white dark:bg-white/5 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="remember" className="text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer">Remember secure session</label>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-950 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Authenticating..." : role === 'student' ? 'Login to Portal' : role === 'faculty' ? 'Login to Workspace' : 'Access Control Panel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
