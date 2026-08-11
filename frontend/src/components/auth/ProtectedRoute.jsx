import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles, children }) => {
  // Check for any active session
  const adminSession = JSON.parse(localStorage.getItem('svcet_session_admin'));
  const facultySession = JSON.parse(localStorage.getItem('svcet_session_faculty'));
  const studentSession = JSON.parse(localStorage.getItem('svcet_session_student'));
  
  const session = adminSession || facultySession || studentSession;
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  // 8 hour session timeout (8 * 60 * 60 * 1000 = 28800000 ms)
  if (session.loginTimestamp && Date.now() - session.loginTimestamp > 28800000) {
    localStorage.removeItem('svcet_session_admin');
    localStorage.removeItem('svcet_session_faculty');
    localStorage.removeItem('svcet_session_student');
    alert("Your session has expired. Please log in again.");
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    // Redirect to their appropriate dashboard if unauthorized
    alert("You do not have permission to access this page.");
    if (session.role === 'Admin' || session.role === 'Super Admin') return <Navigate to="/admin" replace />;
    if (session.role === 'Faculty') return <Navigate to="/faculty" replace />;
    return <Navigate to="/student" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
