import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, CheckCircle2, XCircle, Users, Search, Save, ChevronDown, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useStudents } from '@/hooks/useStudents';
import { useSmartFilters } from '@/hooks/useSmartFilters';
import SmartFilter from '@/components/SmartFilter';
import { motion, AnimatePresence } from 'framer-motion';

const TOOLTIP_CONTENT_STYLE = { borderRadius: '12px', border: '1px solid #e5e5e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' };
const TOOLTIP_ITEM_STYLE = { color: '#1f2937', fontWeight: 600 };
const LEGEND_WRAPPER_STYLE = { fontSize: '12px', fontWeight: 500 };

const AttendancePage = () => {
  const { students } = useStudents();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterYear, setFilterYear] = useState('All');

  const { availableDepartments, availableYears } = useSmartFilters(students, filterDept, filterYear);
  const selectedClass = `${filterDept}_${filterYear}`; // Used as key for local storage
  
  const displayClass = (filterDept === 'All' && filterYear === 'All')
    ? 'All Classes'
    : [
        filterDept !== 'All' ? filterDept : null,
        filterYear !== 'All' ? `Year ${filterYear}` : null
      ].filter(Boolean).join(' • ');

  // Attendance State: { [studentId]: 'present' | 'absent' }
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [isSaved, setIsSaved] = useState(false);

  // Load existing attendance for today if any (mocking with local storage)
  useEffect(() => {
    if (selectedClass) {
      const today = new Date().toISOString().split('T')[0];
      const key = `svcet_attendance_${selectedClass}_${today}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setAttendanceRecords(JSON.parse(saved));
      } else {
        // Initialize all as null or empty
        setAttendanceRecords({});
      }
      setIsSaved(false);
    }
  }, [selectedClass]);

  // Calculate Overall Attendance for selected class
  const [overallPresent, setOverallPresent] = useState(0);
  const [overallMarked, setOverallMarked] = useState(0);

  useEffect(() => {
    if (selectedClass) {
      let marked = 0;
      let present = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`svcet_attendance_${selectedClass}_`)) {
          try {
            const records = JSON.parse(localStorage.getItem(key));
            Object.values(records).forEach(status => {
              marked++;
              if (status === 'present') present++;
            });
          } catch (e) {}
        }
      }
      setOverallMarked(marked);
      setOverallPresent(present);
    }
  }, [selectedClass, isSaved]);

  const currentStudents = students.filter(s => {
    const matchDept = filterDept === 'All' || String(s.department) === filterDept;
    const matchYear = filterYear === 'All' || String(s.year) === String(filterYear);
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.registerNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchDept && matchYear && matchSearch;
  });

  const markStatus = (id, status) => {
    setAttendanceRecords(prev => ({ ...prev, [id]: status }));
    setIsSaved(false);
  };

  const markAll = (status) => {
    const newRecords = { ...attendanceRecords };
    currentStudents.forEach(s => {
      newRecords[s.id] = status;
    });
    setAttendanceRecords(newRecords);
    setIsSaved(false);
  };

  const handleSave = () => {
    const today = new Date().toISOString().split('T')[0];
    const key = `svcet_attendance_${selectedClass}_${today}`;
    localStorage.setItem(key, JSON.stringify(attendanceRecords));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const presentCount = currentStudents.filter(s => attendanceRecords[s.id] === 'present').length;
  const absentCount = currentStudents.filter(s => attendanceRecords[s.id] === 'absent').length;
  const totalCount = currentStudents.length;
  const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Attendance</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Record and track student attendance in real-time.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
          <Calendar className="w-5 h-5 text-indigo-500" />
          <span className="font-semibold text-sm text-neutral-700 dark:text-neutral-200">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {students.length === 0 ? (
        <Card className="border-neutral-200 dark:border-neutral-800 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-neutral-500">
            <Users className="w-12 h-12 mb-4 text-neutral-400" />
            <p className="text-lg font-medium">No students enrolled</p>
            <p className="text-sm">Please add students to your classes first.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <SmartFilter
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterDept={filterDept}
            setFilterDept={setFilterDept}
            filterYear={filterYear}
            setFilterYear={setFilterYear}
            availableDepartments={availableDepartments}
            availableYears={availableYears}
            showSection={false}
            searchPlaceholder="Search attendance..."
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Panel: Controls & Stats */}
            <div className="lg:col-span-1 space-y-6">
              <AnimatePresence mode="wait">
              {selectedClass && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-neutral-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Today's Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-2 mb-4">
                        <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{attendancePercentage}%</span>
                        <span className="text-sm font-medium text-neutral-500 mb-1">Present</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden flex">
                          <div className="bg-green-500 h-2.5 transition-all duration-500" style={{ width: `${totalCount ? (presentCount/totalCount)*100 : 0}%` }} />
                          <div className="bg-red-500 h-2.5 transition-all duration-500" style={{ width: `${totalCount ? (absentCount/totalCount)*100 : 0}%` }} />
                        </div>
                        
                        <div className="flex justify-between text-sm font-medium">
                          <div className="flex items-center gap-1.5 text-green-600 dark:text-green-500">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                            {presentCount} Present
                          </div>
                          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-500">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            {absentCount} Absent
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm mt-6 bg-white dark:bg-neutral-900 overflow-hidden">
                    <CardHeader className="pb-0 border-b border-neutral-100 dark:border-neutral-800/50">
                      <CardTitle className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">Overall Attendance</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col justify-center">
                      {overallMarked > 0 ? (
                        <>
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-3xl font-black text-neutral-800 dark:text-neutral-100">{Math.round((overallPresent/overallMarked)*100)}%</span>
                            <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-full">{overallMarked} Total Records</span>
                          </div>
                          <div className="h-[180px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'Present', value: overallPresent },
                                    { name: 'Absent', value: overallMarked - overallPresent }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={55}
                                  outerRadius={75}
                                  paddingAngle={4}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  <Cell fill="#10b981" />
                                  <Cell fill="#f43f5e" />
                                </Pie>
                                <Tooltip 
                                  contentStyle={TOOLTIP_CONTENT_STYLE}
                                  itemStyle={TOOLTIP_ITEM_STYLE}
                                />
                                <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={LEGEND_WRAPPER_STYLE} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[180px] text-neutral-400 dark:text-neutral-500 opacity-80 space-y-3">
                          <CheckCircle2 className="w-10 h-10 mb-1 opacity-50" />
                          <p className="text-sm font-medium">No overall data for this class</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Panel: Attendance Roster */}
          <div className="lg:col-span-3">
            <Card className="border-neutral-200 dark:border-neutral-800 shadow-md overflow-hidden">
              <CardHeader className="bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold">{displayClass}</CardTitle>
                    <CardDescription>Mark attendance for {totalCount} students</CardDescription>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                      <input 
                        type="text" 
                        placeholder="Search student..." 
                        className="w-full h-9 pl-9 pr-4 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)} 
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                      <Button variant="outline" size="sm" onClick={() => markAll('present')} className="hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 hover:border-green-200 dark:hover:border-green-800">
                        Mark All Present
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleSave} 
                        className={`transition-all ${isSaved ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white shadow-sm`}
                      >
                        {isSaved ? <><Check className="w-4 h-4 mr-1.5" /> Saved</> : <><Save className="w-4 h-4 mr-1.5" /> Save Roster</>}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-sm z-10 shadow-sm">
                      <TableRow className="border-neutral-200 dark:border-neutral-800">
                        <TableHead className="w-[120px] font-semibold">Register No.</TableHead>
                        <TableHead className="font-semibold">Student Profile</TableHead>
                        <TableHead className="text-right font-semibold">Attendance Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="h-32 text-center text-neutral-500">
                            No students found matching "{searchQuery}".
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentStudents.map((student) => {
                          const status = attendanceRecords[student.id];
                          const isPresent = status === 'present';
                          const isAbsent = status === 'absent';
                          
                          return (
                            <TableRow 
                              key={student.id} 
                              className={`border-neutral-100 dark:border-neutral-800/50 transition-colors cursor-pointer group ${
                                isPresent ? 'bg-green-50/30 dark:bg-green-900/10' : 
                                isAbsent ? 'bg-red-50/30 dark:bg-red-900/10' : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                              }`}
                              onClick={() => markStatus(student.id, isPresent ? 'absent' : 'present')}
                            >
                              <TableCell className="font-mono text-sm text-neutral-600 dark:text-neutral-400">
                                {student.registerNumber}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                    isPresent ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                    isAbsent ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                    'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                                  }`}>
                                    {isPresent ? <CheckCircle2 className="w-5 h-5" /> : 
                                     isAbsent ? <XCircle className="w-5 h-5" /> : 
                                     <Users className="w-4 h-4" />}
                                  </div>
                                  <div>
                                    <div className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                      {student.name}
                                    </div>
                                    <div className="text-xs text-neutral-500">{student.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex flex-wrap justify-end gap-2" onClick={e => e.stopPropagation()}>
                                  <button 
                                    onClick={() => markStatus(student.id, 'present')}
                                    className={`flex items-center justify-center px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                                      isPresent 
                                        ? 'bg-green-500 text-white shadow-sm scale-105' 
                                        : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-green-400 hover:text-green-600'
                                    }`}
                                  >
                                    <CheckCircle2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 ${isPresent ? 'text-white' : 'opacity-70'}`} /> Present
                                  </button>
                                  <button 
                                    onClick={() => markStatus(student.id, 'absent')}
                                    className={`flex items-center justify-center px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                                      isAbsent 
                                        ? 'bg-red-500 text-white shadow-sm scale-105' 
                                        : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-red-400 hover:text-red-600'
                                    }`}
                                  >
                                    <XCircle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 ${isAbsent ? 'text-white' : 'opacity-70'}`} /> Absent
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
          
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
