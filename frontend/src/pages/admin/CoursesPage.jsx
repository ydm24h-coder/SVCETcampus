import React, { useState } from 'react';
import { Plus, Search, BookOpen, ArrowLeft, Trash2, Edit2, Check, X, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useCourses } from '@/hooks/useCourses';
import { useNotices } from '@/hooks/useNotices';
import { useDepartments } from '@/hooks/useDepartments';

const CoursesPage = () => {
  const { departments } = useDepartments();
  const { courses, addCourse, updateCourse, deleteCourse } = useCourses();
  const { addNotice } = useNotices();
  const [selectedDomain, setSelectedDomain] = useState(null);
  
  // Add Domain State
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDomain, setNewDomain] = useState({ name: '', code: '', dept: '', credits: 4 });

  // Milestone State
  const [milestoneForm, setMilestoneForm] = useState({ id: null, title: '', description: '', tamilVideoUrl: '', englishVideoUrl: '', usefulLinks: [], certDescription: '', certLink: '' });
  const [isEditingMilestone, setIsEditingMilestone] = useState(false);

  const handleAddDomain = () => {
    if (!newDomain.name || !newDomain.code) return;
    addCourse({
      ...newDomain,
      roadmap: []
    });
    
    addNotice({
      title: 'New Domain Added',
      content: `${newDomain.name} has been added to the curriculum!`,
      authorName: 'Administrator',
      authorRole: 'Admin',
      pinned: false
    });

    setNewDomain({ name: '', code: '', dept: '', credits: 4 });
    setShowAddDialog(false);
  };

  const handleSaveMilestone = () => {
    if (!milestoneForm.title) return;
    
    let updatedRoadmap = [...(selectedDomain.roadmap || [])];
    
    if (isEditingMilestone) {
      updatedRoadmap = updatedRoadmap.map(m => m.id === milestoneForm.id ? { ...milestoneForm } : m);
    } else {
      updatedRoadmap.push({ ...milestoneForm, id: Date.now() });
    }
    
    const updatedDomain = { ...selectedDomain, roadmap: updatedRoadmap };
    updateCourse(selectedDomain.id, { roadmap: updatedRoadmap });
    setSelectedDomain(updatedDomain);
    
    addNotice({
      title: 'Roadmap Updated',
      content: `The roadmap for ${selectedDomain.name} has been updated. Check out the new milestones!`,
      authorName: 'Administrator',
      authorRole: 'Admin',
      pinned: false
    });
    
    setMilestoneForm({ id: null, title: '', description: '', tamilVideoUrl: '', englishVideoUrl: '', usefulLinks: [], certDescription: '', certLink: '' });
    setIsEditingMilestone(false);
  };

  const handleDeleteMilestone = (milestoneId) => {
    const updatedRoadmap = (selectedDomain.roadmap || []).filter(m => m.id !== milestoneId);
    const updatedDomain = { ...selectedDomain, roadmap: updatedRoadmap };
    updateCourse(selectedDomain.id, { roadmap: updatedRoadmap });
    setSelectedDomain(updatedDomain);
  };

  const startEditMilestone = (milestone) => {
    setMilestoneForm(milestone);
    setIsEditingMilestone(true);
  };

  const cancelEditMilestone = () => {
    setMilestoneForm({ id: null, title: '', description: '', tamilVideoUrl: '', englishVideoUrl: '', usefulLinks: [], certDescription: '', certLink: '' });
    setIsEditingMilestone(false);
  };

  // -----------------------------------------------------
  // ROADMAP BUILDER VIEW
  // -----------------------------------------------------
  if (selectedDomain) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedDomain(null)} className="pl-0 hover:bg-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Domains
          </Button>
        </div>
        
        <div>
          <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
            {selectedDomain.dept} Domain
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">{selectedDomain.name} Roadmap</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2">Construct the learning path and milestone syllabus for this domain.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          {/* Timeline Display */}
          <div className="md:col-span-2 space-y-6">
            {!selectedDomain.roadmap || selectedDomain.roadmap.length === 0 ? (
              <div className="text-center p-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50">
                <BookOpen className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">No Milestones Yet</h3>
                <p className="text-neutral-500 text-sm mt-1">Start adding milestones to build your curriculum roadmap.</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 dark:before:via-neutral-800 before:to-transparent">
                {selectedDomain.roadmap.map((milestone, index) => (
                  <div key={milestone.id} className="relative flex items-start group">
                    <div className="absolute left-0 -ml-6 mt-1 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full border-4 border-white dark:border-[#0a0a0a] bg-blue-500 shadow-sm z-10 flex items-center justify-center">
                        <span className="text-[10px] text-white font-bold">{index + 1}</span>
                      </div>
                    </div>
                    <Card className="w-full border-neutral-200 dark:border-neutral-800 shadow-sm group-hover:border-blue-300 dark:group-hover:border-blue-800 transition-colors">
                      <CardContent className="p-5 flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-lg">{milestone.title}</h4>
                          <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1 leading-relaxed">
                            {milestone.description}
                          </p>
                          {(milestone.tamilVideoUrl || milestone.englishVideoUrl || (milestone.usefulLinks && milestone.usefulLinks.length > 0) || milestone.certLink) && (
                            <div className="flex gap-3 mt-3 flex-wrap">
                              {milestone.tamilVideoUrl && (
                                <Badge variant="secondary" className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">Tamil Video</Badge>
                              )}
                              {milestone.englishVideoUrl && (
                                <Badge variant="secondary" className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">English Video</Badge>
                              )}
                              {milestone.usefulLinks && milestone.usefulLinks.length > 0 && (
                                <Badge variant="secondary" className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">{milestone.usefulLinks.length} Links</Badge>
                              )}
                              {milestone.certLink && (
                                <Badge variant="secondary" className="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">Certification</Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-blue-600" onClick={() => startEditMilestone(milestone)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-red-600" onClick={() => handleDeleteMilestone(milestone.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          <div className="md:col-span-1">
            <Card className="border-neutral-200 dark:border-neutral-800 shadow-md sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">{isEditingMilestone ? 'Edit Milestone' : 'Add Milestone'}</CardTitle>
                <CardDescription>
                  {isEditingMilestone ? 'Update the details for this step.' : 'Define a new step in the domain roadmap.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input 
                    placeholder="e.g. Module 1: HTML Basics" 
                    value={milestoneForm.title}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Describe what students will learn..."
                    className="min-h-[100px]"
                    value={milestoneForm.description}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tamil Course Video URL (Optional)</Label>
                  <Input 
                    placeholder="e.g. https://youtube.com/watch?v=tamil_vid" 
                    value={milestoneForm.tamilVideoUrl || ''}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, tamilVideoUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>English Course Video URL (Optional)</Label>
                  <Input 
                    placeholder="e.g. https://youtube.com/watch?v=english_vid" 
                    value={milestoneForm.englishVideoUrl || ''}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, englishVideoUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Useful Links (One URL per line)</Label>
                  <Textarea 
                    placeholder="https://link1.com&#10;https://link2.com" 
                    value={milestoneForm.usefulLinks ? milestoneForm.usefulLinks.join('\n') : ''}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, usefulLinks: e.target.value.split('\n').filter(l => l.trim() !== '') })}
                  />
                </div>
                <div className="space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-4 mt-2">
                  <Label className="text-amber-600 dark:text-amber-500 font-semibold flex items-center gap-2">
                    <Award className="w-4 h-4" /> Free Certification
                  </Label>
                  <Input 
                    placeholder="Certification Title / Description" 
                    value={milestoneForm.certDescription || ''}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, certDescription: e.target.value })}
                    className="mb-2"
                  />
                  <Input 
                    placeholder="Certification Link URL" 
                    value={milestoneForm.certLink || ''}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, certLink: e.target.value })}
                  />
                </div>
                <div className="pt-2 flex gap-2">
                  <Button onClick={handleSaveMilestone} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    {isEditingMilestone ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {isEditingMilestone ? 'Update' : 'Add'}
                  </Button>
                  {isEditingMilestone && (
                    <Button variant="outline" size="icon" onClick={cancelEditMilestone}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------
  // MAIN DOMAIN LIST VIEW
  // -----------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Domains</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Manage technical domains, credits, and roadmaps.</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Domain
        </Button>
      </div>

      <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <CardTitle className="text-lg font-medium">All Domains</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
            <Input type="search" placeholder="Search domains..." className="pl-8 bg-neutral-100 dark:bg-neutral-800 border-none" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-200 dark:border-neutral-800">
                <TableHead>Domain Name & Code</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Milestones</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id} className="border-neutral-200 dark:border-neutral-800">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-white">{course.name}</div>
                        <div className="text-xs text-neutral-500">{course.code}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{course.dept}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-neutral-100 dark:bg-neutral-800">
                      {course.roadmap?.length || 0} Steps
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedDomain(course)} className="font-medium text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/20">
                        Edit Roadmap
                      </Button>
                      <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => {
                        if (confirm(`Are you sure you want to delete ${course.name}?`)) {
                          deleteCourse(course.id);
                        }
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Domain Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle>Add New Domain</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-xs font-bold uppercase text-neutral-500">Name</Label>
              <Input
                id="name"
                value={newDomain.name}
                onChange={(e) => setNewDomain({...newDomain, name: e.target.value})}
                className="col-span-3 bg-neutral-50 dark:bg-neutral-950"
                placeholder="e.g. Full Stack Python"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right text-xs font-bold uppercase text-neutral-500">Code</Label>
              <Input
                id="code"
                value={newDomain.code}
                onChange={(e) => setNewDomain({...newDomain, code: e.target.value})}
                className="col-span-3 bg-neutral-50 dark:bg-neutral-950"
                placeholder="e.g. FSD-PY"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dept" className="text-right text-xs font-bold uppercase text-neutral-500">Dept</Label>
              <select 
                id="dept"
                value={newDomain.dept} 
                onChange={(e) => setNewDomain({...newDomain, dept: e.target.value})}
                className="col-span-3 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-950"
              >
                <option value="" disabled>Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Tech">Information Tech</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddDomain} className="bg-blue-600 hover:bg-blue-700 text-white">Create Domain</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoursesPage;
