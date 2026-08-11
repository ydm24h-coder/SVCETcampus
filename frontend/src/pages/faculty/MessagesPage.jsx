import React from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import { useStudents } from '@/hooks/useStudents';
import { useAdmins } from '@/hooks/useAdmins';

const FacultyMessagesPage = () => {
  const { students } = useStudents();
  const { admins } = useAdmins();
  const sessionUser = JSON.parse(localStorage.getItem('svcet_session_faculty')) || {};
  const facultyName = sessionUser.name || 'Demo Faculty';

  const allUsers = [
    ...admins.map(a => ({ ...a, mappedRole: 'Admin', detail: a.role || 'Admin' })),
    ...students.map(s => ({ ...s, mappedRole: 'Student', detail: s.department || 'Student' }))
  ];

  return (
    <ChatInterface 
      contacts={allUsers}
      currentUser={facultyName}
      currentRole="Faculty"
      title="Messages"
      searchPlaceholder="Search admin or students..."
    />
  );
};

export default FacultyMessagesPage;
