import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, FolderGit2, Award, FileText, Plus, X, Edit2, Trash2,
  ExternalLink, GitBranch, Search, Filter, Heart, MessageCircle,
  Send, Share2, Bookmark, Image, Link2, Hash, Calendar, Building2,
  CheckCircle, Star, Sparkles, TrendingUp, Eye, Clock, MoreHorizontal,
  ChevronDown, Globe, Lock, Flame, Zap, Target, AlignLeft, Camera, Download, Paperclip
} from 'lucide-react';
import { useProfessionalProfile } from '@/hooks/useProfessionalProfile';
import { saveFileContent, getFileContent } from '@/utils/fileStorage';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const initials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ─── POST TYPES CONFIG ───────────────────────────────────────────────────────
const POST_TYPES = [
  { value: 'achievement', label: '🏆 Achievement', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { value: 'project', label: '🚀 Project Update', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'learning', label: '📚 Learning', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'hackathon', label: '⚡ Hackathon', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'certification', label: '🎓 Certification', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  { value: 'milestone', label: '🎯 Milestone', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  { value: 'general', label: '💬 General', color: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400' },
];

// ─── PROJECT STATUS CONFIG ────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Completed:    { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',   dot: 'bg-green-500' },
  'In Progress': { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', dot: 'bg-yellow-500' },
  Planned:      { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',       dot: 'bg-blue-500' },
};

// ─── CERTIFICATE CATEGORIES ───────────────────────────────────────────────────
const CERT_CATEGORIES = ['Technical', 'Cloud', 'Language', 'Design', 'Management', 'Other'];
const CERT_CAT_COLORS = {
  Technical: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Cloud: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  Language: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Design: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Management: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Other: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
};

const getIssuerEmoji = (issuer = '') => {
  const map = { google: '🌐', aws: '☁️', microsoft: '🪟', coursera: '🎓', udemy: '📚', nptel: '🏛️', linkedin: '💼', oracle: '🔴', cisco: '🌐' };
  const key = Object.keys(map).find(k => issuer.toLowerCase().includes(k));
  return map[key] || '🏅';
};

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = ['Overview', 'Posts', 'Projects', 'Certificates'];

// ─── ATTACHMENT VIEWER ────────────────────────────────────────────────────────
const AttachmentViewer = ({ attachment }) => {
  const [url, setUrl] = useState(null);

  React.useEffect(() => {
    let objectUrl;
    getFileContent(attachment.id).then(file => {
      if (file) {
        objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
      }
    }).catch(console.error);

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.id]);

  if (!url) return <div className="h-20 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-lg flex items-center justify-center text-xs text-neutral-400 border border-neutral-200 dark:border-neutral-700">Loading {attachment.name}...</div>;

  const isImage = attachment.type.startsWith('image/');

  if (isImage) {
    return (
      <div className="relative group">
        <img src={url} alt={attachment.name} className="max-h-80 w-auto rounded-xl object-cover border border-neutral-200 dark:border-neutral-700 cursor-pointer" onClick={() => window.open(url, '_blank')} />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-1.5 rounded-lg cursor-pointer" onClick={() => window.open(url, '_blank')} title="View Full Image">
          <Eye className="w-4 h-4 text-white" />
        </div>
      </div>
    );
  }

  return (
    <a href={url} download={attachment.name} className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors w-full sm:w-2/3">
      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg"><FileText className="w-6 h-6 text-blue-500" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{attachment.name}</p>
        <p className="text-xs text-neutral-500">{(attachment.size / 1024).toFixed(0)} KB • Click to download</p>
      </div>
      <Download className="w-4 h-4 text-neutral-400" />
    </a>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const AchievementsPage = () => {
  const user = JSON.parse(localStorage.getItem('svcet_session_student')) || {};
  const {
    profile, activityFeed, allFeed,
    addProject, updateProject, removeProject,
    addCertificate, updateCertificate, removeCertificate,
    postStatus, likeActivity, commentOnActivity,
    profileStrength
  } = useProfessionalProfile();

  // Read leaderboard stats for this student directly from localStorage
  const leaderboardData = (() => {
    try {
      const data = JSON.parse(localStorage.getItem('svcet_leaderboard')) || [];
      return data.find(s => s.name === user.name) || { stars: 0, streak: 0, badges: [] };
    } catch { return { stars: 0, streak: 0, badges: [] }; }
  })();

  const [activeTab, setActiveTab] = useState('Overview');

  const projects = profile.projects || [];
  const certificates = profile.certificates || [];

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Posts', value: activityFeed.length, icon: <FileText className="w-5 h-5" />, color: 'from-blue-500 to-indigo-500', light: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
    { label: 'Projects', value: projects.length, icon: <FolderGit2 className="w-5 h-5" />, color: 'from-indigo-500 to-purple-500', light: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Certificates', value: certificates.length, icon: <Award className="w-5 h-5" />, color: 'from-amber-500 to-orange-500', light: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
    { label: 'Stars Earned', value: leaderboardData.stars, icon: <Star className="w-5 h-5" />, color: 'from-yellow-500 to-amber-500', light: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400' },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-6">

      {/* ── Hero Banner ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-7 text-white shadow-2xl"
      >
        {/* Decorative dots */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{ width: Math.random() * 8 + 2, height: Math.random() * 8 + 2, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }} />
          ))}
        </div>
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-6 h-6 text-yellow-300" />
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase">Achievements</span>
            </div>
            <h1 className="text-3xl font-bold mb-1">Your Journey & Milestones</h1>
            <p className="text-white/70 text-sm max-w-md">Showcase your posts, projects, and certifications — all in one place. Let your work speak for itself.</p>
          </div>
          {/* Profile strength ring */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="white" strokeWidth="8"
                  strokeDasharray={`${(profileStrength / 100) * 213.6} 213.6`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{profileStrength}%</span>
              </div>
            </div>
            <span className="text-white/80 text-xs font-medium">Profile Strength</span>
          </div>
        </div>
      </motion.div>

      {/* ── Stats Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
            className={`${s.light} rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 flex items-center gap-3`}
          >
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${s.color} text-white shadow-sm`}>{s.icon}</div>
            <div>
              <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
              <p className="text-xs text-neutral-500">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-2xl w-fit">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === tab
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-md'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'Overview' && <OverviewTab projects={projects} certificates={certificates} posts={activityFeed} allFeed={allFeed} userStats={leaderboardData} setActiveTab={setActiveTab} />}
        {activeTab === 'Posts'    && <PostsTab user={user} allFeed={allFeed} postStatus={postStatus} likeActivity={likeActivity} commentOnActivity={commentOnActivity} />}
        {activeTab === 'Projects' && <ProjectsTab projects={projects} addProject={addProject} updateProject={updateProject} removeProject={removeProject} />}
        {activeTab === 'Certificates' && <CertificatesTab certificates={certificates} addCertificate={addCertificate} updateCertificate={updateCertificate} removeCertificate={removeCertificate} />}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════════════════════
const OverviewTab = ({ projects, certificates, posts, allFeed, userStats, setActiveTab }) => {
  const recentActivity = [...allFeed].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

  return (
    <motion.div key="overview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

      {/* Recent Activity Feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" /> Recent Activity
          </h2>
          <button onClick={() => setActiveTab('Posts')} className="text-sm text-blue-500 hover:text-blue-600 font-medium">View all →</button>
        </div>
        {recentActivity.length === 0 ? (
          <div className="bg-white/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 p-10 text-center text-neutral-500">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-medium">No activity yet</p>
            <p className="text-sm">Share your first achievement!</p>
            <button onClick={() => setActiveTab('Posts')} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors">Post Now</button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((a, i) => {
              const typeInfo = POST_TYPES.find(t => t.value === a.type) || POST_TYPES.find(t => t.value === 'general');
              return (
                <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {initials(a.author)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-neutral-900 dark:text-white">{a.author}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo?.color}`}>{typeInfo?.label}</span>
                      <span className="text-xs text-neutral-400 ml-auto">{timeAgo(a.timestamp)}</span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">{a.text}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{a.likes?.length || 0}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{a.comments?.length || 0}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-indigo-500" /> Projects
            </h2>
            <button onClick={() => setActiveTab('Projects')} className="text-sm text-blue-500 hover:text-blue-600 font-medium">View all →</button>
          </div>
          {projects.length === 0 ? (
            <div className="bg-white/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center text-neutral-500">
              <FolderGit2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No projects yet</p>
              <button onClick={() => setActiveTab('Projects')} className="mt-3 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-xs font-medium transition-colors">Add Project</button>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 3).map(p => (
                <div key={p.id} className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
                  <div className="flex items-start justify-between mb-1.5">
                    <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">{p.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[p.status]?.color || STATUS_CONFIG.Completed.color}`}>{p.status || 'Completed'}</span>
                  </div>
                  <p className="text-xs text-neutral-500 line-clamp-1 mb-2">{p.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(p.techStack) ? p.techStack : (p.techStack || '').split(',')).slice(0, 3).map(t => (
                      <span key={t} className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded-full">{t.trim()}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Certificates */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Certificates
            </h2>
            <button onClick={() => setActiveTab('Certificates')} className="text-sm text-blue-500 hover:text-blue-600 font-medium">View all →</button>
          </div>
          {certificates.length === 0 ? (
            <div className="bg-white/50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center text-neutral-500">
              <Award className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No certificates yet</p>
              <button onClick={() => setActiveTab('Certificates')} className="mt-3 bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-xl text-xs font-medium transition-colors">Add Certificate</button>
            </div>
          ) : (
            <div className="space-y-3">
              {certificates.slice(0, 3).map(c => (
                <div key={c.id} className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 flex items-center gap-3">
                  <div className="text-2xl">{getIssuerEmoji(c.issuer)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-neutral-900 dark:text-white truncate">{c.title}</p>
                    <p className="text-xs text-neutral-500">{c.issuer || 'Unknown Issuer'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CERT_CAT_COLORS[c.category] || CERT_CAT_COLORS.Other}`}>{c.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Streak & Badges row */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 dark:from-yellow-500/20 dark:to-orange-500/20 rounded-2xl border border-yellow-200 dark:border-yellow-800 p-5 flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl"><Flame className="w-6 h-6 text-orange-500" /></div>
          <div>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{userStats.streak}</p>
            <p className="text-xs text-neutral-500">Day Streak</p>
          </div>
        </div>
        <div className="w-px h-10 bg-neutral-200 dark:bg-neutral-700" />
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl"><Star className="w-6 h-6 text-yellow-500" /></div>
          <div>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{userStats.stars}</p>
            <p className="text-xs text-neutral-500">Total Stars</p>
          </div>
        </div>
        {userStats.badges?.length > 0 && (
          <>
            <div className="w-px h-10 bg-neutral-200 dark:bg-neutral-700" />
            <div className="flex-1">
              <p className="text-xs text-neutral-500 mb-1.5">Badges Earned</p>
              <div className="flex flex-wrap gap-1.5">
                {userStats.badges.slice(0, 6).map((b, i) => (
                  <span key={i} className="text-lg" title={typeof b === 'string' ? b : b.name}>{typeof b === 'string' ? '🏅' : b.icon || '🏅'}</span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// POSTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
const PostsTab = ({ user, allFeed, postStatus, likeActivity, commentOnActivity }) => {
  const [postText, setPostText] = useState('');
  const [postType, setPostType] = useState('general');
  const [postTags, setPostTags] = useState('');
  const [postAttachments, setPostAttachments] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [openComments, setOpenComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [expandedPost, setExpandedPost] = useState(null);
  const textRef = useRef(null);
  const fileInputRef = useRef(null);

  const sorted = [...allFeed].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const filtered = sorted.filter(p => {
    const matchSearch = p.text?.toLowerCase().includes(search.toLowerCase()) || p.author?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'All' || p.type === filterType;
    return matchSearch && matchType;
  });

  const handleShare = async (post) => {
    const shareUrl = `${window.location.origin}/student/achievements?post=${post.id}`;
    const shareData = {
      title: `${post.author}'s Post on SVCET Campus`,
      text: post.text ? post.text.substring(0, 100) + '...' : 'Check out this post!',
      url: shareUrl
    };

    if (navigator.share && window.isSecureContext) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setPostAttachments(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handlePost = async () => {
    if (!postText.trim() && postAttachments.length === 0) return;
    setIsPosting(true);
    try {
      const savedAttachments = [];
      for (const file of postAttachments) {
        const fileId = `post-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        await saveFileContent(fileId, file);
        savedAttachments.push({ id: fileId, name: file.name, type: file.type, size: file.size });
      }

      const tags = postTags.split(',').map(t => t.trim()).filter(Boolean);
      postStatus(postText, tags, postType, savedAttachments);
      
      setPostText('');
      setPostTags('');
      setPostType('general');
      setPostAttachments([]);
      setShowCompose(false);
    } catch (err) {
      console.error("Failed to post:", err);
      alert("Failed to upload attachments. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleComment = (id) => {
    const text = commentText[id];
    if (!text?.trim()) return;
    commentOnActivity(id, text);
    setCommentText(p => ({ ...p, [id]: '' }));
  };

  return (
    <motion.div key="posts" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

      {/* Compose Button / Card */}
      {!showCompose ? (
        <button onClick={() => { setShowCompose(true); setTimeout(() => textRef.current?.focus(), 100); }}
          className="w-full flex items-center gap-3 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 hover:border-blue-400 dark:hover:border-blue-600 transition-all text-left shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {initials(user.name)}
          </div>
          <span className="text-neutral-400 flex-1">Share an achievement, project update, or milestone…</span>
          <Plus className="w-5 h-5 text-blue-500 flex-shrink-0" />
        </button>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-2xl border border-blue-400 dark:border-blue-600 p-5 shadow-lg space-y-4"
        >
          {/* Author row */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{initials(user.name)}</div>
            <div>
              <p className="font-semibold text-neutral-900 dark:text-white text-sm">{user.name}</p>
              {/* Type selector */}
              <select value={postType} onChange={e => setPostType(e.target.value)}
                className="text-xs bg-transparent text-blue-600 dark:text-blue-400 font-medium focus:outline-none cursor-pointer mt-0.5"
              >
                {POST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <button onClick={() => setShowCompose(false)} className="ml-auto p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          </div>

          {/* Text area */}
          <textarea ref={textRef} value={postText} onChange={e => setPostText(e.target.value)}
            placeholder="What did you achieve today? Share your journey with the campus…"
            rows={4}
            className="w-full bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          {/* Tags & Attachments Select */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Hash className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <input value={postTags} onChange={e => setPostTags(e.target.value)} placeholder="Add tags (comma separated)"
                className="flex-1 bg-neutral-50 dark:bg-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs font-semibold transition-colors">
              <Paperclip className="w-3.5 h-3.5" /> Attach
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,.pdf,.doc,.docx,.txt" />
          </div>

          {/* Selected Attachments Preview */}
          {postAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              {postAttachments.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                  {f.type.startsWith('image/') ? <Image className="w-3.5 h-3.5 text-blue-500" /> : <FileText className="w-3.5 h-3.5 text-blue-500" />}
                  <span className="truncate max-w-[120px]">{f.name}</span>
                  <button onClick={() => setPostAttachments(p => p.filter((_, idx) => idx !== i))} className="ml-1 hover:text-red-500"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}

          {/* Character count & submit */}
          <div className="flex items-center justify-between">
            <span className={`text-xs ${postText.length > 500 ? 'text-red-500' : 'text-neutral-400'}`}>{postText.length}/500</span>
            <div className="flex gap-2">
              <button onClick={() => { setShowCompose(false); setPostAttachments([]); }} className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
              <button onClick={handlePost} disabled={(!postText.trim() && postAttachments.length === 0) || postText.length > 500 || isPosting}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-2"
              >
                {isPosting ? <span className="animate-pulse">Posting...</span> : <><Send className="w-4 h-4" /> Post</>}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-xl text-sm"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {['All', ...POST_TYPES.map(t => t.value)].slice(0, 5).map(type => (
            <button key={type} onClick={() => setFilterType(type)}
              className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filterType === type ? 'bg-blue-500 text-white' : 'bg-white/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'}`}
            >
              {type === 'All' ? 'All' : POST_TYPES.find(t => t.value === type)?.label || type}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-14 h-14 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
          <p className="font-semibold text-neutral-600 dark:text-neutral-400">{allFeed.length === 0 ? 'No posts yet' : 'No matching posts'}</p>
          <p className="text-sm text-neutral-400">{allFeed.length === 0 ? 'Be the first to share something!' : 'Try different filters'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map((post, i) => {
              const typeInfo = POST_TYPES.find(t => t.value === post.type) || POST_TYPES.find(t => t.value === 'general');
              const isExpanded = expandedPost === post.id;
              const liked = post.likes?.includes(user.name);
              const commentsOpen = openComments[post.id];

              return (
                <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04 }}
                  className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Post Header */}
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {initials(post.author)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-neutral-900 dark:text-white">{post.author}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo?.color}`}>{typeInfo?.label}</span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">{timeAgo(post.timestamp)}</p>
                      </div>
                    </div>

                    {/* Post Text */}
                    <p className={`text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap ${!isExpanded && post.text?.length > 200 ? 'line-clamp-4' : ''}`}>
                      {post.text}
                    </p>
                    {post.text?.length > 200 && (
                      <button onClick={() => setExpandedPost(isExpanded ? null : post.id)} className="text-xs text-blue-500 hover:text-blue-600 font-medium mt-1 mb-2 block">
                        {isExpanded ? 'Show less' : 'Read more'}
                      </button>
                    )}

                    {/* Attachments */}
                    {post.attachments?.length > 0 && (
                      <div className="mt-4 flex flex-col gap-3">
                        {post.attachments.map(att => (
                          <AttachmentViewer key={att.id} attachment={att} />
                        ))}
                      </div>
                    )}

                    {/* Tags */}
                    {post.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {post.tags.map(tag => (
                          <span key={tag} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Post Actions */}
                  <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-1">
                    <button onClick={() => likeActivity(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${liked ? 'text-pink-600 bg-pink-50 dark:bg-pink-900/20' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                    >
                      <Heart className={`w-4 h-4 ${liked ? 'fill-pink-500 text-pink-500' : ''}`} />
                      {post.likes?.length || 0}
                    </button>
                    <button onClick={() => setOpenComments(p => ({ ...p, [post.id]: !p[post.id] }))}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                    >
                      <MessageCircle className="w-4 h-4" /> {post.comments?.length || 0}
                    </button>
                    <button onClick={() => handleShare(post)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all ml-auto">
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  </div>

                  {/* Comments Section */}
                  <AnimatePresence>
                    {commentsOpen && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="border-t border-neutral-100 dark:border-neutral-800 px-5 py-4 space-y-3"
                      >
                        {post.comments?.map(c => (
                          <div key={c.id} className="flex gap-2.5 items-start">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {initials(c.author)}
                            </div>
                            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl rounded-tl-sm px-3 py-2 flex-1">
                              <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{c.author}</p>
                              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">{c.text}</p>
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2.5 items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {initials(user.name)}
                          </div>
                          <div className="flex gap-2 flex-1">
                            <input value={commentText[post.id] || ''} onChange={e => setCommentText(p => ({ ...p, [post.id]: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                              placeholder="Write a comment…"
                              className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button onClick={() => handleComment(post.id)} disabled={!commentText[post.id]?.trim()}
                              className="p-2 bg-blue-500 disabled:opacity-40 text-white rounded-xl hover:bg-blue-600 transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
const EMPTY_PROJECT = { title: '', description: '', techStack: '', githubUrl: '', liveUrl: '', status: 'Completed' };

const ProjectsTab = ({ projects, addProject, updateProject, removeProject }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_PROJECT);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewMode, setViewMode] = useState('grid');

  const openAdd = () => { setForm(EMPTY_PROJECT); setEditingId(null); setShowForm(true); };
  const openEdit = (p) => {
    setForm({ title: p.title, description: p.description || '', techStack: Array.isArray(p.techStack) ? p.techStack.join(', ') : (p.techStack || ''), githubUrl: p.githubUrl || '', liveUrl: p.liveUrl || '', status: p.status || 'Completed' });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    const techStack = form.techStack.split(',').map(t => t.trim()).filter(Boolean);
    editingId ? updateProject(editingId, { ...form, techStack }) : addProject({ ...form, techStack });
    setShowForm(false); setForm(EMPTY_PROJECT); setEditingId(null);
  };

  const filtered = projects.filter(p => {
    const s = `${p.title} ${p.description} ${Array.isArray(p.techStack) ? p.techStack.join(' ') : p.techStack}`.toLowerCase();
    return s.includes(search.toLowerCase()) && (filterStatus === 'All' || p.status === filterStatus);
  });

  return (
    <motion.div key="projects" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 backdrop-blur-xl text-sm"
          />
        </div>
        <div className="flex gap-1.5">
          {['All', 'Completed', 'In Progress', 'Planned'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filterStatus === s ? 'bg-indigo-500 text-white' : 'bg-white/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm ml-auto">
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="text-center py-20">
          <FolderGit2 className="w-16 h-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
          <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-1">No Projects Yet</h3>
          <p className="text-sm text-neutral-400 mb-6">Showcase your work — add your first project to the portfolio.</p>
          <button onClick={openAdd} className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors">Add Your First Project</button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AnimatePresence>
          {filtered.map((p, i) => {
            const tech = Array.isArray(p.techStack) ? p.techStack : (p.techStack || '').split(',').map(t => t.trim()).filter(Boolean);
            const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.Completed;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}
                className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
              >
                {/* Gradient top bar */}
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                      <h3 className="font-bold text-neutral-900 dark:text-white">{p.title}</h3>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>{p.status || 'Completed'}</span>
                  </div>

                  <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3 mb-3 flex-1">{p.description}</p>

                  {/* Tech Stack */}
                  {tech.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {tech.slice(0, 5).map(t => (
                        <span key={t} className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full font-medium">{t}</span>
                      ))}
                      {tech.length > 5 && <span className="text-xs text-neutral-400">+{tech.length - 5}</span>}
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex gap-2 mb-4">
                    {p.githubUrl && (
                      <a href={p.githubUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                      >
                        <GitBranch className="w-3.5 h-3.5" /> Code
                      </a>
                    )}
                    {p.liveUrl && (
                      <a href={p.liveUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                      </a>
                    )}
                  </div>

                  <p className="text-xs text-neutral-400">
                    Added {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-3.5 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
                  <button onClick={() => openEdit(p)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setConfirmDelete(p.id)} className="flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* No filter results */}
      {projects.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          <p className="font-medium">No projects match your filter</p>
          <button onClick={() => { setSearch(''); setFilterStatus('All'); }} className="mt-2 text-sm text-blue-500 hover:underline">Clear filters</button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-lg border border-neutral-200 dark:border-neutral-800 shadow-2xl max-h-[92vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <FolderGit2 className="w-5 h-5 text-indigo-500" />{editingId ? 'Edit Project' : 'Add Project'}
                  </h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Project Title *', key: 'title', placeholder: 'e.g., Smart Attendance System' },
                    { label: 'Tech Stack (comma separated)', key: 'techStack', placeholder: 'React, Node.js, MongoDB' },
                    { label: 'GitHub URL', key: 'githubUrl', placeholder: 'https://github.com/username/repo' },
                    { label: 'Live Demo URL', key: 'liveUrl', placeholder: 'https://yourapp.vercel.app' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">{f.label}</label>
                      <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">Description</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} placeholder="Describe your project, its purpose, and key features…"
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">Status</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Completed', 'In Progress', 'Planned'].map(s => (
                        <button key={s} onClick={() => setForm(p => ({ ...p, status: s }))}
                          className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${form.status === s ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-400'}`}
                        >
                          <span className={`w-2 h-2 rounded-full inline-block mr-1.5 ${STATUS_CONFIG[s].dot}`} />{s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleSave} disabled={!form.title.trim()}
                    className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />{editingId ? 'Save Changes' : 'Add Project'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm border border-neutral-200 dark:border-neutral-800 shadow-2xl text-center"
            >
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 className="w-7 h-7 text-red-500" /></div>
              <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Delete Project?</h3>
              <p className="text-sm text-neutral-500 mb-5">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 font-medium transition-colors">Cancel</button>
                <button onClick={() => { removeProject(confirmDelete); setConfirmDelete(null); }} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CERTIFICATES TAB
// ═══════════════════════════════════════════════════════════════════════════════
const EMPTY_CERT = { title: '', issuer: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '', category: 'Technical' };

const CertificatesTab = ({ certificates, addCertificate, updateCertificate, removeCertificate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_CERT);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');

  const openAdd = () => { setForm(EMPTY_CERT); setEditingId(null); setShowForm(true); };
  const openEdit = (c) => {
    setForm({ title: c.title, issuer: c.issuer || '', issueDate: c.issueDate || '', expiryDate: c.expiryDate || '', credentialId: c.credentialId || '', credentialUrl: c.credentialUrl || '', category: c.category || 'Technical' });
    setEditingId(c.id); setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    editingId ? updateCertificate(editingId, form) : addCertificate(form);
    setShowForm(false); setForm(EMPTY_CERT); setEditingId(null);
  };

  const filtered = certificates.filter(c => {
    const s = `${c.title} ${c.issuer}`.toLowerCase();
    return s.includes(search.toLowerCase()) && (filterCat === 'All' || c.category === filterCat);
  });

  return (
    <motion.div key="certs" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search certificates…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 backdrop-blur-xl text-sm"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {['All', ...CERT_CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filterCat === cat ? 'bg-amber-500 text-white' : 'bg-white/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm ml-auto">
          <Plus className="w-4 h-4" /> Add Certificate
        </button>
      </div>

      {/* Empty state */}
      {certificates.length === 0 && (
        <div className="text-center py-20">
          <Award className="w-16 h-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
          <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-1">No Certificates Yet</h3>
          <p className="text-sm text-neutral-400 mb-6">Add your certifications to showcase your skills and learning journey.</p>
          <button onClick={openAdd} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors">Add Your First Certificate</button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {filtered.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}
              className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col hover:shadow-lg hover:border-amber-300 dark:hover:border-amber-700 transition-all"
            >
              {/* Amber top strip */}
              <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400" />

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{getIssuerEmoji(c.issuer)}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-neutral-900 dark:text-white text-sm leading-tight mb-0.5">{c.title}</h3>
                    <p className="text-xs text-neutral-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3 flex-shrink-0" /> {c.issuer || 'Unknown Issuer'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${CERT_CAT_COLORS[c.category] || CERT_CAT_COLORS.Other}`}>{c.category}</span>
                </div>

                <div className="space-y-1.5 flex-1 text-xs text-neutral-500">
                  {c.issueDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      <span>Issued: {new Date(c.issueDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  )}
                  {c.expiryDate && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>Expires: {new Date(c.expiryDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  )}
                  {c.credentialId && (
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3 h-3" />
                      <span className="truncate font-mono">{c.credentialId}</span>
                    </div>
                  )}
                </div>

                {c.credentialUrl && (
                  <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors w-fit"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View Credential
                  </a>
                )}
              </div>

              <div className="px-5 py-3.5 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
                <button onClick={() => openEdit(c)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => setConfirmDelete(c.id)} className="flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {certificates.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          <p className="font-medium">No certificates match your filter</p>
          <button onClick={() => { setSearch(''); setFilterCat('All'); }} className="mt-2 text-sm text-blue-500 hover:underline">Clear filters</button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-lg border border-neutral-200 dark:border-neutral-800 shadow-2xl max-h-[92vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />{editingId ? 'Edit Certificate' : 'Add Certificate'}
                  </h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Certificate Title *', key: 'title', placeholder: 'e.g., AWS Certified Developer' },
                    { label: 'Issuing Organization', key: 'issuer', placeholder: 'e.g., Amazon Web Services' },
                    { label: 'Credential ID', key: 'credentialId', placeholder: 'ABC-12345-XYZ' },
                    { label: 'Credential URL', key: 'credentialUrl', placeholder: 'https://...' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">{f.label}</label>
                      <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">Issue Date</label>
                      <input type="date" value={form.issueDate} onChange={e => setForm(p => ({ ...p, issueDate: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">Expiry Date</label>
                      <input type="date" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">Category</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CERT_CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setForm(p => ({ ...p, category: cat }))}
                          className={`py-2 rounded-xl text-xs font-semibold border transition-all ${form.category === cat ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-400'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleSave} disabled={!form.title.trim()}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />{editingId ? 'Save Changes' : 'Add Certificate'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm border border-neutral-200 dark:border-neutral-800 shadow-2xl text-center"
            >
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 className="w-7 h-7 text-red-500" /></div>
              <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Delete Certificate?</h3>
              <p className="text-sm text-neutral-500 mb-5">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                <button onClick={() => { removeCertificate(confirmDelete); setConfirmDelete(null); }} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AchievementsPage;
