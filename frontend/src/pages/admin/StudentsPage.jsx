import React, { useState, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import { Plus, Search, MoreVertical, GraduationCap, Trash2, Eye, EyeOff, Edit, ListChecks, Download, Upload } from 'lucide-react';
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
import { useStudents } from '@/hooks/useStudents';
import { useDepartments } from '@/hooks/useDepartments';
import { useSmartFilters } from '@/hooks/useSmartFilters';
import SmartFilter from '@/components/SmartFilter';

const StudentsPage = () => {
  const { students, addStudent, deleteStudent, updateStudent, applyBulkUpdates, bulkDeleteStudents, bulkAddStudents } = useStudents();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [filterYear, setFilterYear] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');

  const { availableDepartments, availableYears } = useSmartFilters(students, filterDepartment, filterYear);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    registerNumber: '',
    department: '',
    year: '',
    pendingFees: 0,
    parentPhoneNumber: ''
  });

  const [editFormData, setEditFormData] = useState({
    id: null,
    name: '',
    email: '',
    password: '',
    registerNumber: '',
    department: '',
    year: '',
    pendingFees: 0,
    parentPhoneNumber: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addStudent({
      ...formData,
      pendingFees: Number(formData.pendingFees) || 0
    });
    setIsDialogOpen(false);
    setFormData({ name: '', email: '', password: '', registerNumber: '', department: '', year: '', pendingFees: 0, parentPhoneNumber: '' });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateStudent(editFormData.id, {
      name: editFormData.name,
      email: editFormData.email,
      password: editFormData.password,
      registerNumber: editFormData.registerNumber,
      department: editFormData.department,
      year: editFormData.year,
      pendingFees: Number(editFormData.pendingFees) || 0,
      parentPhoneNumber: editFormData.parentPhoneNumber
    });
    setIsEditDialogOpen(false);
  };

  const openEditModal = (student) => {
    setEditFormData({
      id: student.id,
      name: student.name,
      email: student.email,
      password: student.password,
      registerNumber: student.registerNumber,
      department: student.department || '',
      year: student.year || '',
      pendingFees: student.pendingFees || 0,
      parentPhoneNumber: student.parentPhoneNumber || ''
    });
    setIsEditDialogOpen(true);
  };

  const downloadTemplate = () => {
    const headers = "Name,RegisterNumber,Email,Department,Year,PendingFees,ParentPhoneNumber,Password\n";
    const sampleRow = "John Doe,STU001,john@example.com,CSE,3,5000,9876543210,password123\n";
    const noteRow = "NOTE: Allowed Departments -> CSE | AIML | AIDS | CS | IT | EEE | ECE | MECH | CIVIL,,,,,,,\n";
    const blob = new Blob([headers + sampleRow + noteRow], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_import_template.csv';
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
        const newStudents = [];
        results.data.forEach(row => {
          if (row.RegisterNumber || row.registernumber || row.registerNumber) {
            newStudents.push({
              name: row.Name || row.name || 'Unknown Student',
              registerNumber: row.RegisterNumber || row.registernumber || row.registerNumber,
              email: row.Email || row.email || '',
              department: row.Department || row.department || '',
              year: row.Year || row.year || '1',
              pendingFees: Number(row.PendingFees || row.pendingFees || row.pendingfees) || 0,
              parentPhoneNumber: row.ParentPhoneNumber || row.parentphonenumber || row.parentPhoneNumber || '',
              password: row.Password || row.password || 'password123'
            });
          }
        });

        if (newStudents.length > 0) {
          bulkAddStudents(newStudents);
          alert(`Successfully imported ${newStudents.length} students!`);
        } else {
          alert('No valid student data found in the CSV. Make sure RegisterNumber is provided.');
        }
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      error: (error) => alert('Error parsing CSV file: ' + error.message)
    });
  };

  const filteredStudents = useMemo(() => students.filter(s => {
    const matchesSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.registerNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = filterYear === 'All' || s.year?.toString() === filterYear;
    const matchesDept = filterDepartment === 'All' || s.department === filterDepartment;
    return matchesSearch && matchesYear && matchesDept;
  }), [students, searchQuery, filterYear, filterDepartment]);

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds([]);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredStudents.map(s => s.id));
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

  const handlePromoteSelected = () => {
    if (selectedIds.length === 0) return;
    const updates = students
      .filter(s => selectedIds.includes(s.id))
      .map(s => {
        const currentYear = parseInt(s.year || '1');
        const nextYear = currentYear < 4 ? (currentYear + 1).toString() : '4';
        return { id: s.id, data: { year: nextYear, justPromoted: true } };
      });
    applyBulkUpdates(updates);
    setSelectedIds([]);
  };

  const handleDemoteSelected = () => {
    if (selectedIds.length === 0) return;
    const updates = students
      .filter(s => selectedIds.includes(s.id))
      .map(s => {
        const currentYear = parseInt(s.year || '1');
        const prevYear = currentYear > 1 ? (currentYear - 1).toString() : '1';
        return { id: s.id, data: { year: prevYear, justPromoted: false } };
      });
    applyBulkUpdates(updates);
    setSelectedIds([]);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} students?`)) {
      bulkDeleteStudents(selectedIds);
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
          <p className="text-neutral-500 dark:text-neutral-400">View and manage all registered students.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate} title="Download CSV Template">
            <Download className="w-4 h-4 mr-2" /> Template
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> Import CSV
          </Button>
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
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
                      className="pr-10"
                    />
                    <button 
                      type="button" 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="registerNumber">Register No.</Label>
                    <Input id="registerNumber" name="registerNumber" value={formData.registerNumber} onChange={handleChange} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <select id="department" name="department" value={formData.department} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                      <option value="" disabled>Select Department</option>
                      {['CSE', 'AIML', 'AIDS', 'CS', 'IT', 'EEE', 'ECE', 'MECH', 'CIVIL'].map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" type="number" name="year" min="1" max="4" value={formData.year} onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pendingFees">Pending Fees (₹)</Label>
                  <Input id="pendingFees" type="number" name="pendingFees" min="0" value={formData.pendingFees} onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="parentPhoneNumber">Parent Phone Number</Label>
                  <Input id="parentPhoneNumber" name="parentPhoneNumber" value={formData.parentPhoneNumber} onChange={handleChange} />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">Save Student</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <DialogHeader>
              <DialogTitle>Update Student Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input id="edit-name" name="name" value={editFormData.name} onChange={handleEditChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" name="email" value={editFormData.email} onChange={handleEditChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-password">Login Password</Label>
                <Input id="edit-password" type="text" name="password" value={editFormData.password} onChange={handleEditChange} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-registerNumber">Register No.</Label>
                  <Input id="edit-registerNumber" name="registerNumber" value={editFormData.registerNumber} onChange={handleEditChange} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <select id="edit-department" name="department" value={editFormData.department} onChange={handleEditChange} required className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="" disabled>Select Department</option>
                    {['CSE', 'AIML', 'AIDS', 'CS', 'IT', 'EEE', 'ECE', 'MECH', 'CIVIL'].map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-year">Year</Label>
                <Input id="edit-year" type="number" name="year" min="1" max="4" value={editFormData.year} onChange={handleEditChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-pendingFees">Pending Fees (₹)</Label>
                <Input id="edit-pendingFees" type="number" name="pendingFees" min="0" value={editFormData.pendingFees} onChange={handleEditChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-parentPhoneNumber">Parent Phone Number</Label>
                <Input id="edit-parentPhoneNumber" name="parentPhoneNumber" value={editFormData.parentPhoneNumber} onChange={handleEditChange} />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">Update Student</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
        <CardHeader className="flex flex-col xl:flex-row items-start xl:items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800 gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <CardTitle className="text-lg font-medium">Students Directory</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant={isSelectionMode ? "default" : "outline"}
                className={isSelectionMode ? "bg-blue-600 text-white" : ""} 
                onClick={handleToggleSelectionMode} 
              >
                <ListChecks className="w-4 h-4 mr-2" />
                {isSelectionMode ? "Cancel Selection" : "Select"}
              </Button>
              {isSelectionMode && selectedIds.length > 0 && (
                <>
                  <Button size="sm" variant="outline" className="text-green-600" onClick={handlePromoteSelected}>Promote</Button>
                  <Button size="sm" variant="outline" className="text-orange-600" onClick={handleDemoteSelected}>Demote</Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={handleDeleteSelected}>Delete</Button>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select className="border border-neutral-200 dark:border-neutral-800 rounded-md px-3 py-2 text-sm" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
              <option value="All">All Years</option>
              {['1', '2', '3', '4'].map(year => <option key={year} value={year}>{year} Year</option>)}
            </select>
            <select className="border border-neutral-200 dark:border-neutral-800 rounded-md px-3 py-2 text-sm" value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
              <option value="All">All Departments</option>
              {['CSE', 'AIML', 'AIDS', 'CS', 'IT', 'EEE', 'ECE', 'MECH', 'CIVIL'].map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
              <Input type="search" placeholder="Search students..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {isSelectionMode && (
                  <TableHead className="w-[50px] pl-4">
                    <input type="checkbox" onChange={handleSelectAll} checked={filteredStudents.length > 0 && selectedIds.length === filteredStudents.length} />
                  </TableHead>
                )}
                <TableHead className="w-[250px]">Student Details</TableHead>
                <TableHead>Register No.</TableHead>
                <TableHead>Department & Year</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSelectionMode ? 6 : 5} className="text-center py-8 text-neutral-500">
                    No students found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id} className="border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                    {isSelectionMode && (
                      <TableCell className="pl-4">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={selectedIds.includes(student.id)}
                          onChange={() => handleSelectOne(student.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-xs text-neutral-500">{student.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{student.registerNumber}</TableCell>
                    <TableCell>
                      <div className="font-medium">{student.department}</div>
                      <div className="text-sm text-neutral-500">Yr {student.year}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{student.parentPhoneNumber || 'No Contact'}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10" onClick={() => openEditModal(student)} title="Edit Credentials">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => deleteStudent(student.id)} title="Delete Student">
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

export default StudentsPage;
