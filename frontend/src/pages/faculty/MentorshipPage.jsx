import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, X, Calendar, Clock, Users, Link2, Edit2, Trash2, Star } from 'lucide-react';
import { useCommunities } from '@/hooks/useCommunities';

const MENTORSHIP_KEY = 'svcet_faculty_mentorship';

const getMentorships = () => {
  try {
    return JSON.parse(localStorage.getItem(MENTORSHIP_KEY)) || [];
  } catch {
    return [];
  }
};

const EMPTY_FORM = {
  type: 'workshop',
  title: '',
  description: '',
  date: '',
  time: '',
  duration: '1 hour',
  venue: '',
  link: '',
  communityId: '',
  maxAttendees: 30,
  tags: '',
};

const TYPE_CONFIG = {
  workshop: { label: 'Workshop', icon: '🛠️', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  webinar: { label: 'Webinar', icon: '🌐', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  mentoring: { label: 'Mentoring Session', icon: '🎯', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  resource: { label: 'Learning Resource', icon: '📚', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
};

const FacultyMentorshipPage = () => {
  const sessionUser = JSON.parse(localStorage.getItem('svcet_session_faculty')) || {};
  const facultyName = sessionUser.name || 'Faculty';
  const { communities, addResource, addEvent } = useCommunities();

  const [mentorships, setMentorships] = useState(() => getMentorships().filter(m => m.createdBy === facultyName));
  const [allMentorships, setAllMentorships] = useState(() => getMentorships());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState('My Sessions');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleCreate = () => {
    if (!form.title.trim()) return;
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const newItem = {
      id: Date.now(),
      ...form,
      tags,
      createdBy: facultyName,
      createdAt: new Date().toISOString(),
      registrations: [],
    };

    // Optionally post to a community
    if (form.communityId) {
      const cId = parseInt(form.communityId);
      if (form.type === 'resource') {
        addResource(cId, { title: form.title, description: form.description, url: form.link });
      } else {
        addEvent(cId, { title: form.title, description: form.description, date: form.date, time: form.time, venue: form.venue || form.link });
      }
    }

    const updated = [newItem, ...allMentorships];
    localStorage.setItem(MENTORSHIP_KEY, JSON.stringify(updated));
    setAllMentorships(updated);
    setMentorships(updated.filter(m => m.createdBy === facultyName));
    setShowForm(false);
    setForm(EMPTY_FORM);
  };

  const handleDelete = (id) => {
    const updated = allMentorships.filter(m => m.id !== id);
    localStorage.setItem(MENTORSHIP_KEY, JSON.stringify(updated));
    setAllMentorships(updated);
    setMentorships(updated.filter(m => m.createdBy === facultyName));
    setConfirmDelete(null);
  };

  const myMentorships = mentorships;
  const allSessions = allMentorships;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-500" /> Mentorship Hub
          </h1>
          <p className="text-neutral-500 text-sm mt-0.5">Publish workshops, events, and resources directly to student communities.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl font-medium transition-colors">
          <Plus className="w-4 h-4" /> Publish Session
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(TYPE_CONFIG).map(([type, config]) => (
          <div key={type} className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 text-center">
            <div className="text-3xl mb-1">{config.icon}</div>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">{myMentorships.filter(m => m.type === type).length}</p>
            <p className="text-xs text-neutral-500">{config.label}s</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
        {['My Sessions', 'All Sessions'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      <AnimatePresence mode="wait">
        {activeTab === 'My Sessions' && (
          <motion.div key="my" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {myMentorships.length === 0 ? (
              <div className="text-center py-16 text-neutral-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">You haven't published anything yet</p>
                <p className="text-sm">Publish a workshop, webinar, or resource for students</p>
              </div>
            ) : myMentorships.map((m, i) => {
              const config = TYPE_CONFIG[m.type] || TYPE_CONFIG.workshop;
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-3xl">{config.icon}</div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-neutral-900 dark:text-white">{m.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>{config.label}</span>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">{m.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                          {m.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{m.date} {m.time && `at ${m.time}`}</span>}
                          {m.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.duration}</span>}
                          {m.maxAttendees && <span className="flex items-center gap-1"><Users className="w-3 h-3" />Max {m.maxAttendees}</span>}
                          {m.venue && <span>📍 {m.venue}</span>}
                        </div>
                        {m.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {m.tags.map(tag => <span key={tag} className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full">{tag}</span>)}
                          </div>
                        )}
                        {m.communityId && (
                          <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                            📌 Posted to: {communities.find(c => c.id === parseInt(m.communityId))?.name || 'a community'}
                          </p>
                        )}
                      </div>
                    </div>
                    <button onClick={() => setConfirmDelete(m.id)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {activeTab === 'All Sessions' && (
          <motion.div key="all" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {allSessions.length === 0 ? (
              <div className="text-center py-16 text-neutral-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No mentorship sessions published yet</p>
              </div>
            ) : allSessions.map((m, i) => {
              const config = TYPE_CONFIG[m.type] || TYPE_CONFIG.workshop;
              return (
                <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{config.icon}</div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-neutral-900 dark:text-white">{m.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>{config.label}</span>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">{m.description}</p>
                      <p className="text-xs text-neutral-400">by {m.createdBy} · {new Date(m.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-lg border border-neutral-200 dark:border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Publish Session / Resource</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(TYPE_CONFIG).map(([type, config]) => (
                      <button key={type} onClick={() => setForm(p => ({ ...p, type }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${form.type === type ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'}`}
                      >
                        {config.icon} {config.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Title *</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder={`e.g., ${form.type === 'resource' ? 'React Hooks Guide' : 'Advanced React Workshop'}`} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="What will students learn or gain?" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
                </div>
                {form.type !== 'resource' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Date</label>
                      <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Time</label>
                      <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Link / URL</label>
                  <input value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} placeholder="https://meet.google.com/... or resource URL" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Post to Community (optional)</label>
                  <select value={form.communityId} onChange={e => setForm(p => ({ ...p, communityId: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Don't post to community</option>
                    {communities.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Tags (comma separated)</label>
                  <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="React, Workshop, Beginner" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <button onClick={handleCreate} disabled={!form.title.trim()} className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors">
                  Publish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm border border-neutral-200 dark:border-neutral-800 text-center">
              <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Delete this session?</h3>
              <p className="text-sm text-neutral-500 mb-5">This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FacultyMentorshipPage;
