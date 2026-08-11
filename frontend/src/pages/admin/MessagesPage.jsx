import React from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import { useFaculty } from '@/hooks/useFaculty';

const AdminMessagesPage = () => {
  const { faculty } = useFaculty();
  const sessionUser = JSON.parse(localStorage.getItem('svcet_session_admin')) || {};
  const adminName = sessionUser.name || 'Admin';

  const allUsers = [
    ...faculty.map(f => ({ ...f, mappedRole: 'Faculty', detail: f.department }))
  ];

  return (
    <ChatInterface 
      contacts={allUsers}
      currentUser={adminName}
      currentRole="Admin"
      title="Admin Messages"
      searchPlaceholder="Search faculty..."
    />
  );
};

export default AdminMessagesPage;
