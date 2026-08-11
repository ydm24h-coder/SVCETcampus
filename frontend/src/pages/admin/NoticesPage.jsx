import React, { useState } from 'react';
import { Bell, Plus, Pin, Edit, Trash2, Paperclip, Download, Filter, Target, Users, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import AttachmentPreview from '@/components/AttachmentPreview';
import TimetablePreview from '@/components/TimetablePreview';
import { useNotices } from '@/hooks/useNotices';
import { useSmartFilters } from '@/hooks/useSmartFilters';
import SmartFilter from '@/components/SmartFilter';
import { useDepartments } from '@/hooks/useDepartments';
const YEARS = ['All', 'Year 1', 'Year 2', 'Year 3', 'Year 4'];
const AUDIENCES = ['Both', 'Student', 'Faculty'];

const AdminNoticesPage = () => {
  const { notices, addNotice, updateNotice, deleteNotice } = useNotices();
  const { departments } = useDepartments();
  const DEPARTMENTS = ['All', ...departments.map(d => d.name)];
  
  const activeDepartments = [...departments.map(d => d.name || d)];
  const activeAudiences = ['Student', 'Faculty'];
  const activeYears = ['1', '2', '3', '4'];
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);

  // New Notice State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentName, setAttachmentName] = useState('');
  const [targetAudience, setTargetAudience] = useState('Both');
  const [targetDept, setTargetDept] = useState('All');
  const [targetYear, setTargetYear] = useState('All');

  // Filter State for Admin View
  const [filterAudience, setFilterAudience] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  
  // Map notice target fields to match useSmartFilters expectations
  const filterableNotices = notices.map(n => ({
    ...n,
    department: n.targetDepartment && n.targetDepartment !== 'All' ? n.targetDepartment : null,
    year: n.targetYear && n.targetYear !== 'All' ? n.targetYear : null,
  }));
  const { availableDepartments, availableYears } = useSmartFilters(filterableNotices, filterDept, filterYear);

  const currentUser = JSON.parse(localStorage.getItem('svcet_session_admin')) || { name: 'Admin', role: 'Admin' };

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
      attachment: attachment,
      attachmentName: attachmentName,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      targetAudience: targetAudience,
      targetDepartment: targetDept,
      targetYear: targetYear,
      isTimetable: false
    });
    setNewTitle('');
    setNewContent('');
    setIsPinned(false);
    setAttachment(null);
    setAttachmentName('');
    setTargetAudience('Both');
    setTargetDept('All');
    setTargetYear('All');
    setIsCreateOpen(false);
  };

  const handleEditClick = (notice) => {
    setEditingNotice({
      ...notice,
      targetAudience: notice.targetAudience || 'Both',
      targetDepartment: notice.targetDepartment || 'All',
      targetYear: notice.targetYear || 'All'
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    updateNotice(editingNotice.id, {
      title: editingNotice.title,
      content: editingNotice.content,
      pinned: editingNotice.pinned,
      attachment: editingNotice.attachment,
      attachmentName: editingNotice.attachmentName,
      targetAudience: editingNotice.targetAudience,
      targetDepartment: editingNotice.targetDepartment,
      targetYear: editingNotice.targetYear
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

  const filteredNotices = notices.filter(n => {
    if (filterAudience !== 'All') {
      const aud = n.targetAudience || 'Both';
      if (aud !== 'Both' && aud !== filterAudience) return false;
    }
    if (filterDept !== 'All') {
      const dept = n.targetDepartment || 'All';
      if (dept !== 'All' && String(dept).toLowerCase() !== String(filterDept).toLowerCase()) return false;
    }
    if (filterYear !== 'All') {
      const yr = n.targetYear || 'All';
      if (yr !== 'All' && String(yr).toLowerCase() !== String(filterYear).toLowerCase()) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
              <Bell className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Notice Center</h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-xl">Advanced broadcast module. Target specific departments, years, or audiences precisely.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 px-6 py-6 rounded-xl text-md font-semibold transition-transform hover:scale-[1.02]">
              <Plus className="w-5 h-5 mr-2" /> Publish Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center">
                <Target className="w-5 h-5 mr-2 text-orange-500" /> New Targeted Notice
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-500 uppercase">Target Audience</Label>
                  <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-neutral-300">
                    {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-500 uppercase">Target Department</Label>
                  <select value={targetDept} onChange={(e) => setTargetDept(e.target.value)} className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-neutral-300">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-neutral-500 uppercase">Target Year</Label>
                  <select value={targetYear} onChange={(e) => setTargetYear(e.target.value)} className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-neutral-300">
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-neutral-900 dark:text-neutral-200">Notice Title</Label>
                <Input className="h-12 border-neutral-300 focus:ring-orange-500" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. End Semester Exams Schedule Update" />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-neutral-900 dark:text-neutral-200">Content</Label>
                <Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Write the announcement details..." className="h-40 border-neutral-300 focus:ring-orange-500" />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <Label className="font-semibold text-neutral-900 dark:text-neutral-200">Attachment (Optional)</Label>
                  <div className="flex items-center gap-4">
                    <Input type="file" onChange={(e) => handleFileUpload(e, false)} className="cursor-pointer file:bg-orange-50 file:text-orange-700 file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 file:font-semibold hover:file:bg-orange-100" />
                  </div>
                  {attachmentName && <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center mt-2"><CheckCircle2 className="w-4 h-4 mr-1" /> {attachmentName}</p>}
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                    <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500" />
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">Pin to Top</span>
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6 border-t border-neutral-100 dark:border-neutral-900 pt-4">
              <Button className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-8 h-11 rounded-lg font-bold" onClick={handleCreate}>Publish Notice</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admin View Filters */}
      <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm bg-white/50 dark:bg-neutral-900/30">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center text-sm font-bold text-neutral-500 uppercase tracking-wider shrink-0">
              <Filter className="w-4 h-4 mr-2" /> View As:
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full">
              <select value={filterAudience} onChange={(e) => setFilterAudience(e.target.value)} className="h-9 px-3 py-1 rounded-md border border-neutral-200 bg-white text-sm font-medium">
                <option value="All">All Audiences</option>
                {activeAudiences.map(a => <option key={a} value={a}>{a} Only</option>)}
              </select>
              <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="h-9 px-3 py-1 rounded-md border border-neutral-200 bg-white text-sm font-medium">
                <option value="All">All Departments</option>
                {activeDepartments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="h-9 px-3 py-1 rounded-md border border-neutral-200 bg-white text-sm font-medium">
                <option value="All">All Years</option>
                {activeYears.map(y => <option key={y} value={y}>{y}{y === '1' ? 'st' : y === '2' ? 'nd' : y === '3' ? 'rd' : 'th'} Year</option>)}
              </select>
            </div>
            <div className="shrink-0 text-sm font-medium text-neutral-500">
              Showing {filteredNotices.length} notices
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center"><Edit className="w-5 h-5 mr-2 text-indigo-500" /> Edit Notice</DialogTitle>
          </DialogHeader>
          {editingNotice && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
                <div>
                  <Label className="text-xs">Target Audience</Label>
                  <select value={editingNotice.targetAudience} onChange={(e) => setEditingNotice({...editingNotice, targetAudience: e.target.value})} className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm">
                    {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Target Department</Label>
                  <select value={editingNotice.targetDepartment} onChange={(e) => setEditingNotice({...editingNotice, targetDepartment: e.target.value})} className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Target Year</Label>
                  <select value={editingNotice.targetYear} onChange={(e) => setEditingNotice({...editingNotice, targetYear: e.target.value})} className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm">
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Notice Title</Label>
                <Input value={editingNotice.title} onChange={(e) => setEditingNotice({...editingNotice, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea value={editingNotice.content} onChange={(e) => setEditingNotice({...editingNotice, content: e.target.value})} className="h-32" />
              </div>
              <div className="space-y-2">
                <Label>Attachment (Optional)</Label>
                <div className="flex items-center gap-4">
                  <Input type="file" onChange={(e) => handleFileUpload(e, true)} className="cursor-pointer" />
                  {editingNotice.attachmentName && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Attached: {editingNotice.attachmentName}</span>}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editingNotice.pinned} onChange={(e) => setEditingNotice({...editingNotice, pinned: e.target.checked})} className="w-4 h-4" />
                <span className="text-sm font-medium">Pin this notice</span>
              </label>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {filteredNotices.map((notice) => (
          <Card key={notice.id} className={`border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur relative overflow-hidden transition-all hover:shadow-md ${notice.pinned ? 'border-l-4 border-l-orange-500' : ''}`}>
            {notice.pinned && (
              <div className="absolute top-0 right-0">
                <div className="bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg flex items-center shadow-sm">
                  <Pin className="w-3 h-3 mr-1 fill-white" /> Pinned
                </div>
              </div>
            )}
            <CardHeader className="pb-3 pt-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="outline" className={`font-semibold ${
                  (notice.targetAudience === 'Student' || notice.targetAudience === 'Both') 
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' 
                    : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400'
                }`}>
                  <Users className="w-3 h-3 mr-1" />
                  {notice.targetAudience || 'Both'}
                </Badge>
                
                {notice.targetDepartment && notice.targetDepartment !== 'All' && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400">
                    <MapPin className="w-3 h-3 mr-1" />
                    {notice.targetDepartment}
                  </Badge>
                )}
                
                {notice.targetYear && notice.targetYear !== 'All' && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400">
                    <Calendar className="w-3 h-3 mr-1" />
                    {notice.targetYear}
                  </Badge>
                )}

                {notice.isTimetable && (
                  <Badge variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Timetable
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl font-bold text-neutral-900 dark:text-white leading-tight pr-12">
                {notice.title}
              </CardTitle>
              <CardDescription className="text-xs font-medium flex flex-wrap items-center gap-2 mt-2">
                <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {notice.date}</span>
                <span>•</span>
                <span className={`font-semibold ${notice.authorRole === 'Admin' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}`}>
                  Posted by {notice.authorName} ({notice.authorRole})
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed text-[15px]">
                {notice.content}
              </p>
              {notice.attachment && !notice.isTimetable && (
                <AttachmentPreview 
                  attachment={notice.attachment} 
                  attachmentName={notice.attachmentName} 
                  onDownload={handleDownload} 
                />
              )}
              <div className="mt-6 flex gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <Button variant="outline" size="sm" className="h-9 hover:bg-indigo-50 hover:text-indigo-700 transition-colors" onClick={() => handleEditClick(notice)}>
                  <Edit className="w-4 h-4 mr-1.5" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="h-9 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" onClick={() => deleteNotice(notice.id)}>
                  <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredNotices.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-500 bg-white/50 dark:bg-neutral-900/30 border border-dashed rounded-2xl border-neutral-300 dark:border-neutral-800">
            <Bell className="w-12 h-12 mb-4 text-neutral-300 dark:text-neutral-700" />
            <p className="text-lg font-medium text-neutral-600 dark:text-neutral-400">No notices match your filters.</p>
            <Button variant="link" onClick={() => { setFilterAudience('All'); setFilterDept('All'); setFilterYear('All'); }} className="mt-2 text-indigo-600">Clear filters</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNoticesPage;
