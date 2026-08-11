import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Trophy, Users, Calendar, CheckCircle, X, Send, Award, Clock, ArrowLeft } from 'lucide-react';
import { useSkillHub } from '@/hooks/useSkillHub';

const DIFFICULTY_STYLES = {
  Beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  Hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const ChallengesPage = () => {
  const navigate = useNavigate();
  const {
    challenges, myXP, myBadges, SKILLHUB_BADGES,
    joinChallenge, submitChallenge, hasSubmitted, hasJoined, getXPLeaderboard
  } = useSkillHub();

  const [activeTab, setActiveTab] = useState('Challenges');
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionNote, setSubmissionNote] = useState('');

  const leaderboard = getXPLeaderboard();

  const handleSubmit = () => {
    if (!submissionUrl.trim()) return;
    submitChallenge(selectedChallenge.id, { url: submissionUrl, note: submissionNote });
    setSubmissionUrl('');
    setSubmissionNote('');
    setSelectedChallenge(null);
  };

  const daysLeft = (deadline) => {
    const diff = new Date(deadline) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
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
              <Zap className="w-6 h-6 text-yellow-500" /> Challenges
            </h1>
            <p className="text-neutral-500 text-sm mt-1">Complete challenges, earn XP, and unlock badges.</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-yellow-500">{myXP.total} XP</p>
          <p className="text-xs text-neutral-500">Your total XP</p>
        </div>
      </div>

      {/* My Badges Banner */}
      {myBadges.length > 0 && (
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-4">
          <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">🏅 Your SkillHub Badges</p>
          <div className="flex flex-wrap gap-2">
            {myBadges.map(badge => (
              <div key={badge.id} title={badge.description} className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 border border-purple-200 dark:border-purple-700 rounded-xl px-3 py-1.5 text-sm">
                <span>{badge.icon}</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
        {['Challenges', 'Leaderboard', 'All Badges'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'Challenges' && (
          <motion.div key="challenges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {challenges.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-4xl">{c.icon}</div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-neutral-900 dark:text-white">{c.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_STYLES[c.difficulty]}`}>{c.difficulty}</span>
                        {hasSubmitted(c.id) && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" />Submitted</span>}
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">{c.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                        <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-semibold"><Zap className="w-4 h-4" />{c.xpReward} XP</span>
                        <span className="flex items-center gap-1"><Users className="w-4 h-4" />{c.participants.length} joined</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{daysLeft(c.deadline)} days left</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.tags.map(tag => <span key={tag} className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded-full">{tag}</span>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!hasJoined(c.id) ? (
                      <button onClick={() => joinChallenge(c.id)} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-sm font-medium transition-colors whitespace-nowrap">
                        Join Challenge
                      </button>
                    ) : !hasSubmitted(c.id) ? (
                      <button onClick={() => setSelectedChallenge(c)} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors whitespace-nowrap">
                        Submit Work
                      </button>
                    ) : (
                      <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl text-sm font-medium text-center">Done ✓</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'Leaderboard' && (
          <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {leaderboard.length === 0 ? (
              <div className="text-center py-12 text-neutral-500"><Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No XP earned yet. Complete challenges to appear here!</p></div>
            ) : (
              leaderboard.map((entry, i) => (
                <motion.div key={entry.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className={`bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border p-4 flex items-center gap-4 ${i === 0 ? 'border-yellow-400 dark:border-yellow-600' : i === 1 ? 'border-neutral-400 dark:border-neutral-500' : i === 2 ? 'border-orange-400 dark:border-orange-600' : 'border-neutral-200 dark:border-neutral-800'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-neutral-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'}`}>
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-white">{entry.name}</p>
                    <p className="text-xs text-neutral-500">{entry.badges?.length || 0} badges</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-yellow-500">{entry.xp}</p>
                    <p className="text-xs text-neutral-500">XP</p>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'All Badges' && (
          <motion.div key="badges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SKILLHUB_BADGES.map((badge, i) => {
              const earned = myBadges.some(b => b.id === badge.id);
              return (
                <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                  className={`rounded-2xl border p-5 text-center ${earned ? 'bg-gradient-to-b from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 border-purple-300 dark:border-purple-700' : 'bg-white/60 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 opacity-60'}`}
                >
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-1">{badge.name}</h4>
                  <p className="text-xs text-neutral-500">{badge.description}</p>
                  {earned && <p className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-medium">✓ Earned</p>}
                  {!earned && badge.xpThreshold > 0 && <p className="mt-2 text-xs text-neutral-400">Requires {badge.xpThreshold} XP</p>}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Modal */}
      <AnimatePresence>
        {selectedChallenge && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedChallenge(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md border border-neutral-200 dark:border-neutral-800 shadow-2xl">
              <div className="flex justify-between mb-4">
                <h3 className="font-bold text-neutral-900 dark:text-white">Submit: {selectedChallenge.title}</h3>
                <button onClick={() => setSelectedChallenge(null)}><X className="w-5 h-5 text-neutral-500" /></button>
              </div>
              <div className="space-y-3">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 text-sm text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> You'll earn {selectedChallenge.xpReward} XP upon submission!
                </div>
                <input value={submissionUrl} onChange={e => setSubmissionUrl(e.target.value)} placeholder="GitHub / Live demo URL *" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                <textarea value={submissionNote} onChange={e => setSubmissionNote(e.target.value)} placeholder="Brief description of what you built..." rows={3} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                <button onClick={handleSubmit} disabled={!submissionUrl.trim()} className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> Submit Challenge
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChallengesPage;
