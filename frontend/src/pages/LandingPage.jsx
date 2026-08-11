import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Laptop, Brain, Cloud, ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

const LandingPage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    document.title = 'SVCETcampus';
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleMouseMove = (e) => {
      if (!isMobile) {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', checkMobile);
    };
  }, [isMobile]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-neutral-50 dark:bg-[#050505] text-neutral-900 dark:text-white overflow-x-hidden relative font-sans selection:bg-blue-500/30 transition-colors duration-300">
      
      {/* Animated Background Blobs (Hidden on Mobile) */}
      <div className="hidden md:block absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="hidden md:block absolute top-[20%] right-[-10%] w-[35rem] h-[35rem] bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="hidden md:block absolute bottom-[-20%] left-[20%] w-[40rem] h-[40rem] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Cursor Follower (Hidden on Mobile) */}
      {!isMobile && (
        <>
          <motion.div 
            className="fixed w-8 h-8 rounded-full border border-black/20 dark:border-white/20 pointer-events-none z-50 mix-blend-difference"
            animate={{ 
              x: mousePosition.x - 16, 
              y: mousePosition.y - 16 
            }}
            transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.5 }}
          />
          <motion.div 
            className="fixed w-1.5 h-1.5 bg-black dark:bg-white rounded-full pointer-events-none z-50 mix-blend-difference"
            animate={{ 
              x: mousePosition.x - 3, 
              y: mousePosition.y - 3 
            }}
            transition={{ type: "spring", stiffness: 1000, damping: 28, mass: 0.1 }}
          />
        </>
      )}

      {/* Premium Navbar */}
      <nav className="fixed w-full z-40 top-0 border-b border-black/5 dark:border-white/5 bg-white/70 dark:bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            SVCET<span className="text-blue-600 dark:text-blue-500">campus</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/login">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black font-bold shadow-md hover:shadow-lg transition-all"
              >
                Enter Portal
              </motion.button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 relative z-10 pt-32 px-6 max-w-7xl mx-auto w-full">
        {/* Hero Section */}
        <section className="min-h-[70dvh] flex flex-col items-center justify-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 text-sm font-semibold text-blue-700 dark:text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
          >
            <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" /> SVCET Version 3.0 is live
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] mb-6"
          >
            Learn. Build. Grow.<br />
            It <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">codes with you.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
          >
            The premium academic operating system. Experience real-time collaboration, AI-powered insights, and seamless cloud workflows — engineered for the future of education.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link to="/login" className="w-full sm:w-auto">
              <button className="group w-full px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(79,70,229,0.3)] transition-all">
                Get started 
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </motion.div>
        </section>

        {/* Bento Grid Features Section */}
        <section className="pt-20 pb-10 md:pt-32 md:pb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Engineered for excellence
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 font-medium text-lg">
              A complete suite of premium tools designed to elevate your academic experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Main Feature - Spans 2 columns on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -5 }}
              className="md:col-span-2 p-8 md:p-10 rounded-3xl bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 shadow-xl backdrop-blur-xl group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-500/20 transition-colors"></div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform relative z-10">
                <Laptop className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-3 relative z-10">Live Code Labs</h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed relative z-10 text-lg max-w-md">
                Interactive sandbox environments, real-time feedback, and smart debugging — everything runs instantly in the cloud, perfectly synced with your curriculum.
              </p>
            </motion.div>

            {/* Square Feature */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5 }}
              className="p-8 rounded-3xl bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 shadow-xl backdrop-blur-xl group overflow-hidden relative"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform relative z-10">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 relative z-10">AI Mentorship</h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed relative z-10">
                Personalized learning paths, instant doubt solving, and a 24/7 AI tutor that adapts to your pace.
              </p>
            </motion.div>

            {/* Square Feature */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="p-8 rounded-3xl bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 shadow-xl backdrop-blur-xl group overflow-hidden relative"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform relative z-10">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 relative z-10">Enterprise Security</h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed relative z-10">
                Bank-grade encryption for all academic records, ensuring your data is safe, private, and always available.
              </p>
            </motion.div>

            {/* Horizontal Feature - Spans 2 columns on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -5 }}
              className="md:col-span-2 p-8 md:p-10 rounded-3xl bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 shadow-xl backdrop-blur-xl group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-indigo-500/20 transition-colors"></div>
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-red-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Seamless Cloud Sync</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-lg max-w-xl">
                    Cloud-native collaboration, real-time project versioning, and cross-device continuity. Start coding on your laptop, finish reviewing on your phone — always in flow.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-neutral-200 dark:border-white/10 pt-12 pb-2 md:pt-16 md:pb-4 text-neutral-500 relative z-10 bg-neutral-50/80 dark:bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
            
            {/* Brand Column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 text-2xl font-black tracking-tight text-neutral-900 dark:text-white mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                SVCET<span className="text-blue-600 dark:text-blue-500">campus</span>
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed mb-6">
                The premium academic operating system designed for next-generation learning. Seamless cloud synchronization, AI mentorship, and interactive coding labs.
              </p>
              <div className="flex gap-4">
                {/* Placeholder Social Icons */}
                <div className="w-10 h-10 rounded-full border border-neutral-200 dark:border-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
                </div>
                <div className="w-10 h-10 rounded-full border border-neutral-200 dark:border-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer transition-colors">
                  <span className="sr-only">GitHub</span>
                  <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                </div>
              </div>
            </div>

            {/* Links Column 1 */}
            <div>
              <h4 className="font-bold text-neutral-900 dark:text-white mb-4">Platform</h4>
              <ul className="space-y-3">
                <li><Link to="/login" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Student Portal</Link></li>
                <li><Link to="/login" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Faculty Workspace</Link></li>
                <li><Link to="/login" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Admin Console</Link></li>
                <li><Link to="/login" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Code Labs</Link></li>
              </ul>
            </div>

            {/* Links Column 2 */}
            <div>
              <h4 className="font-bold text-neutral-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About ZORVEX</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 mt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-xs md:text-sm">© 2026 SVCETcampus. All rights reserved.</p>
            <div className="flex items-center">
              <p className="text-xs md:text-sm font-semibold tracking-widest uppercase text-neutral-500">
                Powered by <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">ZORVEX</span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
