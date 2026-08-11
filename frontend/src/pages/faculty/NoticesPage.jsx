import React, { useState } from 'react';
import { Bell, Plus, Pin, Edit, Trash2, FileText, Calendar, Clock, User, MapPin, Filter, Users, Paperclip, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import AttachmentPreview from '@/components/AttachmentPreview';
import { useNotices } from '@/hooks/useNotices';
import { useDepartments } from '@/hooks/useDepartments';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import TimetableModal from '@/components/TimetableModal';
import TimetablePreview from '@/components/TimetablePreview';
import autoTable from 'jspdf-autotable';

const FacultyNoticesPage = () => {
  const { notices, addNotice, updateNotice, deleteNotice } = useNotices();
  const { departments } = useDepartments();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentName, setAttachmentName] = useState('');
  
  // New Filter States
  const [targetAudience, setTargetAudience] = useState('Student');
  const [targetDepartment, setTargetDepartment] = useState('All');
  const [targetYear, setTargetYear] = useState('All');

  const currentUser = JSON.parse(localStorage.getItem('user')) || { name: 'Demo Faculty', role: 'Faculty' };

  const handleFileUpload = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit && editingNotice) {
          setEditingNotice({ ...editingNotice, attachment: reader.result, attachmentName: file.name });
        } else {
          setAttachment(reader.result);
          setAttachmentName(file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = () => {
    if (!newTitle || !newContent) return;
    addNotice({
      title: newTitle,
      content: newContent,
      pinned: isPinned,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      targetAudience,
      targetDepartment,
      targetYear,
      attachment,
      attachmentName
    });
    setNewTitle('');
    setNewContent('');
    setIsPinned(false);
    setAttachment(null);
    setAttachmentName('');
    setTargetAudience('Student');
    setTargetDepartment('All');
    setTargetYear('All');
    setIsCreateOpen(false);
  };

  const handleEditClick = (notice) => {
    setEditingNotice(notice);
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    updateNotice(editingNotice.id, {
      title: editingNotice.title,
      content: editingNotice.content,
      pinned: editingNotice.pinned,
      targetAudience: editingNotice.targetAudience,
      targetDepartment: editingNotice.targetDepartment,
      targetYear: editingNotice.targetYear,
      attachment: editingNotice.attachment,
      attachmentName: editingNotice.attachmentName
    });
    setIsEditOpen(false);
  };

  

  const handleDownload = (attachment, attachmentName) => {
    if (!attachment) return;
    const link = document.createElement("a");
    link.href = attachment;
    link.download = attachmentName || "Notice_Attachment";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 dark:bg-neutral-900/50 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Notice Board</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Broadcast important announcements to your students or peers.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all rounded-xl px-5 h-11">
              <Plus className="w-5 h-5 mr-2" /> Post Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <DialogHeader className="pt-4">
              <DialogTitle className="text-xl">Publish Announcement</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 mt-2">
              <div className="space-y-2">
                <Label className="text-xs uppercase text-neutral-500 font-bold tracking-wider">Notice Title</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Extra Class on Saturday" className="h-11 rounded-xl" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-neutral-500 font-bold tracking-wider">Target Department</Label>
                  <select 
                    value={targetDepartment} 
                    onChange={(e) => setTargetDepartment(e.target.value)}
                    className="w-full h-11 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-950 transition-colors"
                  >
                    <option value="All">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept.id || dept.name} value={dept.name || dept}>{dept.name || dept}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-neutral-500 font-bold tracking-wider">Target Year</Label>
                  <select 
                    value={targetYear} 
                    onChange={(e) => setTargetYear(e.target.value)}
                    className="w-full h-11 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-950 transition-colors"
                  >
                    <option value="All">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase text-neutral-500 font-bold tracking-wider">Content</Label>
                <Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Write the announcement details..." className="h-32 rounded-xl resize-none" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase text-neutral-500 font-bold tracking-wider">Attachment (Optional)</Label>
                <Input type="file" onChange={(e) => handleFileUpload(e, false)} className="cursor-pointer file:bg-indigo-50 file:text-indigo-700 file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 file:font-semibold hover:file:bg-indigo-100" />
                {attachmentName && <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center mt-2"><Check className="w-4 h-4 mr-1" /> {attachmentName}</p>}
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 group-hover:border-indigo-500 transition-colors">
                    <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="absolute opacity-0 w-full h-full cursor-pointer" />
                    {isPinned && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 pointer-events-none" />}
                  </div>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Pin to top</span>
                </label>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 shadow-sm" onClick={handleCreate}>Post Now</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[550px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <DialogHeader className="pt-4">
            <DialogTitle className="text-xl">Edit Notice</DialogTitle>
          </DialogHeader>
          {editingNotice && (
            <div className="space-y-5 mt-2">
              <div className="space-y-2">
                <Label className="text-xs uppercase text-neutral-500 font-bold tracking-wider">Notice Title</Label>
                <Input value={editingNotice.title} onChange={(e) => setEditingNotice({...editingNotice, title: e.target.value})} className="h-11 rounded-xl" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-neutral-500 font-bold tracking-wider">Target Department</Label>
                  <select 
                    value={editingNotice.targetDepartment || 'All'} 
                    onChange={(e) => setEditingNotice({...editingNotice, targetDepartment: e.target.value})}
                    className="w-full h-11 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-950 transition-colors"
                  >
                    <option value="All">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept.id || dept.name} value={dept.name || dept}>{dept.name || dept}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-neutral-500 font-bold tracking-wider">Target Year</Label>
                  <select 
                    value={editingNotice.targetYear || 'All'} 
                    onChange={(e) => setEditingNotice({...editingNotice, targetYear: e.target.value})}
                    className="w-full h-11 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-950 transition-colors"
                  >
                    <option value="All">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase text-neutral-500 font-bold tracking-wider">Content</Label>
                <Textarea value={editingNotice.content} onChange={(e) => setEditingNotice({...editingNotice, content: e.target.value})} className="h-32 rounded-xl resize-none" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase text-neutral-500 font-bold tracking-wider">Attachment (Optional)</Label>
                <Input type="file" onChange={(e) => handleFileUpload(e, true)} className="cursor-pointer file:bg-indigo-50 file:text-indigo-700 file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 file:font-semibold hover:file:bg-indigo-100" />
                {editingNotice.attachmentName && <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center mt-2"><Check className="w-4 h-4 mr-1" /> {editingNotice.attachmentName}</p>}
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 group-hover:border-indigo-500 transition-colors">
                    <input type="checkbox" checked={editingNotice.pinned} onChange={(e) => setEditingNotice({...editingNotice, pinned: e.target.checked})} className="absolute opacity-0 w-full h-full cursor-pointer" />
                    {editingNotice.pinned && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 pointer-events-none" />}
                  </div>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Pin to top</span>
                </label>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 shadow-sm" onClick={handleSaveEdit}>Save Updates</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-5">
        <AnimatePresence>
          {notices.map((notice, idx) => (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-800/50 ${notice.pinned ? 'border-l-4 border-l-indigo-500 shadow-md' : 'shadow-sm'}`}>
                {notice.pinned && (
                  <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-lg flex items-center shadow-sm">
                    <Pin className="w-3 h-3 mr-1 fill-current" /> Pinned
                  </div>
                )}
                <CardHeader className="pb-3 pt-5 px-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white mb-2 pr-8 leading-tight">
                        {notice.title}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                        <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> {notice.date}</span>
                        <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700"></span>
                        <span className={`flex items-center ${notice.authorRole === 'Admin' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}`}>
                          <User className="w-3.5 h-3.5 mr-1" /> 
                          {notice.authorName} {notice.authorName === currentUser.name ? '(You)' : ''}
                        </span>
                      </CardDescription>
                    </div>
                    
                    {/* Targeting Badge */}
                    <div className="flex flex-wrap gap-2 md:justify-end shrink-0">
                      <Badge variant="outline" className="bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 px-2.5 py-1">
                        <Filter className="w-3 h-3" />
                        {notice.targetDepartment === 'All' && notice.targetYear === 'All' ? 'All Students' : 
                          `${notice.targetDepartment !== 'All' ? notice.targetDepartment : 'All Depts'} • ${notice.targetYear !== 'All' ? `Year ${notice.targetYear}` : 'All Years'}`
                        }
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="px-6 pb-6">
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap text-[15px]">
                    {notice.content}
                  </p>

                  {notice.attachment && !notice.isTimetable && (
                    <AttachmentPreview 
                      attachment={notice.attachment} 
                      attachmentName={notice.attachmentName} 
                      onDownload={handleDownload} 
                    />
                  )}

                    {notice.isTimetable && notice.scheduleData && (
                      <TimetablePreview notice={notice} />
                    )}
                  
                  <div className="flex flex-wrap justify-between items-center mt-6 gap-4">
                    {/* Placeholder for flex alignment */}
                    <div />

                    {/* Only show Edit/Delete if the Faculty member is the author */}
                    {notice.authorName === currentUser.name && (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-9 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors" onClick={() => handleEditClick(notice)}>
                          <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="h-9 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" onClick={() => deleteNotice(notice.id)}>
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {notices.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-500 border-2 border-dashed rounded-2xl border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
            <Bell className="w-12 h-12 mb-4 text-neutral-300 dark:text-neutral-600" />
            <h3 className="text-xl font-bold text-neutral-700 dark:text-neutral-300 mb-1">No announcements yet</h3>
            <p className="text-sm">Click "Post Notice" to create your first announcement.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyNoticesPage;
