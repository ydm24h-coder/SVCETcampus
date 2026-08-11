import React from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import { useFaculty } from '@/hooks/useFaculty';

const StudentMessagesPage = () => {
  const { faculty } = useFaculty();
  const sessionUser = JSON.parse(localStorage.getItem('svcet_session_student')) || {};
  const studentName = sessionUser.name || 'Demo Student';

  const allUsers = faculty.map(f => ({ ...f, mappedRole: 'Faculty', detail: f.department }));

  return (
    <ChatInterface 
      contacts={allUsers}
      currentUser={studentName}
      currentRole="Student"
      title="Messages"
      searchPlaceholder="Search faculty..."
    />
  );
};

export default StudentMessagesPage;
