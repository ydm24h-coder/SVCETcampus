import { useState, useEffect } from 'react';

const STORAGE_KEY = 'svcet_messages';

// Messages shape: { id, senderId, senderName, senderRole, receiverId, receiverName, receiverRole, content, timestamp, isRead, attachment, attachmentName, reaction }

export const useMessages = () => {
  const [messages, setMessagesState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessagesState(JSON.parse(saved));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('messagesUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('messagesUpdated', handleStorageChange);
    };
  }, []);

  const setMessages = (newMessages) => {
    let updated;
    if (typeof newMessages === 'function') {
      updated = newMessages(messages);
    } else {
      updated = newMessages;
    }
    setMessagesState(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('messagesUpdated'));
  };

  const sendMessage = (messageData) => {
    const newMessage = {
      ...messageData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      isRead: false,
      attachment: messageData.attachment || null,
      attachmentName: messageData.attachmentName || null,
      replyTo: messageData.replyTo || null,
      isForwarded: messageData.isForwarded || false
    };
    setMessages(prev => [...prev, newMessage]);
    window.dispatchEvent(new CustomEvent('newMessageAlert', { detail: newMessage }));
  };

  const markAsRead = (messageIds) => {
    setMessages(prev => prev.map(msg => 
      messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
    ));
  };

  const toggleReaction = (messageId, emoji) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, reaction: msg.reaction === emoji ? null : emoji };
      }
      return msg;
    }));
  };

  const deleteMessage = (messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const clearChat = (contactName, currentUser) => {
    setMessages(prev => prev.filter(m => 
      !(
        (m.senderName === currentUser && m.receiverName === contactName) ||
        (m.senderName === contactName && m.receiverName === currentUser) ||
        (m.receiverName === contactName && m.receiverRole === 'Group') // Group clear
      )
    ));
  };

  return {
    messages,
    sendMessage,
    markAsRead,
    toggleReaction,
    deleteMessage,
    clearChat
  };
};
