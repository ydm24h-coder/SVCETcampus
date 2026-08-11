import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { useAssessments } from '@/hooks/useAssessments';
import { useStudents } from '@/hooks/useStudents';

const StudentAssessmentsPage = () => {
  const navigate = useNavigate();
  const { assessments } = useAssessments();
  const { students } = useStudents();

  const sessionUser = JSON.parse(localStorage.getItem('svcet_session_student')) || { name: 'Demo Student' };
  const studentProfile = students.find(s => s.name === sessionUser.name) || {};
  const studentDept = studentProfile.department || 'All';
  const studentYear = studentProfile.year || 'All';

  // Combine code and mcq tests into one array for the student view
  const allTests = [
    ...(assessments.code || []).map(t => ({ ...t, type: 'Code', dueDate: t.dueDate || 'No Due Date' })),
    ...(assessments.mcq || []).map(t => ({ ...t, type: 'MCQ', dueDate: t.dueDate || 'No Due Date' }))
  ].filter(t => t.status === 'Published')
   .filter(t => !t.targetDepartment || t.targetDepartment === 'All' || t.targetDepartment === studentDept)
   .filter(t => !t.targetYear || t.targetYear === 'All' || t.targetYear === studentYear.toString());

  const tests = allTests.map(t => {
    const submission = (t.submissions || []).find(s => s.studentName === sessionUser.name);
    return {
      ...t,
      isCompleted: !!submission,
      studentScore: submission ? submission.score : null
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
        <p className="text-neutral-500 dark:text-neutral-400">View and take your assigned tests and quizzes.</p>
      </div>

      <div className="grid gap-4">
        {tests.map(test => (
          <Card key={test.id} className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={test.type === 'Code' ? 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/50' : 'text-purple-600 border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-900/50'}>
                    {test.type} Test
                  </Badge>
                  {test.isCompleted ? (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900/50">
                      Completed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-900/50">
                      Pending
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg mt-2">{test.title}</CardTitle>
                <CardDescription className="mt-1">
                  {test.course} • {test.duration}
                </CardDescription>
              </div>
              
              <div className="mt-4 sm:mt-0 flex flex-col items-start sm:items-end gap-2">
                {!test.isCompleted ? (
                  <>
                    <div className="text-sm text-neutral-500 flex items-center">
                      <Clock className="w-4 h-4 mr-1" /> Due: {test.dueDate}
                    </div>
                    <Button onClick={() => navigate(`/student/assessments/take/${test.id}?type=${test.type}`)} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Play className="w-4 h-4 mr-2" /> Start Test
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" /> Graded
                    </div>
                    <div className="text-2xl font-bold">{test.studentScore}</div>
                  </>
                )}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StudentAssessmentsPage;
