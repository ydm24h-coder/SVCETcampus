import React, { useState, useEffect, useMemo } from 'react';
import { GraduationCap, Trophy, Search, Download, BarChart3, Users, LayoutList, ChevronRight, FileText, X, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useStudents } from '@/hooks/useStudents';
import { useAssessments } from '@/hooks/useAssessments';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSmartFilters } from '@/hooks/useSmartFilters';
import SmartFilter from '@/components/SmartFilter';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


const CHART_MARGIN = { top: 10, right: 10, left: -20, bottom: 0 };
const TICK_STYLE_SM = { fontSize: 12, fill: '#888' };
const TICK_STYLE_MD = { fill: '#6b7280', fontSize: 13, fontWeight: 500 };
const TOOLTIP_CURSOR_INDIGO = { fill: 'rgba(99, 102, 241, 0.05)' };
const TOOLTIP_CURSOR_GRAY = { fill: 'rgba(0,0,0,0.05)' };
const TOOLTIP_CONTENT_STYLE = { borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' };

const AdminReportsPage = () => {
  const { students } = useStudents();
  const { assessments: hookAssessments } = useAssessments();
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, students, assessments
  
  const [studentAnalytics, setStudentAnalytics] = useState([]);
  const [assessments, setAssessments] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [assessmentTypeFilter, setAssessmentTypeFilter] = useState('All'); // For assessments tab
  
  const { availableDepartments, availableYears } = useSmartFilters(students, deptFilter, yearFilter);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState(null);
  const [selectedAssessmentForReport, setSelectedAssessmentForReport] = useState(null);


  useEffect(() => {
    const parsed = hookAssessments || { mcq: [], code: [] };
    
    const analytics = students.map(student => {
      let mcqTotal = 0, mcqCount = 0;
      let codeTotal = 0, codeCount = 0;

      const parseScore = (score) => {
        if (typeof score === 'string' && score.includes('/')) {
          return parseInt(score.split('/')[0], 10);
        }
        return parseInt(score, 10) || 0;
      };

      const processSubmissions = (arr, isCode) => {
        if (!arr) return;
        arr.forEach(a => {
          const sub = a.submissions?.find(s => s.studentName === student.name);
          if (sub && sub.score !== 'Pending') {
            const numScore = parseScore(sub.score);
            if (isCode) {
              codeTotal += numScore;
              codeCount++;
            } else {
              mcqTotal += numScore;
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
      if (mcqCount > 0 && codeCount > 0) overall = Math.round((mcqAvg + codeAvg) / 2);
      else if (mcqCount > 0) overall = mcqAvg;
      else if (codeCount > 0) overall = codeAvg;

      let predictedGrade = 'N/A';
      if (mcqCount > 0 || codeCount > 0) {
        if (overall >= 90) predictedGrade = 'O';
        else if (overall >= 80) predictedGrade = 'A+';
        else if (overall >= 70) predictedGrade = 'A';
        else if (overall >= 60) predictedGrade = 'B+';
        else if (overall >= 50) predictedGrade = 'B';
        else predictedGrade = 'U';
      }

      return {
        ...student,
        mcqAvg,
        codeAvg,
        overall,
        predictedGrade,
        assessmentsTaken: mcqCount + codeCount
      };
    });

    setStudentAnalytics(analytics);
    
    // Also prepare assessment-wise data
    const allAssessments = [...(parsed.mcq || []), ...(parsed.code || [])];
    
    // Calculate assessment stats
    const enrichedAssessments = allAssessments.map(a => {
      let totalScore = 0;
      let highestScore = 0;
      let gradedCount = 0;
      const parseScore = (score) => {
        if (typeof score === 'string' && score.includes('/')) {
          return parseInt(score.split('/')[0], 10);
        }
        return parseInt(score, 10) || 0;
      };

      if (a.submissions) {
        a.submissions.forEach(sub => {
          if (sub.score !== 'Pending') {
            const numScore = parseScore(sub.score);
            totalScore += numScore;
            if (numScore > highestScore) highestScore = numScore;
            gradedCount++;
          }
        });
      }
      return {
        ...a,
        classAverage: gradedCount > 0 ? Math.round(totalScore / gradedCount) : 0,
        highestScore,
        gradedCount
      };
    });
    
    setAssessments(enrichedAssessments);
  }, [students, hookAssessments]);

  // availableDepartments, availableYears are now provided by useSmartFilters

  const formatYear = (y) => {
    if (y === '1') return '1st Year';
    if (y === '2') return '2nd Year';
    if (y === '3') return '3rd Year';
    if (y === '4') return '4th Year';
    return y;
  };

  const filteredStudents = useMemo(() => {
    return studentAnalytics.filter(s => {
      if (yearFilter !== 'All' && String(s.year) !== String(yearFilter)) return false;
      if (deptFilter !== 'All' && s.department !== deptFilter) return false;
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !(s.registerNumber || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [studentAnalytics, yearFilter, deptFilter, searchQuery]);

  // Derived Analytics Data
  const analyticsSummary = useMemo(() => {
    const totalStudents = filteredStudents.length;
    let sumOverall = 0;
    let studentsWithGrades = 0;
    const gradeDistribution = { 'O': 0, 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'U': 0 };
    
    let sumMcq = 0, countMcq = 0;
    let sumCode = 0, countCode = 0;

    filteredStudents.forEach(s => {
      if (s.assessmentsTaken > 0) {
        sumOverall += s.overall;
        studentsWithGrades++;
        if (gradeDistribution[s.predictedGrade] !== undefined) {
          gradeDistribution[s.predictedGrade]++;
        }
      }
      if (s.mcqAvg > 0) { sumMcq += s.mcqAvg; countMcq++; }
      if (s.codeAvg > 0) { sumCode += s.codeAvg; countCode++; }
    });

    const overallAverage = studentsWithGrades > 0 ? Math.round(sumOverall / studentsWithGrades) : 0;
    const mcqClassAvg = countMcq > 0 ? Math.round(sumMcq / countMcq) : 0;
    const codeClassAvg = countCode > 0 ? Math.round(sumCode / countCode) : 0;

    const pieData = Object.keys(gradeDistribution).map(key => ({
      name: key,
      value: gradeDistribution[key]
    })).filter(d => d.value > 0);

    const barData = [
      { name: 'MCQ', average: mcqClassAvg },
      { name: 'Code', average: codeClassAvg }
    ];

    return { totalStudents, studentsWithGrades, overallAverage, pieData, barData };
  }, [filteredStudents]);

  const COLORS = {
    'O': '#10b981', // emerald
    'A+': '#3b82f6', // blue
    'A': '#8b5cf6', // violet
    'B+': '#f59e0b', // amber
    'B': '#f97316', // orange
    'U': '#ef4444'  // red
  };

  const getGradeBadgeClass = (grade) => {
    switch(grade) {
      case 'O': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'A+': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'A': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
      case 'B+': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'B': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'U': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
    }
  };

  const handleExportCSV = () => {
    const headers = ['Register Number', 'Name', 'Department', 'Year', 'Assessments Taken', 'MCQ Avg', 'Code Avg', 'Overall Score', 'Grade'];
    const rows = filteredStudents.map(s => [
      s.registerNumber || '-',
      s.name,
      s.department || '-',
      s.year || '-',
      s.assessmentsTaken,
      s.mcqAvg || 0,
      s.codeAvg || 0,
      s.overall || 0,
      s.predictedGrade || 'N/A'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Student_Roster_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAssessmentCSV = () => {
    if (!selectedAssessmentForReport) return;
    
    const headers = ['Student Name', 'Score', 'Status'];
    const rows = (selectedAssessmentForReport.submissions || []).map(sub => {
      let scoreStr = sub.score;
      if (typeof scoreStr === 'string' && scoreStr.includes('/')) scoreStr = scoreStr.split('/')[0];
      return [
        sub.studentName,
        scoreStr === 'Pending' ? '0' : scoreStr,
        sub.score === 'Pending' ? 'Pending' : 'Graded'
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedAssessmentForReport.title.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadStudentReport = () => {
    if (!selectedStudentForReport) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Official Student Grade Report", 105, 20, { align: "center" });
    
    // Student Info
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${selectedStudentForReport.name}`, 14, 40);
    doc.text(`Register Number: ${selectedStudentForReport.registerNumber || selectedStudentForReport.regNo || 'N/A'}`, 14, 48);
    doc.text(`Department: ${selectedStudentForReport.department}`, 120, 40);
    doc.text(`Year: ${selectedStudentForReport.year}`, 120, 48);
    
    // Performance Summary
    doc.setFont("helvetica", "bold");
    doc.text("Overall Performance", 14, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`Overall Score: ${selectedStudentForReport.overall > 0 ? selectedStudentForReport.overall + '%' : 'N/A'}`, 14, 68);
    doc.text(`Predicted Grade: ${selectedStudentForReport.predictedGrade || 'N/A'}`, 120, 68);
    doc.text(`MCQ Average: ${selectedStudentForReport.mcqAvg > 0 ? selectedStudentForReport.mcqAvg + '%' : 'N/A'}`, 14, 76);
    doc.text(`Coding Average: ${selectedStudentForReport.codeAvg > 0 ? selectedStudentForReport.codeAvg + '%' : 'N/A'}`, 120, 76);

    // Assessments Table
    const tableColumn = ["Assessment Title", "Type", "Score", "Status"];
    const tableRows = [];

    const studentAssessments = assessments.filter(a => 
      (a.status === 'Published' || a.published) && 
      a.submissions?.some(s => s.studentName === selectedStudentForReport.name)
    );

    studentAssessments.forEach(a => {
      const sub = a.submissions.find(s => s.studentName === selectedStudentForReport.name);
      if(sub) {
        const row = [
          a.title,
          a.questionsData ? 'MCQ' : 'Code',
          sub.score,
          sub.score === 'Pending' ? 'Pending' : 'Graded'
        ];
        tableRows.push(row);
      }
    });

    doc.autoTable({
      startY: 90,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229] } // Indigo 600
    });

    doc.save(`${selectedStudentForReport.name.replace(/\s+/g, '_')}_Grade_Report.pdf`);
  };

  const filteredAssessments = assessments.filter(a => a.status === 'Published' || a.published).filter(a => {
    if (yearFilter !== 'All' && a.targetYear !== 'All' && a.targetYear !== yearFilter) return false;
    if (deptFilter !== 'All' && a.targetDepartment && a.targetDepartment !== 'All' && a.targetDepartment !== deptFilter) return false;

    if (assessmentTypeFilter === 'All') return true;
    if (assessmentTypeFilter === 'MCQ') return !!a.questionsData;
    if (assessmentTypeFilter === 'Code') return !a.questionsData;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Institution Grade Reports</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Comprehensive overview of student grades, analytics, and assessment progress.</p>
          <AnimatePresence>
        {selectedAssessmentForReport && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setSelectedAssessmentForReport(null)}
            />
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[600px] bg-white dark:bg-neutral-900 shadow-2xl z-50 flex flex-col border-l border-neutral-200 dark:border-neutral-800 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                    <LayoutList className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white line-clamp-1">{selectedAssessmentForReport.title}</h2>
                    <p className="text-sm font-semibold text-neutral-500 tracking-wide uppercase mt-0.5">
                      {selectedAssessmentForReport.questionsData ? 'MCQ' : 'Code'} • {selectedAssessmentForReport.targetDepartment === 'All' ? 'All Depts' : selectedAssessmentForReport.targetDepartment} • {selectedAssessmentForReport.targetYear === 'All' ? 'All Years' : `Year ${selectedAssessmentForReport.targetYear}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleExportAssessmentCSV}
                    className="h-9 px-3 flex items-center justify-center gap-2 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shrink-0"
                    title="Export Assessment Report"
                  >
                    <Download className="w-4 h-4 text-neutral-500" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                  <button 
                    onClick={() => setSelectedAssessmentForReport(null)}
                    className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex flex-col items-center justify-center text-center">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-1">Class Average</p>
                    <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{selectedAssessmentForReport.classAverage}%</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 flex flex-col items-center justify-center text-center">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider mb-1">Highest Score</p>
                    <p className="text-3xl font-black text-blue-700 dark:text-blue-400">{selectedAssessmentForReport.highestScore}%</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-4 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2 text-indigo-500" />
                    Score Distribution
                  </h3>
                  <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
                    {(() => {
                      const distribution = { '90-100': 0, '80-89': 0, '70-79': 0, '60-69': 0, '< 60': 0 };
                      if (selectedAssessmentForReport.submissions) {
                        selectedAssessmentForReport.submissions.forEach(sub => {
                          if (sub.score !== 'Pending') {
                            let s = sub.score;
                            if (typeof s === 'string' && s.includes('/')) s = parseInt(s.split('/')[0], 10);
                            else s = parseInt(s, 10);
                            if (s >= 90) distribution['90-100']++;
                            else if (s >= 80) distribution['80-89']++;
                            else if (s >= 70) distribution['70-79']++;
                            else if (s >= 60) distribution['60-69']++;
                            else distribution['< 60']++;
                          }
                        });
                      }
                      const distData = Object.keys(distribution).map(k => ({ name: k, count: distribution[k] }));
                      
                      return (
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distData} margin={CHART_MARGIN}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" className="dark:stroke-neutral-800" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={TICK_STYLE_SM} />
                              <YAxis axisLine={false} tickLine={false} tick={TICK_STYLE_SM} allowDecimals={false} />
                              <RechartsTooltip 
                                cursor={TOOLTIP_CURSOR_INDIGO}
                                contentStyle={TOOLTIP_CONTENT_STYLE}
                              />
                              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-[600px]">
            <SmartFilter 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterDept={deptFilter}
              setFilterDept={setDeptFilter}
              filterYear={yearFilter}
              setFilterYear={setYearFilter}
              availableDepartments={availableDepartments}
              availableYears={availableYears}
              showSection={false}
              searchPlaceholder="Search students..."
            />
          </div>
          <AnimatePresence>
            {activeTab === 'assessments' && (
              <motion.select 
                key="assessment-filters"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, display: 'none' }}
                className="h-9 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-lg px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm w-full sm:w-auto"
                value={assessmentTypeFilter}
                onChange={(e) => setAssessmentTypeFilter(e.target.value)}
              >
                <option value="All">All Assessment Types</option>
                <option value="MCQ">MCQ Assessments Only</option>
                <option value="Code">Code Tests Only</option>
              </motion.select>
            )}
          </AnimatePresence>
          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'analytics' ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            >
              <BarChart3 className="w-4 h-4" /> Analytics
            </button>
            <button 
              onClick={() => setActiveTab('students')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'students' ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            >
              <Users className="w-4 h-4" /> Roster
            </button>
            <button 
              onClick={() => setActiveTab('assessments')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'assessments' ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            >
              <LayoutList className="w-4 h-4" /> Assessments
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'analytics' && (
          <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-900/10 shadow-sm transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Class Average</p>
                      <h3 className="text-4xl font-black text-indigo-950 dark:text-indigo-50">{analyticsSummary.overallAverage}%</h3>
                    </div>
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                      <Trophy className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-indigo-600/70 dark:text-indigo-400/70 mt-4">Across {analyticsSummary.studentsWithGrades} graded students</p>
                </CardContent>
              </Card>

              <Card className="border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-900/10 shadow-sm transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Total Assessments</p>
                      <h3 className="text-4xl font-black text-emerald-950 dark:text-emerald-50">{assessments.filter(a => a.published).length}</h3>
                    </div>
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                      <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-emerald-600/70 dark:text-emerald-400/70 mt-4">Published to students</p>
                </CardContent>
              </Card>

              <Card className="border-amber-100 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/10 shadow-sm transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Submissions</p>
                      <h3 className="text-4xl font-black text-amber-950 dark:text-amber-50">
                        {assessments.reduce((acc, curr) => acc + curr.gradedCount, 0)}
                      </h3>
                    </div>
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                      <GraduationCap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-amber-600/70 dark:text-amber-400/70 mt-4">Total graded assignments</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
                <CardHeader className="border-b border-neutral-100 dark:border-neutral-800/50 pb-4">
                  <CardTitle className="text-lg">Grade Distribution</CardTitle>
                  <CardDescription>Predicted grades based on current performance</CardDescription>
                </CardHeader>
                <CardContent className="p-6 flex justify-center items-center h-[300px]">
                  {analyticsSummary.pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsSummary.pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {analyticsSummary.pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={TOOLTIP_CONTENT_STYLE}
                          itemStyle={{ color: '#1f2937', fontWeight: 600 }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-neutral-500 font-medium">No grade data available</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
                <CardHeader className="border-b border-neutral-100 dark:border-neutral-800/50 pb-4">
                  <CardTitle className="text-lg">Assessment Type Averages</CardTitle>
                  <CardDescription>MCQ vs Code Test performance</CardDescription>
                </CardHeader>
                <CardContent className="p-6 flex justify-center items-center h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsSummary.barData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-neutral-800" />
                      <XAxis dataKey="name" tick={TICK_STYLE_MD} tickLine={false} axisLine={false} />
                      <YAxis tick={TICK_STYLE_MD} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <RechartsTooltip 
                        cursor={TOOLTIP_CURSOR_GRAY}
                        contentStyle={TOOLTIP_CONTENT_STYLE}
                        itemStyle={{ color: '#1f2937', fontWeight: 600 }}
                      />
                      <Bar dataKey="average" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={60}>
                        {analyticsSummary.barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#ec4899'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'students' && (
          <motion.div key="students" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden bg-white dark:bg-neutral-900">
              <CardHeader className="bg-neutral-50/50 dark:bg-neutral-950/50 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center">
                      <Users className="w-5 h-5 mr-2 text-indigo-500" />
                      Student Roster
                    </CardTitle>
                    <CardDescription>Detailed grade breakdown for {filteredStudents.length} students</CardDescription>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-auto">
                      {/* Search is now handled by the SmartFilter at the top */}
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button 
                        onClick={handleExportCSV}
                        className="h-9 px-3 flex items-center justify-center gap-2 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shrink-0"
                      >
                        <Download className="w-4 h-4 text-neutral-500" />
                        <span className="hidden sm:inline">Export CSV</span>
                      </button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-neutral-200 dark:border-neutral-800 hover:bg-transparent">
                        <TableHead className="w-[120px] font-semibold text-neutral-500 uppercase tracking-wider text-xs">Register No.</TableHead>
                        <TableHead className="font-semibold text-neutral-500 uppercase tracking-wider text-xs">Student Profile</TableHead>
                        <TableHead className="text-center font-semibold text-neutral-500 uppercase tracking-wider text-xs">Assessments</TableHead>
                        <TableHead className="text-center font-semibold text-neutral-500 uppercase tracking-wider text-xs">MCQ Avg</TableHead>
                        <TableHead className="text-center font-semibold text-neutral-500 uppercase tracking-wider text-xs">Code Avg</TableHead>
                        <TableHead className="text-center font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-xs">Overall Score</TableHead>
                        <TableHead className="text-center font-semibold text-neutral-500 uppercase tracking-wider text-xs">Grade</TableHead>
                        <TableHead className="text-right font-semibold text-neutral-500 uppercase tracking-wider text-xs">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <TableRow 
                            key={student.id} 
                            onClick={() => setSelectedStudentForReport(student)}
                            className="border-neutral-100 dark:border-neutral-800/50 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 group cursor-pointer"
                          >
                            <TableCell className="font-mono text-sm text-neutral-600 dark:text-neutral-400">{student.registerNumber || student.regNo}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
                                  {student.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-semibold text-neutral-800 dark:text-neutral-200">{student.name}</p>
                                  <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">{student.department} • {student.year}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-md text-xs font-bold border border-neutral-200 dark:border-neutral-700">
                                {student.assessmentsTaken}
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-medium text-neutral-600 dark:text-neutral-400">{student.mcqAvg > 0 ? `${student.mcqAvg}%` : '-'}</TableCell>
                            <TableCell className="text-center font-medium text-neutral-600 dark:text-neutral-400">{student.codeAvg > 0 ? `${student.codeAvg}%` : '-'}</TableCell>
                            <TableCell className="text-center font-black text-indigo-600 dark:text-indigo-400 text-base">{student.overall > 0 ? `${student.overall}%` : '-'}</TableCell>
                            <TableCell className="text-center">
                              {student.predictedGrade !== 'N/A' ? (
                                <Badge variant="outline" className={`font-bold border shadow-sm ${getGradeBadgeClass(student.predictedGrade)}`}>
                                  {student.predictedGrade}
                                </Badge>
                              ) : (
                                <span className="text-neutral-400 font-medium">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <button className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors opacity-0 group-hover:opacity-100 text-neutral-500">
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-16 text-neutral-500">
                            <Users className="w-10 h-10 mx-auto mb-4 opacity-20" />
                            <p className="font-medium text-lg">No students found matching your criteria.</p>
                            <p className="text-sm opacity-70 mt-1">Try adjusting your search or filters.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'assessments' && (
          <motion.div key="assessments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredAssessments.length > 0 ? (
                filteredAssessments.map(assessment => (
                  <Card key={assessment.id} className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden flex flex-col hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                    <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/30 dark:bg-neutral-950/30">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg font-bold flex items-center text-neutral-800 dark:text-neutral-100">
                            {assessment.title}
                          </CardTitle>
                          <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">
                            {assessment.questionsData ? 'MCQ Assessment' : 'Code Test'} • {assessment.targetYear === 'All' ? 'All Years' : `Year ${assessment.targetYear}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-sm">
                            {assessment.gradedCount} Graded
                          </Badge>
                          <button 
                            onClick={() => setSelectedAssessmentForReport(assessment)}
                            className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors shadow-sm"
                            title="View Detailed Report"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-xl flex items-center justify-between shadow-sm">
                          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Class Avg</span>
                          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{assessment.classAverage}%</span>
                        </div>
                        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-xl flex items-center justify-between shadow-sm">
                          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">High Score</span>
                          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{assessment.highestScore}%</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                      <div className="max-h-[300px] overflow-y-auto">
                        <Table>
                          <TableHeader className="bg-white/95 dark:bg-neutral-900/95 sticky top-0 z-10 backdrop-blur-sm">
                            <TableRow className="border-neutral-100 dark:border-neutral-800/50">
                              <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-neutral-500">Student Name</TableHead>
                              <TableHead className="text-center font-semibold text-[11px] uppercase tracking-wider text-neutral-500">Status</TableHead>
                              <TableHead className="text-right font-semibold text-[11px] uppercase tracking-wider text-neutral-500">Score</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {assessment.submissions && assessment.submissions.length > 0 ? (
                              assessment.submissions.map((sub, idx) => (
                                <TableRow key={idx} className="border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                  <TableCell className="font-semibold text-sm text-neutral-700 dark:text-neutral-300">{sub.studentName}</TableCell>
                                  <TableCell className="text-center">
                                    {sub.score === 'Pending' ? (
                                      <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-900 text-[10px] font-bold uppercase tracking-wider">Review</Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-900 text-[10px] font-bold uppercase tracking-wider">Graded</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right font-bold text-neutral-800 dark:text-neutral-200 text-sm">
                                    {sub.score === 'Pending' ? '-' : `${sub.score}%`}
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center py-10 text-neutral-500 text-sm font-medium">
                                  No submissions yet.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white dark:bg-neutral-900 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                  <LayoutList className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">No Assessments Found</h3>
                  <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mt-1">
                    There are currently no published assessments matching your selected filter criteria.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedStudentForReport && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setSelectedStudentForReport(null)}
            />
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white dark:bg-neutral-900 shadow-2xl z-50 flex flex-col border-l border-neutral-200 dark:border-neutral-800 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg uppercase shadow-inner">
                    {selectedStudentForReport.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{selectedStudentForReport.name}</h2>
                    <p className="text-sm font-semibold text-neutral-500 tracking-wide uppercase">{selectedStudentForReport.registerNumber || selectedStudentForReport.regNo} • {selectedStudentForReport.department} • {selectedStudentForReport.year}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleDownloadStudentReport}
                    className="p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 transition-colors"
                    title="Download Report"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setSelectedStudentForReport(null)}
                    className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex flex-col items-center justify-center text-center">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-1">Overall</p>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{selectedStudentForReport.overall > 0 ? `${selectedStudentForReport.overall}%` : '-'}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 flex flex-col items-center justify-center text-center">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider mb-1">MCQ Avg</p>
                    <p className="text-2xl font-black text-blue-700 dark:text-blue-400">{selectedStudentForReport.mcqAvg > 0 ? `${selectedStudentForReport.mcqAvg}%` : '-'}</p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col items-center justify-center text-center">
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-500 uppercase tracking-wider mb-1">Code Avg</p>
                    <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{selectedStudentForReport.codeAvg > 0 ? `${selectedStudentForReport.codeAvg}%` : '-'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-4 flex items-center">
                    <Target className="w-4 h-4 mr-2 text-indigo-500" />
                    Assessment History
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      const history = [];
                      assessments.forEach(a => {
                        if (a.submissions) {
                          const sub = a.submissions.find(s => s.studentName === selectedStudentForReport.name);
                          if (sub && sub.score !== 'Pending') {
                            const parseScore = (score) => {
                              if (typeof score === 'string' && score.includes('/')) {
                                return parseInt(score.split('/')[0], 10);
                              }
                              return parseInt(score, 10) || 0;
                            };
                            const parsedScore = parseScore(sub.score);
                            history.push({
                              id: a.id,
                              title: a.title,
                              score: parsedScore,
                              type: a.questionsData ? 'MCQ' : 'Code',
                              targetScore: 100
                            });
                          }
                        }
                      });
                      
                      if (history.length === 0) {
                        return (
                          <div className="text-center py-8 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800 border-dashed">
                            <p className="text-neutral-500 text-sm font-medium">No assessments completed yet.</p>
                          </div>
                        );
                      }

                      return history.map(item => {
                        const percentage = item.score;
                        return (
                          <div key={item.id} className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl flex items-center justify-between hover:shadow-md transition-shadow">
                            <div>
                              <p className="font-semibold text-neutral-900 dark:text-white line-clamp-1">{item.title}</p>
                              <Badge variant="outline" className={`mt-1.5 text-[10px] uppercase font-bold tracking-wider ${item.type === 'MCQ' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' : 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800'}`}>
                                {item.type}
                              </Badge>
                            </div>
                            <div className="text-right pl-4">
                              <p className="text-lg font-black text-neutral-900 dark:text-white">{percentage}%</p>
                              <p className="text-xs font-semibold text-neutral-500">Score</p>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedAssessmentForReport && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setSelectedAssessmentForReport(null)}
            />
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[600px] bg-white dark:bg-neutral-900 shadow-2xl z-50 flex flex-col border-l border-neutral-200 dark:border-neutral-800 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                    <LayoutList className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white line-clamp-1">{selectedAssessmentForReport.title}</h2>
                    <p className="text-sm font-semibold text-neutral-500 tracking-wide uppercase mt-0.5">
                      {selectedAssessmentForReport.questionsData ? 'MCQ' : 'Code'} • {selectedAssessmentForReport.targetDepartment === 'All' ? 'All Depts' : selectedAssessmentForReport.targetDepartment} • {selectedAssessmentForReport.targetYear === 'All' ? 'All Years' : `Year ${selectedAssessmentForReport.targetYear}`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAssessmentForReport(null)}
                  className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex flex-col items-center justify-center text-center">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-1">Class Average</p>
                    <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{selectedAssessmentForReport.classAverage}%</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 flex flex-col items-center justify-center text-center">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider mb-1">Highest Score</p>
                    <p className="text-3xl font-black text-blue-700 dark:text-blue-400">{selectedAssessmentForReport.highestScore}%</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-4 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2 text-indigo-500" />
                    Score Distribution
                  </h3>
                  <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
                    {(() => {
                      const distribution = { '90-100': 0, '80-89': 0, '70-79': 0, '60-69': 0, '< 60': 0 };
                      if (selectedAssessmentForReport.submissions) {
                        selectedAssessmentForReport.submissions.forEach(sub => {
                          if (sub.score !== 'Pending') {
                            let s = sub.score;
                            if (typeof s === 'string' && s.includes('/')) s = parseInt(s.split('/')[0], 10);
                            else s = parseInt(s, 10);
                            if (s >= 90) distribution['90-100']++;
                            else if (s >= 80) distribution['80-89']++;
                            else if (s >= 70) distribution['70-79']++;
                            else if (s >= 60) distribution['60-69']++;
                            else distribution['< 60']++;
                          }
                        });
                      }
                      const distData = Object.keys(distribution).map(k => ({ name: k, count: distribution[k] }));
                      
                      return (
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distData} margin={CHART_MARGIN}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" className="dark:stroke-neutral-800" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={TICK_STYLE_SM} />
                              <YAxis axisLine={false} tickLine={false} tick={TICK_STYLE_SM} allowDecimals={false} />
                              <RechartsTooltip 
                                cursor={TOOLTIP_CURSOR_INDIGO}
                                contentStyle={TOOLTIP_CONTENT_STYLE}
                              />
                              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminReportsPage;
