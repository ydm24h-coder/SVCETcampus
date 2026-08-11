import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Send, ThumbsUp, MessageCircle, Calendar, BookOpen,
  Plus, X, Link2, Share2, Settings, Crown
} from 'lucide-react';
import { useCommunities } from '@/hooks/useCommunities';

const TABS = ['Feed', 'Members', 'Resources', 'Events'];

const CommunityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getCommunity, isMember, joinCommunity, leaveCommunity,
    postToCommunity, likePost, commentOnPost, addResource, addEvent, currentUser
  } = useCommunities();

  const communityId = parseInt(id);
  const community = getCommunity(communityId);

  const [activeTab, setActiveTab] = useState('Feed');
  const [newPost, setNewPost] = useState('');
  const [openComments, setOpenComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [showAddResource, setShowAddResource] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [resourceForm, setResourceForm] = useState({ title: '', url: '', description: '', type: 'link' });
  const [eventForm, setEventForm] = useState({ title: '', date: '', time: '', description: '', venue: '' });

  if (!community) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">Community not found.</p>
        <button onClick={() => navigate('/student/skillhub/communities')} className="mt-4 text-blue-500 hover:underline">Back to Communities</button>
      </div>
    );
  }

  const member = isMember(communityId);
  const isLeader = community.createdBy === currentUser;

  const handlePost = () => {
    if (!newPost.trim() || !member) return;
    postToCommunity(communityId, { text: newPost });
    setNewPost('');
  };

  const handleComment = (postId) => {
    const text = commentText[postId];
    if (!text?.trim()) return;
    commentOnPost(communityId, postId, text);
    setCommentText(p => ({ ...p, [postId]: '' }));
  };

  const handleAddResource = () => {
    if (!resourceForm.title.trim()) return;
    addResource(communityId, resourceForm);
    setResourceForm({ title: '', url: '', description: '', type: 'link' });
    setShowAddResource(false);
  };

  const handleAddEvent = () => {
    if (!eventForm.title.trim()) return;
    addEvent(communityId, eventForm);
    setEventForm({ title: '', date: '', time: '', description: '', venue: '' });
    setShowAddEvent(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/student/skillhub/communities')} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <span className="text-4xl">{community.icon || '🌐'}</span>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              {community.name}
              {isLeader && <Crown className="w-4 h-4 text-yellow-500" title="You created this" />}
            </h1>
            <p className="text-sm text-neutral-500">{community.members.length} members · {community.posts.length} posts</p>
          </div>
        </div>
        {member ? (
          <button onClick={() => leaveCommunity(communityId)} className="px-4 py-2 rounded-xl text-sm font-medium border border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            Leave
          </button>
        ) : (
          <button onClick={() => joinCommunity(communityId)} className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors">
            Join Community
          </button>
        )}
      </div>

      {/* Description */}
      <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
        <p className="text-neutral-700 dark:text-neutral-300 mb-3">{community.description}</p>
        <div className="flex flex-wrap gap-2">
          {community.tags.map(tag => (
            <span key={tag} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-medium">{tag}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'Feed' && (
          <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Compose Post */}
            {member && (
              <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder="Share something with the community..."
                  rows={3}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handlePost}
                    disabled={!newPost.trim()}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Send className="w-4 h-4" /> Post
                  </button>
                </div>
              </div>
            )}

            {/* Posts */}
            {community.posts.length === 0 && (
              <div className="text-center py-12 text-neutral-500">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No posts yet. Be the first!</p>
              </div>
            )}
            {community.posts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                    {post.author?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-neutral-900 dark:text-white">{post.author}</p>
                    <p className="text-xs text-neutral-500">{new Date(post.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {post.type === 'announcement' && (
                    <span className="ml-auto text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full font-medium">📢 Announcement</span>
                  )}
                </div>
                <p className="text-neutral-700 dark:text-neutral-300 text-sm mb-3 whitespace-pre-wrap">{post.text}</p>
                <div className="flex items-center gap-4 text-sm text-neutral-500">
                  <button onClick={() => likePost(communityId, post.id)}
                    className={`flex items-center gap-1 hover:text-blue-500 transition-colors ${post.likes.includes(currentUser) ? 'text-blue-500' : ''}`}
                  >
                    <ThumbsUp className="w-4 h-4" /> {post.likes.length}
                  </button>
                  <button onClick={() => setOpenComments(p => ({ ...p, [post.id]: !p[post.id] }))}
                    className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> {post.comments.length}
                  </button>
                </div>

                {/* Comments */}
                <AnimatePresence>
                  {openComments[post.id] && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-2">
                      {post.comments.map(c => (
                        <div key={c.id} className="flex gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {c.author?.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl px-3 py-2 flex-1">
                            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{c.author}</p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{c.text}</p>
                          </div>
                        </div>
                      ))}
                      {member && (
                        <div className="flex gap-2 mt-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {currentUser?.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex gap-2 flex-1">
                            <input
                              value={commentText[post.id] || ''}
                              onChange={e => setCommentText(p => ({ ...p, [post.id]: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                              placeholder="Write a comment..."
                              className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button onClick={() => handleComment(post.id)} className="p-1.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
                              <Send className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'Members' && (
          <motion.div key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {community.members.map((memberName, i) => (
              <motion.div key={memberName} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                  {memberName.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-neutral-900 dark:text-white text-sm">{memberName}</p>
                  {memberName === community.createdBy && <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">👑 Creator</p>}
                  {memberName === currentUser && <p className="text-xs text-blue-500 font-medium">You</p>}
                </div>
                <button
                  onClick={() => navigate(`/student/profile/${encodeURIComponent(memberName)}`)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  View Profile
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'Resources' && (
          <motion.div key="resources" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {member && (
              <button onClick={() => setShowAddResource(true)} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> Share Resource
              </button>
            )}
            {community.resources.length === 0 ? (
              <div className="text-center py-12 text-neutral-500"><BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No resources yet</p></div>
            ) : (
              community.resources.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 flex items-start gap-3"
                >
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600"><Link2 className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-white text-sm">{r.title}</p>
                    {r.description && <p className="text-xs text-neutral-500 mt-0.5">{r.description}</p>}
                    {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 block">{r.url}</a>}
                    <p className="text-xs text-neutral-400 mt-1">by {r.addedBy} · {new Date(r.addedAt).toLocaleDateString()}</p>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'Events' && (
          <motion.div key="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {member && (
              <button onClick={() => setShowAddEvent(true)} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> Add Event
              </button>
            )}
            {community.events.length === 0 ? (
              <div className="text-center py-12 text-neutral-500"><Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No upcoming events</p></div>
            ) : (
              community.events.map((ev, i) => (
                <motion.div key={ev.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600"><Calendar className="w-5 h-5" /></div>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">{ev.title}</p>
                      {ev.date && <p className="text-sm text-neutral-500">{ev.date} {ev.time && `at ${ev.time}`}</p>}
                      {ev.venue && <p className="text-sm text-neutral-500">📍 {ev.venue}</p>}
                      {ev.description && <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{ev.description}</p>}
                      <p className="text-xs text-neutral-400 mt-2">by {ev.createdBy}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Resource Modal */}
      <AnimatePresence>
        {showAddResource && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddResource(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md border border-neutral-200 dark:border-neutral-800 shadow-2xl">
              <div className="flex justify-between mb-4"><h3 className="font-bold text-neutral-900 dark:text-white">Share a Resource</h3><button onClick={() => setShowAddResource(false)}><X className="w-5 h-5 text-neutral-500" /></button></div>
              <div className="space-y-3">
                <input value={resourceForm.title} onChange={e => setResourceForm(p => ({ ...p, title: e.target.value }))} placeholder="Title *" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={resourceForm.url} onChange={e => setResourceForm(p => ({ ...p, url: e.target.value }))} placeholder="URL (https://...)" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={resourceForm.description} onChange={e => setResourceForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={handleAddResource} className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors">Share Resource</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddEvent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddEvent(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md border border-neutral-200 dark:border-neutral-800 shadow-2xl">
              <div className="flex justify-between mb-4"><h3 className="font-bold text-neutral-900 dark:text-white">Add Event</h3><button onClick={() => setShowAddEvent(false)}><X className="w-5 h-5 text-neutral-500" /></button></div>
              <div className="space-y-3">
                <input value={eventForm.title} onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))} placeholder="Event title *" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={eventForm.date} onChange={e => setEventForm(p => ({ ...p, date: e.target.value }))} className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="time" value={eventForm.time} onChange={e => setEventForm(p => ({ ...p, time: e.target.value }))} className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <input value={eventForm.venue} onChange={e => setEventForm(p => ({ ...p, venue: e.target.value }))} placeholder="Venue / Link" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <textarea value={eventForm.description} onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))} placeholder="Description" rows={2} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                <button onClick={handleAddEvent} className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors">Add Event</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunityDetailPage;
