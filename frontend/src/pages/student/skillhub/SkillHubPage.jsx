import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Zap, Trophy, Search, TrendingUp, Star, ArrowRight, Plus, Target, Calendar, Globe } from 'lucide-react';
import { useCommunities } from '@/hooks/useCommunities';
import { useSkillHub } from '@/hooks/useSkillHub';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const StatCard = ({ icon, label, value, color }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 flex items-center gap-4"
  >
    <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  </motion.div>
);

const SkillHubPage = () => {
  const navigate = useNavigate();
  const { communities, myCommunities, joinCommunity, isMember } = useCommunities();
  const { challenges, myXP, myBadges } = useSkillHub();
  const [search, setSearch] = useState('');

  const featuredCommunities = communities.slice(0, 3);
  const activeChallenge = challenges.find(c => c.isActive);
  const trendingCommunities = [...communities]
    .sort((a, b) => b.members.length - a.members.length)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">

      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white"
      >
        <div className="absolute inset-0 opacity-20">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{ width: Math.random() * 6 + 2, height: Math.random() * 6 + 2, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, opacity: Math.random() * 0.8 + 0.2 }} />
          ))}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl">🚀</span>
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">SkillHub</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Build Skills. Find Your Tribe.</h1>
          <p className="text-blue-100 max-w-xl mb-6">Join communities, take on challenges, find hackathon teammates, and grow your professional network — all within SVCET Campus.</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/student/skillhub/communities')}
              className="bg-white text-blue-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <Globe className="w-4 h-4" /> Explore Communities
            </button>
            <button
              onClick={() => navigate('/student/skillhub/challenges')}
              className="bg-white/20 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-white/30 transition-colors flex items-center gap-2 border border-white/30"
            >
              <Zap className="w-4 h-4" /> View Challenges
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} label="My Communities" value={myCommunities.length} color="bg-blue-100 dark:bg-blue-900/30" />
        <StatCard icon={<Zap className="w-5 h-5 text-yellow-600" />} label="SkillHub XP" value={myXP.total} color="bg-yellow-100 dark:bg-yellow-900/30" />
        <StatCard icon={<Trophy className="w-5 h-5 text-purple-600" />} label="Badges Earned" value={myBadges.length} color="bg-purple-100 dark:bg-purple-900/30" />
        <StatCard icon={<Target className="w-5 h-5 text-green-600" />} label="Active Challenges" value={challenges.filter(c => c.isActive).length} color="bg-green-100 dark:bg-green-900/30" />
      </div>

      {/* My Communities */}
      {myCommunities.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" /> My Communities
            </h2>
            <button onClick={() => navigate('/student/skillhub/my-communities')} className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCommunities.slice(0, 3).map((c, i) => (
              <motion.div
                key={c.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                onClick={() => navigate(`/student/skillhub/community/${c.id}`)}
                className="cursor-pointer bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all"
              >
                <div className="text-3xl mb-2">{c.icon || '🌐'}</div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">{c.name}</h3>
                <p className="text-sm text-neutral-500 line-clamp-2 mb-3">{c.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{c.members.length} members</span>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">{c.posts.length} posts</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Communities */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" /> Trending Communities
          </h2>
          <button onClick={() => navigate('/student/skillhub/communities')} className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1">
            Browse all <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trendingCommunities.map((c, i) => (
            <motion.div
              key={c.id}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 flex items-start gap-4"
            >
              <div className="text-3xl">{c.icon || '🌐'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-neutral-900 dark:text-white truncate">{c.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.type === 'coding' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                    c.type === 'design' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' :
                    c.type === 'research' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  }`}>{c.type}</span>
                </div>
                <p className="text-sm text-neutral-500 line-clamp-1 mb-3">{c.description}</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-500 flex items-center gap-1"><Users className="w-3 h-3" />{c.members.length}</span>
                  <div className="flex flex-wrap gap-1">
                    {c.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                  {!isMember(c.id) ? (
                    <button
                      onClick={() => joinCommunity(c.id)}
                      className="ml-auto text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      Join
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/student/skillhub/community/${c.id}`)}
                      className="ml-auto text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors font-medium"
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Active Challenge Spotlight */}
      {activeChallenge && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 dark:from-yellow-500/20 dark:to-orange-500/20 rounded-2xl border border-yellow-300 dark:border-yellow-700 p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{activeChallenge.icon}</span>
                <span className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 text-xs font-bold px-3 py-1 rounded-full">🔥 Challenge Spotlight</span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">{activeChallenge.title}</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-3">{activeChallenge.description}</p>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-semibold text-sm">
                  <Zap className="w-4 h-4" />{activeChallenge.xpReward} XP
                </span>
                <span className="flex items-center gap-1 text-neutral-500 text-sm">
                  <Users className="w-4 h-4" />{activeChallenge.participants.length} participants
                </span>
                <span className="flex items-center gap-1 text-neutral-500 text-sm">
                  <Calendar className="w-4 h-4" />Due {new Date(activeChallenge.deadline).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/skillhub/challenges')}
              className="bg-yellow-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-yellow-600 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Create Community', icon: '🏗️', path: '/student/skillhub/communities', color: 'from-blue-500 to-indigo-600' },
          { label: 'Find Teammates', icon: '🤝', path: '/student/skillhub/team-finder', color: 'from-green-500 to-emerald-600' },
          { label: 'Join Challenge', icon: '⚡', path: '/student/skillhub/challenges', color: 'from-yellow-500 to-orange-500' },
          { label: 'My Communities', icon: '👥', path: '/student/skillhub/my-communities', color: 'from-purple-500 to-pink-600' },
        ].map((action, i) => (
          <motion.button
            key={action.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            onClick={() => navigate(action.path)}
            className={`bg-gradient-to-br ${action.color} text-white rounded-2xl p-4 text-center hover:opacity-90 transition-opacity shadow-md`}
          >
            <div className="text-2xl mb-1">{action.icon}</div>
            <p className="text-sm font-semibold">{action.label}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default SkillHubPage;
