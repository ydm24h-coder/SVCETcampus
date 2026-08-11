import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight, MessageCircle, Calendar, BookOpen, ExternalLink, ArrowLeft } from 'lucide-react';
import { useCommunities } from '@/hooks/useCommunities';

const MyCommunitiesPage = () => {
  const navigate = useNavigate();
  const { myCommunities, leaveCommunity } = useCommunities();

  if (myCommunities.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <div className="text-6xl mb-4">🌐</div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">No Communities Yet</h2>
        <p className="text-neutral-500 mb-6">Join communities to connect with students who share your interests.</p>
        <button
          onClick={() => navigate('/student/skillhub/communities')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          Explore Communities
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/student/skillhub')} className="p-2 -ml-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">My Communities</h1>
            <p className="text-neutral-500 text-sm mt-0.5">You are a member of {myCommunities.length} {myCommunities.length === 1 ? 'community' : 'communities'}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/student/skillhub/communities')}
          className="flex items-center gap-2 text-blue-500 hover:text-blue-600 text-sm font-medium"
        >
          Discover more <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {myCommunities.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
          >
            {/* Community Header */}
            <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 p-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{c.icon || '🌐'}</span>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white">{c.name}</h3>
                    <p className="text-xs text-neutral-500">{c.members.length} members · {c.type}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/student/skillhub/community/${c.id}`)}
                  className="p-2 rounded-xl bg-white/80 dark:bg-neutral-800 hover:bg-white dark:hover:bg-neutral-700 transition-colors"
                  title="Open community"
                >
                  <ExternalLink className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 divide-x divide-neutral-100 dark:divide-neutral-800 border-b border-neutral-100 dark:border-neutral-800">
              {[
                { label: 'Posts', value: c.posts.length, icon: <MessageCircle className="w-4 h-4 text-blue-500" /> },
                { label: 'Events', value: c.events.length, icon: <Calendar className="w-4 h-4 text-purple-500" /> },
                { label: 'Resources', value: c.resources.length, icon: <BookOpen className="w-4 h-4 text-green-500" /> },
              ].map(stat => (
                <div key={stat.label} className="p-3 text-center">
                  <div className="flex justify-center mb-1">{stat.icon}</div>
                  <p className="text-lg font-bold text-neutral-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-neutral-500">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Recent Post Preview */}
            {c.posts.length > 0 && (
              <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 mb-1">Latest post</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">{c.posts[0].text}</p>
                <p className="text-xs text-neutral-400 mt-1">by {c.posts[0].author} · {new Date(c.posts[0].timestamp).toLocaleDateString()}</p>
              </div>
            )}

            {/* Footer */}
            <div className="p-4 flex gap-2">
              <button
                onClick={() => navigate(`/student/skillhub/community/${c.id}`)}
                className="flex-1 py-2 rounded-xl text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                Open Community
              </button>
              <button
                onClick={() => leaveCommunity(c.id)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Leave
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MyCommunitiesPage;
