import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Users, Search, Mail, Edit, Plus, Send, ChevronDown, ChevronUp, Upload, Download, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { useStudents } from '@/hooks/useStudents';
import { useSmartFilters } from '@/hooks/useSmartFilters';
import { useDepartments } from '@/hooks/useDepartments';
import SmartFilter from '@/components/SmartFilter';

import { useMessages } from '@/hooks/useMessages';
import { motion, AnimatePresence } from 'framer-motion';

const MyStudentsPage = () => {
  const { students, updateStudent, addStudent, bulkAddStudents, deleteStudent } = useStudents();
  const { departments } = useDepartments();
  const { sendMessage } = useMessages();
  
  const fileInputRef = useRef(null);
  
  const sessionUser = JSON.parse(localStorage.getItem('svcet_session_faculty')) || {};
  const facultyName = sessionUser.name || 'Demo Faculty';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterSection, setFilterSection] = useState('All');

  const { availableDepartments, availableYears, availableSections } = useSmartFilters(students, filterDepartment, filterYear);
  
  // Modals state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  
  const [messageRecipient, setMessageRecipient] = useState(null);
  const [messageContent, setMessageContent] = useState('');

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const [editFormData, setEditFormData] = useState({
    id: null, name: '', email: '', department: '', year: '', section: '', parentPhoneNumber: ''
  });

  const [addFormData, setAddFormData] = useState({
    name: '', email: '', registerNumber: '', department: '', year: '', section: '', password: 'password123', parentPhoneNumber: ''
  });

  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const handleEditChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  const handleAddChange = (e) => setAddFormData({ ...addFormData, [e.target.name]: e.target.value });

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateStudent(editFormData.id, {
      name: editFormData.name,
      email: editFormData.email,
      department: editFormData.department,
      year: editFormData.year,
      section: editFormData.section,
      parentPhoneNumber: editFormData.parentPhoneNumber
    });
    setIsEditDialogOpen(false);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    setPendingAction({ type: 'ADD' });
    setIsPasswordModalOpen(true);
  };

  const handleDeleteRequest = (studentId) => {
    setPendingAction({ type: 'DELETE', payload: studentId });
    setIsPasswordModalOpen(true);
  };

  const handlePasswordConfirm = (e) => {
    e.preventDefault();
    
    // Retrieve actual faculty profile to verify password (sessionUser doesn't store password for security)
    const savedFaculty = JSON.parse(localStorage.getItem('svcet_faculty') || '[]');
    const currentFacultyProfile = savedFaculty.find(f => f.email === sessionUser.email || f.facultyId === sessionUser.facultyId);
    
    // Fallback if they are using a demo account not stored in local storage
    const isValid = currentFacultyProfile 
      ? passwordInput === currentFacultyProfile.password 
      : passwordInput === 'password123'; // Demo fallback

    if (!isValid) {
      setPasswordError('Incorrect password. Please try again.');
      return;
    }
    
    setPasswordError('');
    setIsPasswordModalOpen(false);
    setPasswordInput('');

    if (pendingAction.type === 'ADD') {
      addStudent({
        ...addFormData,
        role: 'Student'
      });
      setIsAddDialogOpen(false);
      setAddFormData({ name: '', email: '', registerNumber: '', department: '', year: '', section: '', password: 'password123', parentPhoneNumber: '' });
    } else if (pendingAction.type === 'DELETE') {
      deleteStudent(pendingAction.payload);
    }
    setPendingAction(null);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageContent.trim() || !messageRecipient) return;
    sendMessage({
      senderName: facultyName,
      senderRole: 'Faculty',
      receiverName: messageRecipient.name,
      receiverRole: 'Student',
      content: messageContent.trim()
    });
    setIsMessageDialogOpen(false);
  };

  const openEditModal = (student) => {
    setEditFormData({
      id: student.id,
      name: student.name,
      email: student.email,
      department: student.department || '',
      year: student.year || '',
      section: student.section || '',
      parentPhoneNumber: student.parentPhoneNumber || ''
    });
    setIsEditDialogOpen(true);
  };

  const openMessageModal = (student) => {
    setMessageRecipient(student);
    setMessageContent('');
    setIsMessageDialogOpen(true);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.registerNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = filterYear === 'All' || String(s.year) === String(filterYear);
    const matchesDept = filterDepartment === 'All' || s.department === filterDepartment;
    const matchesSection = filterSection === 'All' || s.section === filterSection;
    return matchesSearch && matchesYear && matchesDept;
  });

  // Group students by Class
  const groupedStudents = filteredStudents.reduce((acc, student) => {
    const dept = student.department || 'Unassigned';
    const yr = student.year ? `Year ${student.year}` : 'Unknown Year';
    const key = `${dept} - ${yr}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(student);
    return acc;
  }, {});

  // Initialize expanded state for first group
  React.useEffect(() => {
    const keys = Object.keys(groupedStudents);
    if (keys.length > 0 && Object.keys(expandedGroups).length === 0) {
      setExpandedGroups({ [keys[0]]: true });
    }
  }, [groupedStudents, expandedGroups]);

  const getStudentAnalytics = (studentName) => {
    const rawAssessments = localStorage.getItem('svcet_assessments');
    if (!rawAssessments) return { mcqAvg: 0, codeAvg: 0, predictedGrade: 'N/A' };
    
    try {
      const parsed = JSON.parse(rawAssessments);
      let mcqTotal = 0, mcqCount = 0;
      let codeTotal = 0, codeCount = 0;

      const processSubmissions = (arr, isCode) => {
        if (!arr) return;
        arr.forEach(a => {
          const sub = a.submissions?.find(s => s.studentName === studentName);
          if (sub) {
            if (isCode) {
              if (sub.score !== 'Pending') {
                codeTotal += sub.starsEarned || sub.stars || 0;
                codeCount++;
              }
            } else {
              mcqTotal += sub.starsEarned || sub.stars || 0;
              mcqCount++;
            }
          }
        });
      };

      processSubmissions(parsed.mcq, false);
      processSubmissions(parsed.code, true);

      const mcqAvg = mcqCount > 0 ? Math.round(mcqTotal / mcqCount) : 0;
      const codeAvg = codeCount > 0 ? Math.round(codeTotal / codeCount) : 0;
      
      let overall = 0;
      if (mcqCount > 0 && codeCount > 0) overall = (mcqAvg + codeAvg) / 2;
      else if (mcqCount > 0) overall = mcqAvg;
      else if (codeCount > 0) overall = codeAvg;
      
      let grade = 'N/A';
      if (mcqCount > 0 || codeCount > 0) {
        if (overall >= 90) grade = 'O';
        else if (overall >= 80) grade = 'A+';
        else if (overall >= 70) grade = 'A';
        else if (overall >= 60) grade = 'B+';
        else grade = 'Fail';
      }

      return { mcqAvg: mcqCount > 0 ? mcqAvg + '%' : '-', codeAvg: codeCount > 0 ? codeAvg + '%' : '-', predictedGrade: grade };
    } catch (e) {
      return { mcqAvg: '-', codeAvg: '-', predictedGrade: 'N/A' };
    }
  };

  const downloadTemplate = () => {
    const headers = "Name,RegisterNumber,Email,Department,Year,Section,Password,PendingFees,ParentPhoneNumber\n";
    const sampleRow = "Jane Doe,REG456,jane@example.com,Computer Science,2,B,password123,0,9876543210\n";
    const blob = new Blob([headers + sampleRow], { type: 'text/csv' });
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
              section: row.Section || row.section || 'A',
              password: row.Password || row.password || 'password123',
              pendingFees: Number(row.PendingFees || row.pendingfees || row.pendingFees) || 0,
              parentPhoneNumber: row.ParentPhoneNumber || row.parentphonenumber || row.parentPhoneNumber || row.ParentPhone || row.parentphone || ''
            });
          }
        });

        if (newStudents.length > 0) {
          bulkAddStudents(newStudents);
          alert(`Successfully imported ${newStudents.length} students to your classes!`);
        } else {
          alert('No valid students found. Ensure headers include RegisterNumber.');
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
          <h1 className="text-3xl font-bold tracking-tight">My Students</h1>
          <p className="text-neutral-500 dark:text-neutral-400">View and manage students enrolled in your courses.</p>
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

          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Add Student
          </Button>
        </div>
      </div>

      {/* Global Filters */}
      <SmartFilter 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterDept={filterDepartment}
        setFilterDept={setFilterDepartment}
        filterYear={filterYear}
        setFilterYear={setFilterYear}
        filterSection={filterSection}
        setFilterSection={setFilterSection}
        availableDepartments={availableDepartments}
        availableYears={availableYears}
        availableSections={availableSections}
        searchPlaceholder="Search students..."
      />

      {Object.keys(groupedStudents).length === 0 ? (
        <Card className="border-neutral-200 dark:border-neutral-800 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-neutral-500">
            <Users className="w-12 h-12 mb-4 text-neutral-400" />
            <p className="text-lg">No students found.</p>
            <p className="text-sm">Try adjusting your filters or search query.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedStudents).map(([groupName, groupStudents]) => {
          const isExpanded = expandedGroups[groupName];
          return (
          <Card key={groupName} className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md">
            <CardHeader 
              className="bg-neutral-50 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800 py-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors"
              onClick={() => toggleGroup(groupName)}
            >
              <CardTitle className="text-lg font-semibold text-indigo-700 dark:text-indigo-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
                  {groupName}
                </div>
                <Badge variant="outline" className="bg-white dark:bg-neutral-950 font-mono">
                  {groupStudents.length} {groupStudents.length === 1 ? 'Student' : 'Students'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="overflow-x-auto max-h-[500px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-neutral-100/90 dark:bg-neutral-900/90 backdrop-blur z-10 shadow-sm">
                          <TableRow className="border-neutral-200 dark:border-neutral-800">
                            <TableHead className="font-semibold">Student Name</TableHead>
                            <TableHead className="font-semibold">Register No.</TableHead>
                            <TableHead className="font-semibold">Section</TableHead>
                            <TableHead className="text-center font-semibold">MCQ Avg</TableHead>
                            <TableHead className="text-center font-semibold">Code Avg</TableHead>
                            <TableHead className="text-center font-semibold">Predicted Grade</TableHead>
                            <TableHead className="text-right font-semibold">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupStudents.map((student) => (
                            <TableRow key={student.id} className="border-neutral-100 dark:border-neutral-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group">
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                    <Users className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">{student.name}</div>
                                    <div className="text-xs text-neutral-500 font-normal">{student.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm text-neutral-600 dark:text-neutral-400">{student.registerNumber}</TableCell>
                              <TableCell>{student.section || '-'}</TableCell>
                              
                              {(() => {
                                const stats = getStudentAnalytics(student.name);
                                let badgeColor = "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700";
                                if (stats.predictedGrade === 'O') badgeColor = "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800";
                                else if (stats.predictedGrade === 'A+') badgeColor = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
                                else if (stats.predictedGrade === 'A') badgeColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
                                else if (stats.predictedGrade === 'B+') badgeColor = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
                                else if (stats.predictedGrade === 'Fail') badgeColor = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
                                
                                return (
                                  <>
                                    <TableCell className="text-center font-mono font-medium">{stats.mcqAvg}</TableCell>
                                    <TableCell className="text-center font-mono font-medium">{stats.codeAvg}</TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant="outline" className={`${badgeColor} px-3 py-1 font-bold shadow-sm`}>
                                        {stats.predictedGrade}
                                      </Badge>
                                    </TableCell>
                                  </>
                                );
                              })()}
                              
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => openEditModal(student)} title="Edit Student Profile" className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 text-neutral-500">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => openMessageModal(student)} title="Message Student" className="hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 text-neutral-500">
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteRequest(student.id)} title="Delete Student" className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 text-neutral-500">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
          );
        })
      )}

      {/* Add Student Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle>Register New Student</DialogTitle>
            <DialogDescription>Add a new student to your class roster.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 mt-2">
            <div className="grid gap-2">
              <Label htmlFor="add-name">Full Name</Label>
              <Input id="add-name" name="name" placeholder="John Doe" value={addFormData.name} onChange={handleAddChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="add-email">Email</Label>
                <Input id="add-email" type="email" name="email" placeholder="john@example.com" value={addFormData.email} onChange={handleAddChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-registerNumber">Register Number</Label>
                <Input id="add-registerNumber" name="registerNumber" placeholder="STU1001" value={addFormData.registerNumber} onChange={handleAddChange} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="add-department">Department</Label>
                <select id="add-department" name="department" value={addFormData.department} onChange={handleAddChange} required className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-950">
                  <option value="" disabled>Select Dept</option>
                  {departments.map(dept => (
                    <option key={dept.id || dept.name} value={dept.name || dept}>{dept.name || dept}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-year">Year</Label>
                <Input id="add-year" type="number" name="year" min="1" max="4" placeholder="e.g. 3" value={addFormData.year} onChange={handleAddChange} required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-section">Section</Label>
              <Input id="add-section" name="section" placeholder="e.g. A" value={addFormData.section} onChange={handleAddChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-parentPhoneNumber">Parent Phone Number</Label>
              <Input id="add-parentPhoneNumber" name="parentPhoneNumber" placeholder="e.g. 9876543210" value={addFormData.parentPhoneNumber} onChange={handleAddChange} />
            </div>
            <Button type="submit" className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">Register Student</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-department">Department</Label>
                <select id="edit-department" name="department" value={editFormData.department} onChange={handleEditChange} required className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-950">
                  <option value="" disabled>Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id || dept.name} value={dept.name || dept}>{dept.name || dept}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Register Number</Label>
                <Input value={students.find(s => s.id === editFormData.id)?.registerNumber || ''} disabled className="bg-neutral-100 dark:bg-neutral-900" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-year">Year</Label>
                <Input id="edit-year" type="number" name="year" min="1" max="4" value={editFormData.year} onChange={handleEditChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-section">Section</Label>
                <Input id="edit-section" name="section" value={editFormData.section} onChange={handleEditChange} required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-parentPhoneNumber">Parent Phone Number</Label>
              <Input id="edit-parentPhoneNumber" name="parentPhoneNumber" value={editFormData.parentPhoneNumber} onChange={handleEditChange} />
            </div>
            <Button type="submit" className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">Save Changes</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Security Verification Dialog */}
      <Dialog open={isPasswordModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsPasswordModalOpen(false);
          setPasswordInput('');
          setPasswordError('');
          setPendingAction(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              Security Verification
            </DialogTitle>
            <DialogDescription>
              Please enter your login password to confirm this action.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordConfirm} className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="verify-password">Password</Label>
              <Input 
                id="verify-password" 
                type="password" 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)} 
                required 
                className={passwordError ? "border-red-500" : ""}
                placeholder="Enter your password"
              />
              {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white">Verify & Proceed</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Compose Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle>Send Message to {messageRecipient?.name}</DialogTitle>
            <DialogDescription>
              They will receive this message in their Student Portal inbox.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendMessage} className="space-y-4 mt-2">
            <div className="grid gap-2">
              <Label htmlFor="message-content">Message</Label>
              <textarea 
                id="message-content" 
                value={messageContent} 
                onChange={(e) => setMessageContent(e.target.value)} 
                required 
                rows={4}
                className="flex w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-800 dark:bg-neutral-950 resize-none"
                placeholder="Type your message here..."
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setIsMessageDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Send className="w-4 h-4" /> Send Message
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default MyStudentsPage;
