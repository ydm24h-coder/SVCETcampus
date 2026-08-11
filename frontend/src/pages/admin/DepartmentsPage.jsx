import React, { useState } from 'react';
import { Plus, Search, MoreVertical, Building2, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { useDepartments } from '@/hooks/useDepartments';
import { useStudents } from '@/hooks/useStudents';
import { useFaculty } from '@/hooks/useFaculty';

const DepartmentsPage = () => {
  const { departments, addDepartment, updateDepartment, deleteDepartment } = useDepartments();
  const { students, applyBulkUpdates: applyBulkUpdatesStudents } = useStudents();
  const { faculty, applyBulkUpdates: applyBulkUpdatesFaculty } = useFaculty();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({ name: '', code: '', hod: '' });
  const [editData, setEditData] = useState({ id: null, name: '', code: '', hod: '' });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addDepartment(formData);
    setFormData({ name: '', code: '', hod: '' });
    setIsDialogOpen(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const oldDept = departments.find(d => d.id === editData.id);
    const oldName = oldDept?.name;
    const newName = editData.name;

    updateDepartment(editData.id, { name: newName, code: editData.code, hod: editData.hod });
    
    if (oldName && oldName !== newName) {
      const studentsToUpdate = students.filter(s => s.department === oldName).map(s => ({ id: s.id, data: { department: newName } }));
      if (studentsToUpdate.length > 0) applyBulkUpdatesStudents(studentsToUpdate);
      
      const facultyToUpdate = faculty.filter(f => f.department === oldName).map(f => ({ id: f.id, data: { department: newName } }));
      if (facultyToUpdate.length > 0) applyBulkUpdatesFaculty(facultyToUpdate);
    }
    
    setIsEditDialogOpen(false);
  };

  const handleDelete = (id) => {
    const deptToDelete = departments.find(d => d.id === id);
    if (confirm(`Are you sure you want to delete ${deptToDelete?.name || 'this department'}? Users assigned to this department will be marked as "Unassigned".`)) {
      deleteDepartment(id);
      
      if (deptToDelete) {
         const studentsToUpdate = students.filter(s => s.department === deptToDelete.name).map(s => ({ id: s.id, data: { department: 'Unassigned' } }));
         if (studentsToUpdate.length > 0) applyBulkUpdatesStudents(studentsToUpdate);
         
         const facultyToUpdate = faculty.filter(f => f.department === deptToDelete.name).map(f => ({ id: f.id, data: { department: 'Unassigned' } }));
         if (facultyToUpdate.length > 0) applyBulkUpdatesFaculty(facultyToUpdate);
      }
    }
  };

  const openEditDialog = (dept) => {
    setEditData({ id: dept.id, name: dept.name, code: dept.code, hod: dept.hod || '' });
    setIsEditDialogOpen(true);
  };

  const filteredDepartments = departments.filter(d => 
    d.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Manage university departments and HODs.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Department
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Department Code (e.g. 104)</Label>
                <Input id="code" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Full Department Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hod">Head of Department</Label>
                <select 
                  id="hod"
                  value={formData.hod} 
                  onChange={(e) => setFormData({...formData, hod: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:focus-visible:ring-blue-800"
                >
                  <option value="">-- Select HOD --</option>
                  {faculty.map(f => (
                    <option key={f.id} value={f.name}>{f.name} ({f.facultyId})</option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">Save Department</Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-code">Department Code</Label>
                <Input id="edit-code" value={editData.code} onChange={(e) => setEditData({...editData, code: e.target.value.toUpperCase()})} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Full Department Name</Label>
                <Input id="edit-name" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-hod">Head of Department</Label>
                <select 
                  id="edit-hod"
                  value={editData.hod} 
                  onChange={(e) => setEditData({...editData, hod: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:focus-visible:ring-blue-800"
                >
                  <option value="">-- Select HOD --</option>
                  {faculty.map(f => (
                    <option key={f.id} value={f.name}>{f.name} ({f.facultyId})</option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">Update Department</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <CardTitle className="text-lg font-medium">Active Departments</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
            <Input 
              type="search" 
              placeholder="Search departments..." 
              className="pl-8 bg-neutral-100 dark:bg-neutral-800 border-none" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-neutral-50 dark:bg-neutral-900/50">
              <TableRow className="border-neutral-100 dark:border-neutral-800 hover:bg-transparent">
                <TableHead>Department</TableHead>
                <TableHead>Head of Department</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Faculty</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-neutral-500">No departments found.</TableCell>
                </TableRow>
              ) : (
                filteredDepartments.map((dept) => {
                  const deptStudents = students.filter(s => s.department === dept.name).length;
                  const deptFaculty = faculty.filter(f => f.department === dept.name).length;

                  return (
                    <TableRow key={dept.id} className="border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                            {dept.code}
                          </div>
                          <div className="font-medium">{dept.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{dept.hod || <span className="text-neutral-400 italic">Not Assigned</span>}</TableCell>
                      <TableCell>
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {deptStudents} Enrolled
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {deptFaculty} Members
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10" onClick={() => openEditDialog(dept)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => handleDelete(dept.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepartmentsPage;
