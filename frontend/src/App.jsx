import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PageLoader from './components/ui/PageLoader';
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
import AdminLayout from './components/layout/AdminLayout';
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const StudentsPage = lazy(() => import('./pages/admin/StudentsPage'));
const FacultyPage = lazy(() => import('./pages/admin/FacultyPage'));
const DepartmentsPage = lazy(() => import('./pages/admin/DepartmentsPage'));
const CoursesPage = lazy(() => import('./pages/admin/CoursesPage'));
const TimetablePage = lazy(() => import('./pages/admin/TimetablePage'));
const NoticesPage = lazy(() => import('./pages/admin/NoticesPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const AdminDailyTasksPage = lazy(() => import('./pages/admin/DailyTasksPage'));
const AdminFeedbackPage = lazy(() => import('./pages/admin/FeedbackPage'));
const AdminReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const AdminMessagesPage = lazy(() => import('./pages/admin/MessagesPage'));
const AdminRequestsPage = lazy(() => import('./pages/admin/AdminRequestsPage'));
const RequestSettingsPage = lazy(() => import('./pages/admin/RequestSettingsPage'));

// Faculty Imports
import FacultyLayout from './components/layout/FacultyLayout';
const FacultyDashboard = lazy(() => import('./pages/faculty/FacultyDashboard'));
const MyStudentsPage = lazy(() => import('./pages/faculty/MyStudentsPage'));
const AttendancePage = lazy(() => import('./pages/faculty/AttendancePage'));
const GradesPage = lazy(() => import('./pages/faculty/GradesPage'));
const AssessmentsPage = lazy(() => import('./pages/faculty/AssessmentsPage'));
const MaterialsPage = lazy(() => import('./pages/faculty/MaterialsPage'));
const FacultySettingsPage = lazy(() => import('./pages/faculty/SettingsPage'));
const FacultyNoticesPage = lazy(() => import('./pages/faculty/NoticesPage'));
const FacultyMessagesPage = lazy(() => import('./pages/faculty/MessagesPage'));
const FacultyRequestsPage = lazy(() => import('./pages/faculty/FacultyRequestsPage'));
const FacultyRequestCreatePage = lazy(() => import('./pages/faculty/FacultyRequestCreatePage'));
// Mentoring & Verification
const FacultySkillVerificationPage = lazy(() => import('./pages/faculty/SkillVerificationPage'));
const FacultyStudentProjectsPage = lazy(() => import('./pages/faculty/StudentProjectsPage'));
const FacultyMentorshipPage = lazy(() => import('./pages/faculty/MentorshipPage'));

// Student Imports
import StudentLayout from './components/layout/StudentLayout';
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const MyCoursesPage = lazy(() => import('./pages/student/MyCoursesPage'));
const StudentMaterialsPage = lazy(() => import('./pages/student/StudentMaterialsPage'));
const StudentAssessmentsPage = lazy(() => import('./pages/student/StudentAssessmentsPage'));
const TestTakingPage = lazy(() => import('./pages/student/TestTakingPage'));
const StudentGradesPage = lazy(() => import('./pages/student/StudentGradesPage'));
const StudentSettingsPage = lazy(() => import('./pages/student/SettingsPage'));
const StudentNoticesPage = lazy(() => import('./pages/student/NoticesPage'));
const StudentMessagesPage = lazy(() => import('./pages/student/MessagesPage'));
const StudentRequestsPage = lazy(() => import('./pages/student/StudentRequestsPage'));
const StudentRequestCreatePage = lazy(() => import('./pages/student/StudentRequestCreatePage'));
const LeaderboardPage = lazy(() => import('./pages/student/LeaderboardPage'));
const DailyTaskPage = lazy(() => import('./pages/student/DailyTaskPage'));
const StudentPracticePage = lazy(() => import('./pages/student/StudentPracticePage'));
const PracticeTaskIDE = lazy(() => import('./pages/student/PracticeTaskIDE'));
const StudentProfilePage = lazy(() => import('./pages/student/StudentProfilePage'));
// Professional & SkillHub
const AchievementsPage = lazy(() => import('./pages/student/AchievementsPage'));
const SkillHubPage = lazy(() => import('./pages/student/skillhub/SkillHubPage'));
const CommunitiesPage = lazy(() => import('./pages/student/skillhub/CommunitiesPage'));
const CommunityDetailPage = lazy(() => import('./pages/student/skillhub/CommunityDetailPage'));
const MyCommunitiesPage = lazy(() => import('./pages/student/skillhub/MyCommunitiesPage'));
const ChallengesPage = lazy(() => import('./pages/student/skillhub/ChallengesPage'));
const TeamFinderPage = lazy(() => import('./pages/student/skillhub/TeamFinderPage'));

import GlobalNotification from './components/ui/GlobalNotification';
import InteractiveBackground from './components/ui/InteractiveBackground';
import FacultyBackground from './components/ui/FacultyBackground';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  console.log("Rendering App Component!");
  const location = useLocation();
  const isStudentRoute = location.pathname.startsWith('/student');
  const isFacultyRoute = location.pathname.startsWith('/faculty');

  return (
    <>
      {isStudentRoute && <InteractiveBackground />}
      {isFacultyRoute && <FacultyBackground />}
      <GlobalNotification />
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Admin Portal */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['Admin', 'Super Admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="faculty" element={<FacultyPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="timetable" element={<TimetablePage />} />
          <Route path="daily-tasks" element={<AdminDailyTasksPage />} />
          <Route path="notices" element={<NoticesPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="feedback" element={<AdminFeedbackPage />} />
          <Route path="requests" element={<AdminRequestsPage />} />
          <Route path="request-settings" element={<RequestSettingsPage />} />
          <Route path="messages" element={<AdminMessagesPage />} />
          
          {/* Restricted Routes */}
          <Route path="departments" element={
            <ProtectedRoute allowedRoles={['Super Admin']}>
              <DepartmentsPage />
            </ProtectedRoute>
          } />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
        
        {/* Faculty Portal */}
        <Route path="/faculty" element={
          <ProtectedRoute allowedRoles={['Faculty']}>
            <FacultyLayout />
          </ProtectedRoute>
        }>
          <Route index element={<FacultyDashboard />} />
          <Route path="students" element={<MyStudentsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="grades" element={<GradesPage />} />
          <Route path="assessments" element={<AssessmentsPage />} />
          <Route path="materials" element={<MaterialsPage />} />
          <Route path="notices" element={<FacultyNoticesPage />} />
          <Route path="messages" element={<FacultyMessagesPage />} />
          <Route path="requests" element={<FacultyRequestsPage />} />
          <Route path="requests/create" element={<FacultyRequestCreatePage />} />
          <Route path="skill-verify" element={<FacultySkillVerificationPage />} />
          <Route path="student-projects" element={<FacultyStudentProjectsPage />} />
          <Route path="mentorship" element={<FacultyMentorshipPage />} />
          <Route path="settings" element={<FacultySettingsPage />} />
          <Route path="*" element={<Navigate to="/faculty" replace />} />
        </Route>
        
        {/* Student Portal */}
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['Student']}>
            <ErrorBoundary>
              <StudentLayout />
            </ErrorBoundary>
          </ProtectedRoute>
        }>
          <Route index element={<StudentDashboard />} />
          <Route path="courses" element={<MyCoursesPage />} />
          <Route path="materials" element={<StudentMaterialsPage />} />
          <Route path="assessments" element={<StudentAssessmentsPage />} />
          <Route path="grades" element={<StudentGradesPage />} />
          <Route path="notices" element={<StudentNoticesPage />} />
          <Route path="messages" element={<StudentMessagesPage />} />
          <Route path="requests" element={<StudentRequestsPage />} />
          <Route path="requests/create" element={<StudentRequestCreatePage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="practice" element={<StudentPracticePage />} />
          <Route path="settings" element={<StudentSettingsPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="profile/:studentName" element={<StudentProfilePage />} />
          {/* Achievements (unified Posts, Projects, Certificates) */}
          <Route path="achievements" element={<AchievementsPage />} />
          {/* SkillHub module */}
          <Route path="skillhub" element={<SkillHubPage />} />
          <Route path="skillhub/communities" element={<CommunitiesPage />} />
          <Route path="skillhub/community/:id" element={<CommunityDetailPage />} />
          <Route path="skillhub/my-communities" element={<MyCommunitiesPage />} />
          <Route path="skillhub/challenges" element={<ChallengesPage />} />
          <Route path="skillhub/team-finder" element={<TeamFinderPage />} />
          <Route path="*" element={<Navigate to="/student" replace />} />
        </Route>
        
        {/* Full-screen IDE Routes (No Sidebar layout) */}
        <Route path="/student/daily-task" element={<ProtectedRoute allowedRoles={['Student']}><DailyTaskPage /></ProtectedRoute>} />
        <Route path="/student/assessments/take/:id" element={<ProtectedRoute allowedRoles={['Student']}><TestTakingPage /></ProtectedRoute>} />
        <Route path="/student/practice/:taskId" element={<ProtectedRoute allowedRoles={['Student']}><PracticeTaskIDE /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </>
  );
}

export default App;
