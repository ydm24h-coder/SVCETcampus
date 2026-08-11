import React, { useState, useEffect } from 'react';
import { GraduationCap, Award, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

const StudentGradesPage = () => {
  const [studentAnalytics, setStudentAnalytics] = useState({
    mcqAvg: 0,
    codeAvg: 0,
    overall: 0,
    predictedGrade: 'N/A',
    assessmentsTaken: 0,
    completedAssessments: []
  });

  useEffect(() => {
    const sessionUser = JSON.parse(localStorage.getItem('svcet_session_student')) || { name: 'Demo Student' };
    const rawAssessments = localStorage.getItem('svcet_assessments');
    const parsed = rawAssessments ? JSON.parse(rawAssessments) : { mcq: [], code: [] };
    
    let mcqTotal = 0, mcqCount = 0;
    let codeTotal = 0, codeCount = 0;
    const completed = [];

    const processSubmissions = (arr, isCode) => {
      if (!arr) return;
      arr.forEach(a => {
        const sub = a.submissions?.find(s => s.studentName === sessionUser.name);
        if (sub && sub.score !== 'Pending') {
          let numScore = 0;
          if (typeof sub.score === 'string' && sub.score.includes('/')) {
            numScore = parseInt(sub.score.split('/')[0], 10);
          } else {
            numScore = parseInt(sub.score, 10) || 0;
          }

          if (isCode) {
            codeTotal += numScore;
            codeCount++;
          } else {
            mcqTotal += numScore;
            mcqCount++;
          }
          completed.push({
            id: a.id,
            title: a.title,
            type: isCode ? 'Code Test' : 'MCQ',
            score: numScore,
            total: a.questions ? a.questions.length * 10 : 100 // Approximation if needed
          });
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

    // eslint-disable-next-line
    setStudentAnalytics({
      mcqAvg,
      codeAvg,
      overall,
      predictedGrade,
      assessmentsTaken: mcqCount + codeCount,
      completedAssessments: completed
    });

  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Progress Report</h1>
        <p className="text-neutral-500 dark:text-neutral-400">View your automated academic performance across all assessments.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neutral-500 flex items-center gap-2"><Award className="w-4 h-4 text-amber-500"/> Predicted Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-amber-500 dark:text-amber-400 tracking-tighter">{studentAnalytics.predictedGrade}</div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neutral-500">Overall Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{studentAnalytics.overall > 0 ? `${studentAnalytics.overall}%` : 'N/A'}</div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neutral-500">MCQ Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{studentAnalytics.mcqAvg > 0 ? `${studentAnalytics.mcqAvg}%` : 'N/A'}</div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neutral-500">Code Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{studentAnalytics.codeAvg > 0 ? `${studentAnalytics.codeAvg}%` : 'N/A'}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <CardTitle className="text-lg font-medium flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
            Assessment History
          </CardTitle>
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20">
            {studentAnalytics.assessmentsTaken} Completed
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-200 dark:border-neutral-800">
                <TableHead>Assessment Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentAnalytics.completedAssessments.length > 0 ? (
                studentAnalytics.completedAssessments.map((g, idx) => (
                  <TableRow key={idx} className="border-neutral-200 dark:border-neutral-800">
                    <TableCell className="font-medium">{g.title}</TableCell>
                    <TableCell>{g.type}</TableCell>
                    <TableCell className="text-center font-bold text-blue-600 dark:text-blue-400">{g.score}%</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 shadow-none">Graded</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-neutral-500">
                    No assessments have been graded yet. Complete assessments and wait for faculty review!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentGradesPage;
