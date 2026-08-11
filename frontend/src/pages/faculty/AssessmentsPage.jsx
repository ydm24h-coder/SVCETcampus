import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Plus, Code2, ListOrdered, Edit, Trash2, PlusCircle, ShieldAlert, AlertCircle, Upload, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { useAssessments } from '@/hooks/useAssessments';
import { useNotices } from '@/hooks/useNotices';
import { useDepartments } from '@/hooks/useDepartments';
import Editor from '@monaco-editor/react';

const AssessmentsPage = () => {
  const { departments } = useDepartments();
  const sessionUser = JSON.parse(localStorage.getItem('svcet_session_faculty') || '{}');
  const facultyName = sessionUser.name || 'Demo Faculty';

  const [activeTab, setActiveTab] = useState('code'); // 'code' or 'mcq'
  
  // Create Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const assessmentFileInputRef = useRef(null);
  
  // Edit Dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);

  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newStatus, setNewStatus] = useState('Draft');
  const [newStrictProctoring, setNewStrictProctoring] = useState(false);
  
  const [newTargetDepartment, setNewTargetDepartment] = useState('All');
  const [newTargetYear, setNewTargetYear] = useState('All');
  const [newLanguage, setNewLanguage] = useState('Any Language');
  
  // Assessment specific fieldsState for Code Tests
  const [problemStatement, setProblemStatement] = useState('');
  const [starterCode, setStarterCode] = useState('function solve(input) {\n  // Write your code here\n  \n}\n\nmodule.exports = solve;');

  // Specific State for MCQs
  const [mcqQuestions, setMcqQuestions] = useState([
    { qText: '', options: { A: '', B: '', C: '', D: '' }, correct: 'A' }
  ]);

  const { assessments, addAssessment, updateAssessment, deleteAssessment, gradeSubmission } = useAssessments();
  const { addNotice } = useNotices();
  
  const codeTests = (assessments.code || []).filter(a => a.createdBy === facultyName);
  const mcqs = (assessments.mcq || []).filter(a => a.createdBy === facultyName);

  // Results Dialog state
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [resultsAssessment, setResultsAssessment] = useState(null);
  const [evaluatingSubmission, setEvaluatingSubmission] = useState(null);
  const [evalScore, setEvalScore] = useState('');

  // Proctoring Report Dialog state
  const [isProctoringReportOpen, setIsProctoringReportOpen] = useState(false);
  const [selectedProctoringLog, setSelectedProctoringLog] = useState(null);

  // Handlers
  const handleDeleteCodeTest = (id) => deleteAssessment('code', id);
  const handleDeleteMcq = (id) => deleteAssessment('mcq', id);

  const handleEditClick = (assessment, type) => {
    setEditingAssessment({ ...assessment, type });
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    // Check if we are newly publishing this
    const originalAssessment = assessments[editingAssessment.type].find(a => a.id === editingAssessment.id);
    if (originalAssessment.status !== 'Published' && editingAssessment.status === 'Published') {
      addNotice({
        title: `New Assessment: ${editingAssessment.title}`,
        content: `A new assessment for ${editingAssessment.course} has been published and is now available to take. Duration: ${editingAssessment.duration} mins.`,
        authorName: 'Faculty',
        authorRole: 'Faculty',
        pinned: false
      });
    }

    updateAssessment(editingAssessment.type, editingAssessment.id, editingAssessment);
    setIsEditOpen(false);
  };

  const handleViewResults = (assessment) => {
    setResultsAssessment(assessment);
    setEvaluatingSubmission(null);
    setIsResultsOpen(true);
  };

  const handleViewProctoringReport = (submission) => {
    setSelectedProctoringLog(submission);
    setIsProctoringReportOpen(true);
  };

  const handleGradeSubmit = () => {
    if (!evalScore || isNaN(evalScore) || evalScore < 0 || evalScore > 100) {
      alert("Please enter a valid score between 0 and 100.");
      return;
    }
    const typeKey = resultsAssessment.questionsData ? 'mcq' : 'code';
    gradeSubmission(typeKey, resultsAssessment.id, evaluatingSubmission.studentName, evalScore);
    
    // Dispatch a targeted notification to the specific student
    addNotice({
      title: 'Code Test Graded 🏆',
      content: `Your code test for "${resultsAssessment.title}" has been successfully graded by the faculty. Your final score is ${evalScore}/100.`,
      authorName: 'Faculty Assessment Team',
      targetStudent: evaluatingSubmission.studentName
    });

    // Update local modal state to reflect the new grade instantly
    setResultsAssessment(prev => {
      const updatedSubmissions = prev.submissions.map(s => 
        s.studentName === evaluatingSubmission.studentName 
          ? { ...s, score: `${evalScore}/100`, starsEarned: parseInt(evalScore, 10) } 
          : s
      );
      return { ...prev, submissions: updatedSubmissions };
    });
    setEvaluatingSubmission(null);
    setEvalScore('');
  };

  const handleCreate = () => {
    if (!newTitle || !newDuration) {
      alert("Please enter at least a title and duration.");
      return;
    }

    const baseAssessment = {
      title: newTitle,
      course: newCourse || 'General',
      duration: newDuration,
      dueDate: newDueDate || 'No Due Date',
      status: newStatus,
      targetDepartment: newTargetDepartment,
      targetYear: newTargetYear,
      strictProctoring: newStrictProctoring,
      createdBy: facultyName
    };

    if (activeTab === 'code') {
      addAssessment('code', {
        ...baseAssessment,
        language: newLanguage,
        problemStatement: problemStatement,
        starterCode: starterCode
      });
    } else {
      addAssessment('mcq', {
        ...baseAssessment,
        questionsCount: mcqQuestions.length,
        questionsData: mcqQuestions
      });
    }

    // Trigger Notification if Published directly on creation
    if (newStatus === 'Published') {
      addNotice({
        title: `New Assessment: ${newTitle}`,
        content: `A new assessment for ${newCourse || 'General'} has been published and is now available to take. Duration: ${newDuration} mins.`,
        authorName: 'Faculty',
        authorRole: 'Faculty',
        pinned: false
      });
    }

    // Reset Form & Close Modal
    setNewTitle('');
    setNewCourse('');
    setNewDuration('');
    setNewDueDate('');
    setNewStatus('Draft');
    setNewStrictProctoring(false);
    setNewTargetDepartment('All');
    setNewTargetYear('All');
    setNewLanguage('Any Language');
    setProblemStatement('');
    setStarterCode('function solve(input) {\n  // Write your code here\n  \n}\n\nmodule.exports = solve;');
    setMcqQuestions([{ qText: '', options: { A: '', B: '', C: '', D: '' }, correct: 'A', type: 'MCQ' }]);
    setIsCreateOpen(false);
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setNewLanguage(lang);
    
    let boilerplate = '';
    if (lang === 'Python') {
      boilerplate = '"""\nInstructions:\n- Write your logic inside the solve function.\n- Do not change the function signature.\n- Return the expected output.\n"""\ndef solve(input_data):\n    # Write your code here\n    pass\n';
    } else if (lang === 'Java') {
      boilerplate = '/*\n * Instructions:\n * - Write your logic inside the main method.\n * - Do not change the class name (Main).\n * - Print the expected output to standard output.\n */\npublic class Main {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}';
    } else if (lang === 'C++') {
      boilerplate = '/*\n * Instructions:\n * - Write your logic inside the main function.\n * - Print the expected output to standard output.\n */\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}';
    } else if (lang === 'C') {
      boilerplate = '/*\n * Instructions:\n * - Write your logic inside the main function.\n * - Print the expected output to standard output.\n */\n#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}';
    } else {
      boilerplate = '/*\n * Instructions:\n * - Write your logic inside the solve function.\n * - Do not change the function signature.\n * - Return the expected output.\n */\nfunction solve(input) {\n  // Write your code here\n  \n}\n\nmodule.exports = solve;';
    }
    
    setStarterCode(boilerplate);
  };

  const handleAddQuestion = () => {
    setMcqQuestions([...mcqQuestions, { qText: '', options: { A: '', B: '', C: '', D: '' }, correct: 'A', type: 'MCQ' }]);
  };

  const handleTypeChange = (index, newType) => {
    const updated = [...mcqQuestions];
    updated[index].type = newType;
    if (newType === 'MSQ') {
      updated[index].correct = Array.isArray(updated[index].correct) ? updated[index].correct : [String(updated[index].correct || 'A')];
    } else {
      updated[index].correct = Array.isArray(updated[index].correct) ? (updated[index].correct[0] || 'A') : String(updated[index].correct || 'A');
    }
    setMcqQuestions(updated);
  };

  const handleCorrectMsqChange = (index, optKey) => {
    const updated = [...mcqQuestions];
    const currentCorrect = Array.isArray(updated[index].correct) ? updated[index].correct : [];
    if (currentCorrect.includes(optKey)) {
      updated[index].correct = currentCorrect.filter(k => k !== optKey);
    } else {
      updated[index].correct = [...currentCorrect, optKey];
    }
    setMcqQuestions(updated);
  };

  const handleAddOption = (qIndex) => {
    const updated = [...mcqQuestions];
    const optionsObj = updated[qIndex].options;
    const currentKeys = Object.keys(optionsObj);
    const nextCharCode = currentKeys.length > 0 ? currentKeys[currentKeys.length - 1].charCodeAt(0) + 1 : 65;
    const nextKey = String.fromCharCode(nextCharCode);
    optionsObj[nextKey] = '';
    setMcqQuestions(updated);
  };

  const handleRemoveQuestion = (index) => {
    if (mcqQuestions.length > 1) {
      const updated = [...mcqQuestions];
      updated.splice(index, 1);
      setMcqQuestions(updated);
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...mcqQuestions];
    updated[index][field] = value;
    setMcqQuestions(updated);
  };

  const handleOptionChange = (index, optKey, value) => {
    const updated = [...mcqQuestions];
    updated[index].options[optKey] = value;
    setMcqQuestions(updated);
  };

  const downloadAssessmentTemplate = () => {
    const headers = "Type,QuestionText,OptionA,OptionB,OptionC,OptionD,CorrectAnswer\n";
    const sampleMCQ = "MCQ,What is 2+2?,1,2,3,4,D\n";
    const sampleMSQ = 'MSQ,Which of these are fruits?,Apple,Carrot,Banana,Potato,"A,C"\n';
    const blob = new Blob([headers + sampleMCQ + sampleMSQ], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assessment_questions_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleAssessmentFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const newQuestions = [];
        results.data.forEach(row => {
          if (row.QuestionText || row.questiontext || row.Questiontext) {
            const rawType = row.Type || row.type || row.TYPE || 'MCQ';
            const type = String(rawType).trim().toUpperCase() === 'MSQ' ? 'MSQ' : 'MCQ';
            
            let rawCorrect = row.CorrectAnswer || row.correctanswer || row.correctAnswer || row['Correct Answer'] || 'A';
            let correct = String(rawCorrect).trim();
            
            // Format MSQ answers
            if (type === 'MSQ') {
              // Convert "A,C" to ["A", "C"]
              correct = correct.split(/[,;|]/).map(s => s.trim().toUpperCase()).filter(s => s);
              if (correct.length === 0) correct = ["A"];
            } else {
              correct = correct.toUpperCase();
            }

            newQuestions.push({
              qText: row.QuestionText || row.questiontext || row.Questiontext || 'Imported Question',
              type: type,
              correct: correct,
              options: {
                A: row.OptionA || row.optiona || row.optionA || 'Option A',
                B: row.OptionB || row.optionb || row.optionB || 'Option B',
                C: row.OptionC || row.optionc || row.optionC || 'Option C',
                D: row.OptionD || row.optiond || row.optionD || 'Option D'
              }
            });
          }
        });

        if (newQuestions.length > 0) {
          setMcqQuestions(newQuestions);
          alert(`Successfully loaded ${newQuestions.length} questions from spreadsheet! Review them and click Publish.`);
        } else {
          alert('No valid questions found. Please check your CSV format.');
        }
        
        if (assessmentFileInputRef.current) assessmentFileInputRef.current.value = '';
      },
      error: (error) => alert('Error parsing file: ' + error.message)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Manage NPTEL-style coding challenges and MCQ tests.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> 
              Create {activeTab === 'code' ? 'Code Test' : 'MCQ'}
            </Button>
          } />
          <DialogContent className="sm:max-w-[700px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {activeTab === 'code' ? 'Author New Code Task' : 'Author Multiple Choice Quiz'}
              </DialogTitle>
            </DialogHeader>

            {activeTab === 'code' ? (
              // CREATE CODE TEST
              <div className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label>Task Title</Label>
                  <Input 
                    placeholder="e.g. Reverse a Linked List" 
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Course Name</Label>
                    <Input 
                      placeholder="e.g. Data Structures" 
                      value={newCourse} 
                      onChange={(e) => setNewCourse(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (mins)</Label>
                    <Input 
                      type="number" 
                      placeholder="45" 
                      value={newDuration} 
                      onChange={(e) => setNewDuration(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input 
                      type="date" 
                      value={newDueDate} 
                      onChange={(e) => setNewDueDate(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Department</Label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newTargetDepartment}
                      onChange={(e) => setNewTargetDepartment(e.target.value)}
                    >
                      <option value="All">All Departments</option>
                      {departments.map(d => <option key={d.name || d} value={d.name || d}>{d.name || d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Year</Label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newTargetYear}
                      onChange={(e) => setNewTargetYear(e.target.value)}
                    >
                      <option value="All">All Years</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Programming Language</Label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newLanguage}
                      onChange={handleLanguageChange}
                    >
                      <option value="Any Language">Any Language</option>
                      <option value="Python">Python</option>
                      <option value="JavaScript">JavaScript</option>
                      <option value="Java">Java</option>
                      <option value="C++">C++</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <input 
                    type="checkbox" 
                    id="strictProctoringCode" 
                    checked={newStrictProctoring}
                    onChange={(e) => setNewStrictProctoring(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <Label htmlFor="strictProctoringCode" className="font-semibold text-red-600 dark:text-red-500">Enable Strict Webcam Proctoring</Label>
                </div>

                <div className="space-y-2">
                  <Label>Problem Statement & Instructions</Label>
                  <Textarea 
                    placeholder="Write the full problem description, constraints, and examples here..." 
                    className="h-32 resize-none" 
                    value={problemStatement}
                    onChange={(e) => setProblemStatement(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Starter Code (Boilerplate)</Label>
                  <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-950 p-4">
                    <Textarea 
                      value={starterCode}
                      onChange={(e) => setStarterCode(e.target.value)}
                      className="text-sm text-green-400 font-mono bg-transparent border-none p-0 focus-visible:ring-0 h-24 resize-none"
                    />
                  </div>
                  <p className="text-xs text-neutral-500">Students will see this code when they start the test.</p>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreate}>
                  Publish Code Task
                </Button>
              </div>
            ) : (
              // CREATE MCQ
              <div className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label>Quiz Title</Label>
                  <Input 
                    placeholder="e.g. Week 1 Quiz" 
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Course Name</Label>
                    <Input 
                      placeholder="e.g. Data Structures" 
                      value={newCourse} 
                      onChange={(e) => setNewCourse(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (mins)</Label>
                    <Input 
                      type="number" 
                      placeholder="15" 
                      value={newDuration} 
                      onChange={(e) => setNewDuration(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input 
                      type="date" 
                      value={newDueDate} 
                      onChange={(e) => setNewDueDate(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Department</Label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newTargetDepartment}
                      onChange={(e) => setNewTargetDepartment(e.target.value)}
                    >
                      <option value="All">All Departments</option>
                      {departments.map(d => <option key={d.name || d} value={d.name || d}>{d.name || d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Year</Label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newTargetYear}
                      onChange={(e) => setNewTargetYear(e.target.value)}
                    >
                      <option value="All">All Years</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <input 
                    type="checkbox" 
                    id="strictProctoringMcq" 
                    checked={newStrictProctoring}
                    onChange={(e) => setNewStrictProctoring(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <Label htmlFor="strictProctoringMcq" className="font-semibold text-red-600 dark:text-red-500">Enable Strict Webcam Proctoring</Label>
                </div>
                
                <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
                  <div className="space-y-1">
                    <Label className="text-blue-800 dark:text-blue-300 font-semibold">Bulk Import Questions</Label>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Generate assessment from a spreadsheet.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={downloadAssessmentTemplate} className="bg-white dark:bg-neutral-900 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900">
                      <Download className="w-4 h-4 mr-2" /> Template
                    </Button>
                    <input 
                      type="file" 
                      accept=".csv" 
                      ref={assessmentFileInputRef} 
                      onChange={handleAssessmentFileUpload} 
                      className="hidden" 
                    />
                    <Button size="sm" onClick={() => assessmentFileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Upload className="w-4 h-4 mr-2" /> Import CSV
                    </Button>
                  </div>
                </div>

                <div className="space-y-6 max-h-[50vh] overflow-y-auto p-1 pr-3">
                  {mcqQuestions.map((q, index) => (
                    <div key={index} className="space-y-4 p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-900/50">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Question {index + 1}</Label>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleRemoveQuestion(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="space-y-2 flex-1">
                          <Label>Question Text</Label>
                          <Textarea 
                            placeholder="What is the time complexity of binary search?" 
                            className="h-20" 
                            value={q.qText}
                            onChange={(e) => handleQuestionChange(index, 'qText', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2 w-48 shrink-0">
                          <Label>Question Type</Label>
                          <select 
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={q.type || 'MCQ'}
                            onChange={(e) => handleTypeChange(index, e.target.value)}
                          >
                            <option value="MCQ">Single Choice (MCQ)</option>
                            <option value="MSQ">Multiple Select (MSQ)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {Object.keys(q.options).map(optKey => {
                          const isCorrect = q.type === 'MSQ' 
                            ? (Array.isArray(q.correct) && q.correct.includes(optKey))
                            : q.correct === optKey;
                            
                          return (
                            <div key={optKey} className="space-y-2">
                              <div className="flex items-center gap-2">
                                {q.type === 'MSQ' ? (
                                  <input 
                                    type="checkbox" 
                                    checked={isCorrect} 
                                    onChange={() => handleCorrectMsqChange(index, optKey)}
                                    className="w-4 h-4 text-green-600 cursor-pointer rounded"
                                    title="Toggle as correct answer"
                                  />
                                ) : (
                                  <input 
                                    type="radio" 
                                    name={`correct-${index}`} 
                                    checked={isCorrect} 
                                    onChange={() => handleQuestionChange(index, 'correct', optKey)}
                                    className="w-4 h-4 text-green-600 cursor-pointer"
                                    title="Mark as correct answer"
                                  />
                                )}
                                <Label>Option {optKey}</Label>
                              </div>
                              <Input 
                                placeholder={`Option ${optKey}`} 
                                value={q.options[optKey]}
                                onChange={(e) => handleOptionChange(index, optKey, e.target.value)}
                                className={isCorrect ? "border-green-500 focus-visible:ring-green-500" : ""}
                              />
                              {isCorrect && <p className="text-xs text-green-600 font-medium">Marked as correct</p>}
                            </div>
                          );
                        })}
                      </div>

                      {q.type === 'MSQ' && (
                        <div className="pt-2">
                          <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => handleAddOption(index)}>
                            <Plus className="w-4 h-4 mr-2" /> Add Option
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full border-dashed border-2 border-neutral-300 dark:border-neutral-700" onClick={handleAddQuestion}>
                  <PlusCircle className="w-4 h-4 mr-2" /> Add Next Question
                </Button>

                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreate}>
                  Publish MCQ Quiz
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* EDIT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle>Edit Assessment Details</DialogTitle>
          </DialogHeader>
          
          {editingAssessment && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                  value={editingAssessment.title} 
                  onChange={(e) => setEditingAssessment({...editingAssessment, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Course</Label>
                <Input 
                  value={editingAssessment.course} 
                  onChange={(e) => setEditingAssessment({...editingAssessment, course: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Duration (mins)</Label>
                  <Input 
                    type="number" 
                    value={editingAssessment.duration} 
                    onChange={(e) => setEditingAssessment({...editingAssessment, duration: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input 
                    type="date" 
                    value={editingAssessment.dueDate || ''} 
                    onChange={(e) => setEditingAssessment({...editingAssessment, dueDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editingAssessment.status}
                    onChange={(e) => setEditingAssessment({...editingAssessment, status: e.target.value})}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <input 
                  type="checkbox" 
                  id="strictProctoringEdit" 
                  checked={editingAssessment.strictProctoring || false}
                  onChange={(e) => setEditingAssessment({...editingAssessment, strictProctoring: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <Label htmlFor="strictProctoringEdit" className="font-semibold text-red-600 dark:text-red-500">Enable Strict Webcam Proctoring</Label>
              </div>    
              <div className="space-y-2">
                    <Label>Target Department</Label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={editingAssessment.targetDepartment || 'All'}
                      onChange={(e) => setEditingAssessment({...editingAssessment, targetDepartment: e.target.value})}
                    >
                      <option value="All">All Departments</option>
                      {departments.map(d => <option key={d.name || d} value={d.name || d}>{d.name || d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Year</Label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={editingAssessment.targetYear || 'All'}
                      onChange={(e) => setEditingAssessment({...editingAssessment, targetYear: e.target.value})}
                    >
                      <option value="All">All Years</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
              
              <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* RESULTS MODAL */}
      <Dialog open={isResultsOpen} onOpenChange={setIsResultsOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle>
              {evaluatingSubmission ? `Evaluating: ${evaluatingSubmission.studentName}` : `Submissions: ${resultsAssessment?.title}`}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {evaluatingSubmission ? (
              <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => setEvaluatingSubmission(null)} className="mb-2 -ml-2 text-neutral-500">
                  &larr; Back to Submissions
                </Button>
                <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden h-96 relative">
                  <Editor
                    height="100%"
                    language={(() => {
                      const langStr = resultsAssessment?.language || '';
                      const l = langStr.toLowerCase();
                      if (l.includes('python')) return 'python';
                      if (l.includes('java') && !l.includes('javascript')) return 'java';
                      if (l.includes('c++')) return 'cpp';
                      if (l.includes('c')) return 'c';
                      return 'javascript';
                    })()}
                    theme="vs-dark"
                    value={evaluatingSubmission.codeContent || '// No code submitted.'}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 14,
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      padding: { top: 16 }
                    }}
                  />
                </div>
                <div className="flex items-center gap-4 mt-6">
                  <div className="flex-1 space-y-1">
                    <Label>Assign Score (0-100)</Label>
                    <Input 
                      type="number" 
                      min="0" max="100" 
                      value={evalScore} 
                      onChange={(e) => setEvalScore(e.target.value)} 
                      placeholder="e.g. 85" 
                      className="font-bold text-lg h-12"
                    />
                  </div>
                  <Button className="mt-5 h-12 px-8 bg-green-600 hover:bg-green-700 text-white font-bold" onClick={handleGradeSubmit}>
                    Submit Grade
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {!resultsAssessment?.submissions || resultsAssessment.submissions.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 border border-dashed rounded-xl border-neutral-300 dark:border-neutral-800">
                    No students have submitted this assessment yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {resultsAssessment.submissions.map((sub, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-900/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center">
                            {sub.studentName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900 dark:text-white">{sub.studentName}</p>
                            <p className="text-xs text-neutral-500">Submitted: {sub.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div className="flex flex-col items-end gap-1 border-r border-neutral-200 dark:border-neutral-800 pr-4 mr-1">
                            {sub.warnings !== undefined ? (
                              sub.warnings === 0 ? (
                                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                                  No Violations
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
                                  {sub.warnings} Violations
                                </Badge>
                              )
                            ) : (
                              <span className="text-xs text-neutral-400">N/A</span>
                            )}
                            {sub.proctoringLogs && sub.proctoringLogs.length > 0 && (
                              <Button size="sm" variant="link" className="h-auto p-0 text-xs text-blue-600 dark:text-blue-400" onClick={() => handleViewProctoringReport(sub)}>
                                View Report
                              </Button>
                            )}
                          </div>
                          {sub.score === 'Pending' ? (
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">Pending Eval</Badge>
                              {sub.codeContent && (
                                <Button size="sm" variant="outline" onClick={() => setEvaluatingSubmission(sub)} className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/30">
                                  Review Code
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="text-xl font-bold text-green-600 dark:text-green-500">{sub.score}</div>
                              <div className="text-xs text-neutral-500">Score</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PROCTORING REPORT MODAL */}
      <Dialog open={isProctoringReportOpen} onOpenChange={setIsProctoringReportOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Proctoring Incident Report
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <p className="font-semibold text-lg">{selectedProctoringLog?.studentName}</p>
              <p className="text-sm text-neutral-500">Total Warnings: <strong className="text-red-500">{selectedProctoringLog?.warnings}</strong></p>
            </div>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {selectedProctoringLog?.proctoringLogs?.map((log, index) => (
                <div key={index} className="flex gap-4 p-4 border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20 rounded-xl">
                  <div className="text-red-500 mt-1">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-mono text-xs text-neutral-500 mb-1">{log.time}</div>
                    <div className="font-medium text-neutral-900 dark:text-neutral-200">{log.reason}</div>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white" onClick={() => setIsProctoringReportOpen(false)}>
              Close Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <div className="flex p-1 bg-neutral-100 dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10 w-full max-w-sm relative">
        <motion.div
          className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-blue-600 rounded-lg shadow-sm border border-neutral-200 dark:border-transparent"
          initial={false}
          animate={{ x: activeTab === 'code' ? '4px' : 'calc(100% + 4px)' }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
        <button
          onClick={() => setActiveTab('code')}
          className={`flex-1 flex items-center justify-center py-2 text-sm font-medium transition-colors relative z-10 ${activeTab === 'code' ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-white'}`}
        >
          <Code2 className="w-4 h-4 mr-2" />
          Code Tests
        </button>
        <button
          onClick={() => setActiveTab('mcq')}
          className={`flex-1 flex items-center justify-center py-2 text-sm font-medium transition-colors relative z-10 ${activeTab === 'mcq' ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-white'}`}
        >
          <ListOrdered className="w-4 h-4 mr-2" />
          MCQs
        </button>
      </div>

      {/* Tab Content */}
      <div className="grid gap-4 mt-6">
        {activeTab === 'code' ? (
          codeTests.length > 0 ? codeTests.map((test) => (
            <Card key={test.id} className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{test.title}</CardTitle>
                  <CardDescription>{test.course} • {test.duration} mins {test.dueDate && test.dueDate !== 'No Due Date' ? `• Due: ${test.dueDate}` : ''}</CardDescription>
                </div>
                <Badge variant="outline" className={test.status === 'Published' ? 'text-green-600 border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/20' : 'text-orange-600 border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-900/20'}>
                  {test.status}
                </Badge>
              </CardHeader>
              <CardContent className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleViewResults(test)} className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900">
                  View Results ({test.submissions?.length || 0})
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEditClick(test, 'code')}><Edit className="w-4 h-4 mr-1" /> Edit</Button>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => handleDeleteCodeTest(test.id)}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </CardContent>
            </Card>
          )) : <div className="p-8 text-center text-neutral-500 border border-dashed rounded-xl border-neutral-300 dark:border-neutral-800">No code tests created yet.</div>
        ) : (
          mcqs.length > 0 ? mcqs.map((test) => (
            <Card key={test.id} className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{test.title}</CardTitle>
                  <CardDescription>{test.course} • {test.duration} mins • {test.questionsCount || 10} Questions {test.dueDate && test.dueDate !== 'No Due Date' ? `• Due: ${test.dueDate}` : ''}</CardDescription>
                </div>
                <Badge variant="outline" className={test.status === 'Published' ? 'text-green-600 border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/20' : 'text-orange-600 border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-900/20'}>
                  {test.status}
                </Badge>
              </CardHeader>
              <CardContent className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleViewResults(test)} className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900">
                  View Results ({test.submissions?.length || 0})
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEditClick(test, 'mcq')}><Edit className="w-4 h-4 mr-1" /> Edit</Button>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => handleDeleteMcq(test.id)}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </CardContent>
            </Card>
          )) : <div className="p-8 text-center text-neutral-500 border border-dashed rounded-xl border-neutral-300 dark:border-neutral-800">No MCQs created yet.</div>
        )}
      </div>
    </div>
  );
};

export default AssessmentsPage;
