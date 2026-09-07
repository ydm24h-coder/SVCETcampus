import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Plus, Search, MoreVertical, Briefcase, Trash2, Eye, EyeOff, Edit, ListChecks, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { useFaculty } from '@/hooks/useFaculty';
import { useSmartFilters } from '@/hooks/useSmartFilters';
import { useDepartments } from '@/hooks/useDepartments';
import SmartFilter from '@/components/SmartFilter';

const FacultyPage = () => {
  const { faculty, loading, addFaculty, deleteFaculty, updateFaculty, applyBulkUpdates, bulkDeleteFaculty, bulkAddFaculty } = useFaculty();
  const { departments } = useDepartments();
  
  const fileInputRef = useRef(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('All');
  const { availableDepartments } = useSmartFilters(faculty, filterDepartment, 'All');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    facultyId: '',
    department: '',
    designation: ''
  });

  const [editFormData, setEditFormData] = useState({
    id: null,
    name: '',
    password: '',
    facultyId: '',
    department: '',
    designation: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addFaculty(formData);
    setIsDialogOpen(false);
    setFormData({ name: '', email: '', password: '', facultyId: '', department: '', designation: '' });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateFaculty(editFormData.id, {
      name: editFormData.name,
      password: editFormData.password,
      facultyId: editFormData.facultyId,
      department: editFormData.department,
      designation: editFormData.designation
    });
    setIsEditDialogOpen(false);
  };

  const openEditModal = (member) => {
    setEditFormData({
      id: member.id,
      name: member.name || '',
      password: member.password,
      facultyId: member.facultyId,
      department: member.department || '',
      designation: member.designation || ''
    });
    setIsEditDialogOpen(true);
  };

  const filteredFaculty = faculty.filter(f => {
    const matchesSearch = (f.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (f.facultyId || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDepartment === 'All' || f.department === filterDepartment;
    return matchesSearch && matchesDept;
  });

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds([]);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredFaculty.map(f => f.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} faculty members?`)) {
      bulkDeleteFaculty(selectedIds);
      setSelectedIds([]);
    }
  };

  const downloadTemplate = () => {
    const headers = "Name,FacultyId,Email,Department,Designation,Password\n";
    const sampleRow = "Dr. Jane Smith,FAC001,jane@example.com,CSE,Professor,password123\n";
    const noteRow = "NOTE: Allowed Departments -> CSE | AIML | AIDS | CS | IT | EEE | ECE | MECH | CIVIL,,,,,\n";
    const blob = new Blob([headers + sampleRow + noteRow], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'faculty_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const newFaculty = [];
        results.data.forEach(row => {
          if (row.FacultyId || row.facultyid || row.facultyId) {
            newFaculty.push({
              name: row.Name || row.name || 'Unknown Faculty',
              facultyId: row.FacultyId || row.facultyid || row.facultyId,
              email: row.Email || row.email || '',
              department: row.Department || row.department || '',
              designation: row.Designation || row.designation || 'Assistant Professor',
              password: row.Password || row.password || 'password123'
            });
          }
        });

        if (newFaculty.length > 0) {
          bulkAddFaculty(newFaculty);
          alert(`Successfully imported ${newFaculty.length} faculty from spreadsheet!`);
        } else {
          alert('No valid faculty found. Make sure you use the correct headers (like FacultyId).');
        }
        
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (error) => alert('Error parsing CSV file: ' + error.message)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faculty Management</h1>
          <p className="text-neutral-500 dark:text-neutral-400">View and manage all faculty members.</p>
        </div>

        <div className="flex gap-2 items-center">
          <Button variant="outline" onClick={downloadTemplate} title="Download CSV Template">
            <Download className="w-4 h-4 mr-2" /> Template
          </Button>
          
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="hidden sm:flex">
            <Upload className="w-4 h-4 mr-2" /> Import CSV
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> Add Faculty
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <DialogHeader>
              <DialogTitle>Add New Faculty</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Login Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'} 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    required 
                    placeholder="Faculty will use this to log in"
                    className="pr-10"
                  />
                  <button 
                    type="button" 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="facultyId">Faculty ID (Login ID)</Label>
                <Input id="facultyId" name="facultyId" value={formData.facultyId} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="department">Department</Label>
                  <select id="department" name="department" value={formData.department} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:focus-visible:ring-indigo-800 text-neutral-900 dark:text-white">
                    <option value="" disabled>Select Department</option>
                    <option value="All Departments">All Departments (General)</option>
                    {departments.map(dept => (
                      <option key={dept.id || dept.name} value={dept.name || dept}>{dept.name || dept}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input id="designation" name="designation" value={formData.designation} onChange={handleChange} required />
                </div>
              </div>
              <Button type="submit" className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">Save Faculty</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>

        {/* Edit Faculty Auth Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <DialogHeader>
              <DialogTitle>Update Faculty Details</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input id="edit-name" name="name" value={editFormData.name} onChange={handleEditChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-facultyId">Faculty ID (Login ID)</Label>
                <Input id="edit-facultyId" name="facultyId" value={editFormData.facultyId} onChange={handleEditChange} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <select id="edit-department" name="department" value={editFormData.department} onChange={handleEditChange} required className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:focus-visible:ring-indigo-800 text-neutral-900 dark:text-white">
                    <option value="" disabled>Select Department</option>
                    <option value="All Departments">All Departments (General)</option>
                    {departments.map(dept => (
                      <option key={dept.id || dept.name} value={dept.name || dept}>{dept.name || dept}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-designation">Designation</Label>
                  <Input id="edit-designation" name="designation" value={editFormData.designation} onChange={handleEditChange} required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-password">New Login Password</Label>
                <div className="relative">
                  <Input 
                    id="edit-password" 
                    type={showPassword ? 'text' : 'password'} 
                    name="password" 
                    value={editFormData.password} 
                    onChange={handleEditChange} 
                    required 
                    className="pr-10"
                  />
                  <button 
                    type="button" 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">Update Faculty</Button>
            </form>
          </DialogContent>
        </Dialog>

      </div>

      <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
        <CardHeader className="flex flex-col xl:flex-row items-start xl:items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800 gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <CardTitle className="text-lg font-medium">Faculty Directory</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant={isSelectionMode ? "default" : "outline"}
                className={isSelectionMode ? "bg-indigo-600 text-white hover:bg-indigo-700" : "text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-900"} 
                onClick={handleToggleSelectionMode} 
              >
                <ListChecks className="w-4 h-4 mr-2" />
                {isSelectionMode ? "Cancel Selection" : "Select"}
              </Button>
              {isSelectionMode && selectedIds.length > 0 && (
                <Button size="sm" variant="outline" className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-900" onClick={handleDeleteSelected}>
                  Delete ({selectedIds.length})
                </Button>
              )}
            </div>
          </div>
          <div className="w-full mt-4">
            <SmartFilter 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterDept={filterDepartment}
              setFilterDept={setFilterDepartment}
              availableDepartments={departments.map(d => d.name)}
              showYear={false}
              showSection={false}
              searchPlaceholder="Search faculty by name or ID..."
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-neutral-50 dark:bg-neutral-900/50">
              <TableRow className="border-neutral-100 dark:border-neutral-800 hover:bg-transparent">
                {isSelectionMode && (
                  <TableHead className="w-[50px] pl-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      onChange={handleSelectAll}
                      checked={filteredFaculty.length > 0 && selectedIds.length === filteredFaculty.length}
                    />
                  </TableHead>
                )}
                <TableHead>Faculty Member</TableHead>
                <TableHead>Faculty ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isSelectionMode ? 6 : 5} className="text-center py-8 text-neutral-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                      Loading faculty from database...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredFaculty.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSelectionMode ? 6 : 5} className="py-8 text-center text-neutral-500">No faculty found.</TableCell>
                </TableRow>
              ) : (
                filteredFaculty.map((member) => (
                  <TableRow key={member.id} className="border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                    {isSelectionMode && (
                      <TableCell className="pl-4">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          checked={selectedIds.includes(member.id)}
                          onChange={() => handleSelectOne(member.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-xs text-neutral-500">{member.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{member.facultyId}</TableCell>
                    <TableCell>{member.department}</TableCell>
                    <TableCell>{member.designation}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10" onClick={() => openEditModal(member)} title="Edit Credentials">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => deleteFaculty(member.id)} title="Delete Faculty">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacultyPage;
