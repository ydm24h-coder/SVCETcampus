import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Search, Star, Award, Filter, MessageCircle, ChevronDown } from 'lucide-react';
import { useStudents } from '@/hooks/useStudents';
import { useProfessionalProfile } from '@/hooks/useProfessionalProfile';

const VERIFICATION_KEY = 'svcet_faculty_skill_verifications';

const getVerifications = () => {
  try {
    return JSON.parse(localStorage.getItem(VERIFICATION_KEY)) || [];
  } catch {
    return [];
  }
};

const FacultySkillVerificationPage = () => {
  const { students } = useStudents();
  const sessionUser = JSON.parse(localStorage.getItem('svcet_session_faculty')) || {};
  const facultyName = sessionUser.name || 'Faculty';

  const [verifications, setVerifications] = useState(() => {
    // Build verification requests from student profiles
    const stored = getVerifications();
    if (stored.length > 0) return stored;

    // Generate sample requests from students
    const profilesRaw = localStorage.getItem('svcet_professional_profiles');
    const profiles = profilesRaw ? JSON.parse(profilesRaw) : {};
    const requests = [];
    Object.entries(profiles).forEach(([studentName, profile]) => {
      (profile.skills || []).forEach(skill => {
        if (skill.endorsedBy?.length === 0) {
          requests.push({
            id: `${studentName}-${skill.id}`,
            studentName,
            skillName: skill.name,
            skillId: skill.id,
            status: 'pending',
            requestedAt: new Date().toISOString(),
            comment: '',
          });
        }
      });
    });
    localStorage.setItem(VERIFICATION_KEY, JSON.stringify(requests));
    return requests;
  });

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [comment, setComment] = useState({});

  const filtered = verifications.filter(v => {
    const matchSearch = v.studentName.toLowerCase().includes(search.toLowerCase()) ||
      v.skillName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || v.status === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  const updateStatus = (id, status) => {
    const updated = verifications.map(v => {
      if (v.id === id) {
        const newV = { ...v, status, verifiedBy: facultyName, verifiedAt: new Date().toISOString(), comment: comment[id] || '' };
        // If approved, endorse the skill in student profile
        if (status === 'approved') {
          const profiles = JSON.parse(localStorage.getItem('svcet_professional_profiles') || '{}');
          const p = profiles[v.studentName];
          if (p) {
            p.skills = (p.skills || []).map(s => {
              if (s.id === v.skillId && !s.endorsedBy.includes(facultyName)) {
                return { ...s, endorsedBy: [...s.endorsedBy, `${facultyName} (Faculty)`] };
              }
              return s;
            });
            profiles[v.studentName] = p;
            localStorage.setItem('svcet_professional_profiles', JSON.stringify(profiles));
          }
        }
        return newV;
      }
      return v;
    });
    localStorage.setItem(VERIFICATION_KEY, JSON.stringify(updated));
    setVerifications(updated);
  };

  const pendingCount = verifications.filter(v => v.status === 'pending').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-500" /> Skill Verification
        </h1>
        <p className="text-neutral-500 text-sm mt-0.5">Review and verify student skill claims. Your endorsements appear on their professional profiles.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: verifications.filter(v => v.status === 'pending').length, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
          { label: 'Approved', value: verifications.filter(v => v.status === 'approved').length, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Rejected', value: verifications.filter(v => v.status === 'rejected').length, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center border border-neutral-200 dark:border-neutral-800`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-neutral-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student or skill..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-xl"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Pending', 'Approved', 'Rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f ? 'bg-blue-500 text-white' : 'bg-white/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Requests */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-neutral-500">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{verifications.length === 0 ? 'No skill verification requests yet' : 'No matching requests'}</p>
          <p className="text-sm">Students need to add skills and request endorsements from their profile</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v, i) => (
            <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                    {v.studentName?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-white">{v.studentName}</p>
                    <p className="text-sm text-neutral-500">Skill: <span className="font-medium text-blue-600 dark:text-blue-400">{v.skillName}</span></p>
                    <p className="text-xs text-neutral-400">Requested {new Date(v.requestedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  {v.status === 'pending' ? (
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full font-medium">Pending</span>
                  ) : v.status === 'approved' ? (
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" />Approved</span>
                  ) : (
                    <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 rounded-full font-medium flex items-center gap-1"><XCircle className="w-3 h-3" />Rejected</span>
                  )}
                </div>
              </div>

              {v.status === 'pending' && (
                <div className="mt-4 space-y-2">
                  <input
                    value={comment[v.id] || ''}
                    onChange={e => setComment(p => ({ ...p, [v.id]: e.target.value }))}
                    placeholder="Optional: Add a comment or note..."
                    className="w-full px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(v.id, 'approved')} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors">
                      <CheckCircle className="w-4 h-4" /> Approve & Endorse
                    </button>
                    <button onClick={() => updateStatus(v.id, 'rejected')} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-100 dark:bg-red-900/20 hover:bg-red-200 text-red-600 text-sm font-medium transition-colors">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              )}

              {v.status !== 'pending' && v.comment && (
                <div className="mt-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                  <p className="text-xs text-neutral-500">Your comment: <span className="text-neutral-700 dark:text-neutral-300">{v.comment}</span></p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacultySkillVerificationPage;
