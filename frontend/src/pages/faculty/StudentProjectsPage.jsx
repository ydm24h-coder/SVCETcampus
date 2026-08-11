import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderGit2, Search, Star, ExternalLink, GitBranch, MessageCircle, Send, X, ThumbsUp } from 'lucide-react';

const REVIEWS_KEY = 'svcet_faculty_project_reviews';

const getReviews = () => {
  try {
    return JSON.parse(localStorage.getItem(REVIEWS_KEY)) || {};
  } catch {
    return {};
  }
};

const FacultyStudentProjectsPage = () => {
  const sessionUser = JSON.parse(localStorage.getItem('svcet_session_faculty')) || {};
  const facultyName = sessionUser.name || 'Faculty';

  // Get all student projects from professional profiles
  const profilesRaw = localStorage.getItem('svcet_professional_profiles');
  const allProfiles = profilesRaw ? JSON.parse(profilesRaw) : {};

  const allProjects = [];
  Object.entries(allProfiles).forEach(([studentName, profile]) => {
    (profile.projects || []).forEach(p => {
      allProjects.push({ ...p, studentName });
    });
  });

  const [search, setSearch] = useState('');
  const [reviews, setReviews] = useState(() => getReviews());
  const [selectedProject, setSelectedProject] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [filterStatus, setFilterStatus] = useState('All');

  const filtered = allProjects.filter(p => {
    const matchSearch = p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      (Array.isArray(p.techStack) ? p.techStack.join(' ') : p.techStack || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterStatus === 'All' || p.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const saveReview = () => {
    if (!reviewForm.comment.trim()) return;
    const key = `${selectedProject.studentName}-${selectedProject.id}`;
    const updated = {
      ...reviews,
      [key]: {
        ...reviews[key],
        [facultyName]: { rating: reviewForm.rating, comment: reviewForm.comment, reviewedAt: new Date().toISOString() }
      }
    };
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));
    setReviews(updated);
    setSelectedProject(null);
    setReviewForm({ rating: 5, comment: '' });
  };

  const getProjectReviews = (studentName, projectId) => {
    const key = `${studentName}-${projectId}`;
    return reviews[key] ? Object.entries(reviews[key]) : [];
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <FolderGit2 className="w-6 h-6 text-indigo-500" /> Student Projects
        </h1>
        <p className="text-neutral-500 text-sm mt-0.5">Review student projects, rate their work, and provide constructive feedback.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 text-center border border-neutral-200 dark:border-neutral-800">
          <p className="text-3xl font-bold text-indigo-600">{allProjects.length}</p>
          <p className="text-sm text-neutral-500">Total Projects</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 text-center border border-neutral-200 dark:border-neutral-800">
          <p className="text-3xl font-bold text-green-600">{Object.keys(reviews).length}</p>
          <p className="text-sm text-neutral-500">Reviewed</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4 text-center border border-neutral-200 dark:border-neutral-800">
          <p className="text-3xl font-bold text-yellow-600">{allProjects.filter(p => p.status === 'In Progress').length}</p>
          <p className="text-sm text-neutral-500">In Progress</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects, students, technologies..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 backdrop-blur-xl"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Completed', 'In Progress', 'Planned'].map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === f ? 'bg-indigo-500 text-white' : 'bg-white/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Projects */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-neutral-500">
          <FolderGit2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{allProjects.length === 0 ? 'No student projects found' : 'No matching projects'}</p>
          <p className="text-sm">Students need to add projects from their profile page</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((project, i) => {
            const projectReviews = getProjectReviews(project.studentName, project.id);
            const myReview = projectReviews.find(([r]) => r === facultyName);
            return (
              <motion.div key={`${project.studentName}-${project.id}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col"
              >
                <div className="p-5 flex-1">
                  {/* Student */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                      {project.studentName?.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{project.studentName}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${project.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : project.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                      {project.status || 'Completed'}
                    </span>
                  </div>

                  <h3 className="font-bold text-neutral-900 dark:text-white mb-1">{project.title}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3">{project.description}</p>

                  {/* Tech Stack */}
                  {project.techStack && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(Array.isArray(project.techStack) ? project.techStack : project.techStack.split(',')).map(tech => (
                        <span key={tech} className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded-full">{tech.trim()}</span>
                      ))}
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex gap-2">
                    {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 px-2 py-1 rounded-lg transition-colors"><GitBranch className="w-3 h-3" />Code</a>}
                    {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-2 py-1 rounded-lg transition-colors"><ExternalLink className="w-3 h-3" />Demo</a>}
                  </div>

                  {/* Review count */}
                  {projectReviews.length > 0 && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-neutral-500">
                      <MessageCircle className="w-3 h-3" /> {projectReviews.length} faculty review(s)
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-neutral-100 dark:border-neutral-800">
                  {myReview ? (
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= myReview[1].rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'}`} />)}
                      </div>
                      <span className="text-xs text-neutral-500 flex-1">Your review submitted</span>
                      <button onClick={() => { setSelectedProject(project); setReviewForm({ rating: myReview[1].rating, comment: myReview[1].comment }); }} className="text-xs text-blue-500 hover:underline">Edit</button>
                    </div>
                  ) : (
                    <button onClick={() => { setSelectedProject(project); setReviewForm({ rating: 5, comment: '' }); }} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors">
                      <Star className="w-4 h-4" /> Review Project
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedProject(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md border border-neutral-200 dark:border-neutral-800 shadow-2xl">
              <div className="flex justify-between mb-4">
                <h3 className="font-bold text-neutral-900 dark:text-white">Review: {selectedProject.title}</h3>
                <button onClick={() => setSelectedProject(null)}><X className="w-5 h-5 text-neutral-500" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">Rating</label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} onClick={() => setReviewForm(p => ({ ...p, rating: s }))} className="transition-transform hover:scale-110">
                        <Star className={`w-8 h-8 ${s <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300 dark:text-neutral-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 block">Feedback *</label>
                  <textarea value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))} rows={4} placeholder="Provide constructive feedback on the project's design, implementation quality, code structure, and improvements..." className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
                <button onClick={saveReview} disabled={!reviewForm.comment.trim()} className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> Submit Review
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FacultyStudentProjectsPage;
