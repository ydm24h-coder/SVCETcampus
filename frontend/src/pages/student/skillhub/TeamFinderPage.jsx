import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, X, Search, Filter, Send, Trophy, Code, Briefcase, ArrowLeft } from 'lucide-react';
import { useSkillHub } from '@/hooks/useSkillHub';
import { useStudents } from '@/hooks/useStudents';

const TeamFinderPage = () => {
  const navigate = useNavigate();
  const { createTeam, teams, myTeams, openTeams, requestToJoinTeam, acceptTeamRequest, declineTeamRequest, currentUser } = useSkillHub();
  const { students: allStudents } = useStudents();
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState('Find Teams');
  const [form, setForm] = useState({ name: '', hackathon: '', description: '', requiredSkills: '', maxMembers: 4, isOpen: true });
  const [search, setSearch] = useState('');

  const filteredTeams = openTeams.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.hackathon?.toLowerCase().includes(search.toLowerCase()) ||
    t.requiredSkills?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createTeam(form);
    setForm({ name: '', hackathon: '', description: '', requiredSkills: '', maxMembers: 4, isOpen: true });
    setShowCreate(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/student/skillhub')} className="p-2 -ml-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-green-500" /> Team Finder
            </h1>
            <p className="text-neutral-500 text-sm mt-0.5">Find teammates for hackathons and collaborative projects</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Form Team
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
        {['Find Teams', 'My Teams'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
          >
            {tab} {tab === 'My Teams' && myTeams.length > 0 && <span className="ml-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">{myTeams.length}</span>}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'Find Teams' && (
          <motion.div key="find" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams, hackathons, skills..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 backdrop-blur-xl"
              />
            </div>

            {filteredTeams.length === 0 ? (
              <div className="text-center py-16 text-neutral-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No open teams found</p>
                <p className="text-sm">Form your own team and start recruiting!</p>
              </div>
            ) : (
              filteredTeams.map((team, i) => (
                <motion.div key={team.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-neutral-900 dark:text-white mb-1">{team.name}</h3>
                      {team.hackathon && (
                        <div className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 mb-2">
                          <Trophy className="w-4 h-4" /> {team.hackathon}
                        </div>
                      )}
                      {team.description && <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">{team.description}</p>}
                      {team.requiredSkills && (
                        <div className="mb-3">
                          <p className="text-xs text-neutral-500 mb-1">Looking for:</p>
                          <div className="flex flex-wrap gap-1">
                            {team.requiredSkills.split(',').map(skill => (
                              <span key={skill} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">{skill.trim()}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm text-neutral-500">
                        <span className="flex items-center gap-1"><Users className="w-4 h-4" />{team.members.length}/{team.maxMembers} members</span>
                        <span>Led by {team.leader}</span>
                      </div>
                    </div>
                    <div>
                      {team.members.includes(currentUser) ? (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-xl font-medium">Joined ✓</span>
                      ) : team.pendingRequests?.includes(currentUser) ? (
                        <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-3 py-1.5 rounded-xl font-medium">Pending...</span>
                      ) : team.members.length >= team.maxMembers ? (
                        <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-400 px-3 py-1.5 rounded-xl font-medium">Full</span>
                      ) : (
                        <button onClick={() => requestToJoinTeam(team.id)} className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-xl font-medium transition-colors">
                          Request to Join
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'My Teams' && (
          <motion.div key="myteams" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {myTeams.length === 0 ? (
              <div className="text-center py-16 text-neutral-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">You haven't joined any teams yet</p>
              </div>
            ) : (
              myTeams.map((team, i) => (
                <motion.div key={team.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-neutral-900 dark:text-white">{team.name}</h3>
                      {team.hackathon && <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5"><Trophy className="w-3.5 h-3.5" />{team.hackathon}</p>}
                    </div>
                    {team.leader === currentUser && <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full font-medium">👑 Leader</span>}
                  </div>
                  {/* Members */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {team.members.map(m => (
                      <div key={m} className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full px-3 py-1">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">{m.substring(0, 1)}</div>
                        <span className="text-xs text-neutral-700 dark:text-neutral-300">{m}</span>
                      </div>
                    ))}
                  </div>
                  {/* Pending Requests (for leader) */}
                  {team.leader === currentUser && team.pendingRequests?.length > 0 && (
                    <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
                      <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">Pending join requests:</p>
                      {team.pendingRequests.map(requester => (
                        <div key={requester} className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">{requester}</span>
                          <div className="flex gap-2">
                            <button onClick={() => acceptTeamRequest(team.id, requester)} className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-lg transition-colors">Accept</button>
                            <button onClick={() => declineTeamRequest(team.id, requester)} className="text-xs bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-600 px-2 py-1 rounded-lg transition-colors">Decline</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md border border-neutral-200 dark:border-neutral-800 shadow-2xl">
              <div className="flex justify-between mb-5"><h3 className="font-bold text-lg text-neutral-900 dark:text-white">Form a Team</h3><button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-neutral-500" /></button></div>
              <div className="space-y-3">
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Team name *" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input value={form.hackathon} onChange={e => setForm(p => ({ ...p, hackathon: e.target.value }))} placeholder="Hackathon / Project name" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="What are you building?" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                <input value={form.requiredSkills} onChange={e => setForm(p => ({ ...p, requiredSkills: e.target.value }))} placeholder="Required skills (comma separated)" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                <div>
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1 block">Max team size: {form.maxMembers}</label>
                  <input type="range" min={2} max={8} value={form.maxMembers} onChange={e => setForm(p => ({ ...p, maxMembers: parseInt(e.target.value) }))} className="w-full accent-green-500" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setForm(p => ({ ...p, isOpen: !p.isOpen }))} className={`w-12 h-6 rounded-full transition-colors relative ${form.isOpen ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isOpen ? 'translate-x-7' : 'translate-x-1'}`} />
                  </div>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Open for applications</span>
                </label>
                <button onClick={handleCreate} disabled={!form.name.trim()} className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors">
                  Create Team
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamFinderPage;
