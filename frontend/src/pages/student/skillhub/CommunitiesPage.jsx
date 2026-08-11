import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Users, Filter, X, Globe, Lock, TrendingUp, ArrowLeft } from 'lucide-react';
import { useCommunities } from '@/hooks/useCommunities';

const TYPES = ['All', 'coding', 'design', 'research', 'team-building'];

const TYPE_STYLES = {
  coding: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  design: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  research: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'team-building': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

const CommunitiesPage = () => {
  const navigate = useNavigate();
  const { communities, isMember, joinCommunity, leaveCommunity, createCommunity, currentUser } = useCommunities();
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', type: 'coding', tags: '', icon: '🌐', isPublic: true });

  const filtered = communities.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchType = activeType === 'All' || c.type === activeType;
    return matchSearch && matchType;
  });

  const handleCreate = () => {
    if (!form.name.trim()) return;
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    createCommunity({ ...form, tags });
    setForm({ name: '', description: '', type: 'coding', tags: '', icon: '🌐', isPublic: true });
    setShowCreate(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/student/skillhub')} className="p-2 -ml-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Communities</h1>
            <p className="text-neutral-500 text-sm mt-0.5">{communities.length} communities · {communities.reduce((a, c) => a + c.members.length, 0)} total members</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Community
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search communities, tags..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-xl"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TYPES.map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`whitespace-nowrap px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeType === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:border-blue-400'
              }`}
            >
              {type === 'All' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Communities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {filtered.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col"
            >
              {/* Card Header */}
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{c.icon || '🌐'}</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_STYLES[c.type] || 'bg-neutral-100 text-neutral-600'}`}>
                      {c.type}
                    </span>
                    {c.isPublic ? <Globe className="w-4 h-4 text-neutral-400" /> : <Lock className="w-4 h-4 text-neutral-400" />}
                  </div>
                </div>
                <h3 className="font-bold text-neutral-900 dark:text-white mb-1">{c.name}</h3>
                <p className="text-sm text-neutral-500 line-clamp-2 mb-3">{c.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {c.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                  {c.tags.length > 3 && <span className="text-xs text-neutral-400">+{c.tags.length - 3}</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.members.length} members</span>
                  <span>{c.posts.length} posts</span>
                  <span>{c.events.length} events</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
                <button
                  onClick={() => navigate(`/student/skillhub/community/${c.id}`)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  View
                </button>
                {isMember(c.id) ? (
                  <button
                    onClick={() => leaveCommunity(c.id)}
                    className="flex-1 py-2 rounded-xl text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    Leave
                  </button>
                ) : (
                  <button
                    onClick={() => joinCommunity(c.id)}
                    className="flex-1 py-2 rounded-xl text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  >
                    Join
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-neutral-500">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No communities found</p>
          <p className="text-sm">Try different filters or create a new one</p>
        </div>
      )}

      {/* Create Community Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Create Community</h2>
                <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Community Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g., React Developers"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                    placeholder="What is this community about?"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Type</label>
                    <select
                      value={form.type}
                      onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="coding">Coding</option>
                      <option value="design">Design</option>
                      <option value="research">Research</option>
                      <option value="team-building">Team Building</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Icon (emoji)</label>
                    <input
                      value={form.icon}
                      onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Tags (comma separated)</label>
                  <input
                    value={form.tags}
                    onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                    placeholder="React, JavaScript, Frontend"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setForm(p => ({ ...p, isPublic: !p.isPublic }))}
                    className={`w-12 h-6 rounded-full transition-colors relative ${form.isPublic ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isPublic ? 'translate-x-7' : 'translate-x-1'}`} />
                  </div>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Public community</span>
                </label>
                <button
                  onClick={handleCreate}
                  disabled={!form.name.trim()}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
                >
                  Create Community
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunitiesPage;
