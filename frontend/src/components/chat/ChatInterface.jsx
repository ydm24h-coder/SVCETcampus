import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatCanvasBackground from './ChatCanvasBackground';
import { Search, Send, User, Check, CheckCheck, Paperclip, X, Download, FileText, MoreVertical, Smile, CornerUpLeft, Heart, Info, Mic, Square, Trash2, Play, Pause, Reply, Forward, Copy, Users, Filter, ChevronRight, Phone, Video, Mail, ImageIcon, Link, File, BellOff, Ban, AlertTriangle, ArrowLeft, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useMessages } from '@/hooks/useMessages';
import { useGroups } from '@/hooks/useGroups';

import { useIsMobile } from '@/hooks/useIsMobile';

const QUICK_EMOJIS = ['✅', '👍', '👏', '🤝', '🎉', '📌'];

const ChatInterface = ({ contacts, currentUser, currentRole, title = "Messages", searchPlaceholder = "Search contacts..." }) => {
  const { messages, sendMessage, markAsRead, toggleReaction, deleteMessage, clearChat } = useMessages();
  const { groups, createGroup } = useGroups();
  const isMobile = useIsMobile();
  
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // New States
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [filterUnread, setFilterUnread] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showMediaView, setShowMediaView] = useState(false);
  const [mediaTab, setMediaTab] = useState('media'); // 'media', 'docs', 'links'
  const [initialUnreadId, setInitialUnreadId] = useState(null);
  const prevContactRef = useRef(null);

  // Attachment state
  const [attachment, setAttachment] = useState(null);
  const [attachmentName, setAttachmentName] = useState(null);
  const [attachmentType, setAttachmentType] = useState(null);

  // Long-press Context Menu State & Swipe State
  const [longPressedMsg, setLongPressedMsg] = useState(null);
  const touchTimerRef = useRef(null);
  
  const [swipingMsgId, setSwipingMsgId] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartXRef = useRef(0);
  const touchCurrentXRef = useRef(0);

  const handleTouchStart = (e, msg) => {
    if (!isMobile) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchCurrentXRef.current = e.touches[0].clientX;
    
    touchTimerRef.current = setTimeout(() => {
      setLongPressedMsg(msg);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500); // 500ms hold
  };

  const handleTouchMove = (e, msg) => {
    if (!isMobile) return;
    
    touchCurrentXRef.current = e.touches[0].clientX;
    const diffX = touchCurrentXRef.current - touchStartXRef.current;
    
    if (Math.abs(diffX) > 10 && touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
    
    if (Math.abs(diffX) > 10 && !longPressedMsg) {
      setSwipingMsgId(msg.id);
      const offset = diffX > 0 ? Math.min(diffX * 0.4, 80) : Math.max(diffX * 0.4, -80);
      setSwipeOffset(offset);
    }
  };

  const handleTouchEnd = (msg) => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
    
    if (swipingMsgId === msg.id) {
      if (swipeOffset > 50) {
        setReplyingTo(msg);
        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
      } else if (swipeOffset < -50) {
        setForwardingMessage(msg);
        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
      }
      setSwipingMsgId(null);
      setSwipeOffset(0);
    }
  };

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [messageInput]);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isMobile) {
      document.body.style.overflowX = 'hidden';
      return () => { document.body.style.overflowX = 'auto'; };
    }
  }, [isMobile]);

  // Combine contacts with groups the user is a member of
  const myGroups = groups.filter(g => g.members.includes(currentUser));
  const allContactsRaw = [...myGroups, ...contacts];

  // Dynamically calculate lastMessage and unreadCount
  const allContacts = allContactsRaw.map(c => {
    const contactMessages = messages.filter(m => 
      (m.senderName === currentUser && m.receiverName === c.name) ||
      (m.senderName === c.name && m.receiverName === currentUser) ||
      (c.isGroup && m.receiverName === c.name) // Group logic
    );
    
    const unreadCount = contactMessages.filter(m => m.receiverName === currentUser && !m.isRead).length;
    const lastMsg = contactMessages[contactMessages.length - 1];
    
    return {
      ...c,
      unreadCount,
      lastMessage: lastMsg ? (lastMsg.content || lastMsg.attachmentName || 'Attachment') : null,
      lastMessageTime: lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      lastMessageDate: lastMsg ? new Date(lastMsg.timestamp) : new Date(0)
    };
  }).sort((a, b) => b.lastMessageDate - a.lastMessageDate); // Sort by most recent message

  const filteredContacts = allContacts.filter(c => 
    (!filterUnread || c.unreadCount > 0) &&
    (c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.mappedRole?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeMessages = messages.filter(m => 
    selectedContact && (
      (selectedContact.isGroup && m.receiverName === selectedContact.name) ||
      (m.senderName === currentUser && m.receiverName === selectedContact.name) ||
      (m.senderName === selectedContact.name && m.receiverName === currentUser)
    )
  );

  // Media, Docs, and Links Parsing
  const URL_REGEX = /(https?:\/\/[^\s]+)/g;
  
  const mediaMessages = activeMessages.filter(m => m.attachmentType === 'image' || m.attachment?.startsWith('data:image') || m.attachmentType === 'audio' || m.attachmentName === 'Voice Message');
  
  const docMessages = activeMessages.filter(m => m.attachment && !mediaMessages.includes(m));
  
  const linkMessages = activeMessages.reduce((acc, m) => {
    if (m.content) {
      const links = m.content.match(URL_REGEX);
      if (links) {
        links.forEach(link => {
          acc.push({ ...m, extractedLink: link });
        });
      }
    }
    return acc;
  }, []);

  useEffect(() => {
    const isContactChange = prevContactRef.current !== selectedContact?.id;
    prevContactRef.current = selectedContact?.id;

    if (selectedContact) {
      if (isContactChange) {
        const unreadMsgs = activeMessages.filter(m => m.receiverName === currentUser && !m.isRead);
        if (unreadMsgs.length > 0) {
          const firstUnread = unreadMsgs[0].id;
          setInitialUnreadId(firstUnread);
          
          setTimeout(() => {
            const el = document.getElementById(`msg-${firstUnread}`);
            if (el) el.scrollIntoView({ behavior: 'auto', block: 'center' });
            else scrollToBottom('auto');
          }, 100);
          
          markAsRead(unreadMsgs.map(m => m.id));
        } else {
          setInitialUnreadId(null);
          scrollToBottom('auto');
        }
      } else {
        scrollToBottom('smooth');
      }
    }
  }, [activeMessages.length, selectedContact]);

  // Handle Recording cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRecording]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment(reader.result);
      setAttachmentName(file.name);
      setAttachmentType(file.type.startsWith('image/') ? 'image' : 'file');
    };
    reader.readAsDataURL(file);
    e.target.value = null; // reset
  };

  const clearAttachment = () => {
    setAttachment(null);
    setAttachmentName(null);
    setAttachmentType(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAttachment(reader.result);
          setAttachmentName('Voice Message');
          setAttachmentType('audio');
        };
        // stop tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
     if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      setAttachment(null);
      setAttachmentType(null);
    }
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() && !attachment) return;

    sendMessage({
      senderName: currentUser,
      senderRole: currentRole,
      receiverName: selectedContact.name,
      receiverRole: selectedContact.isGroup ? 'Group' : (selectedContact.role || selectedContact.mappedRole || 'User'),
      content: messageInput.trim(),
      attachment: attachment,
      attachmentName: attachmentName,
      attachmentType: attachmentType,
      replyTo: replyingTo ? replyingTo.id : null
    });
    
    setMessageInput('');
    setShowEmojiPicker(false);
    clearAttachment();
    setReplyingTo(null);
  };

  const handleDownload = (base64, filename) => {
    const link = document.createElement("a");
    link.href = base64;
    link.download = filename || "attachment";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDoubleTap = (msgId) => {
    toggleReaction(msgId, '❤️');
  };

  return (
    <>
      <ChatCanvasBackground />
      <div className="flex h-[calc(100dvh-80px)] -m-6 md:-m-8 relative z-0 p-0 md:p-4 bg-transparent overflow-hidden w-auto max-w-[100vw]">
      
      {/* App Container */}
      <div className="w-full h-full flex md:rounded-2xl overflow-hidden bg-transparent border-0 md:border border-neutral-200 dark:border-neutral-800 md:shadow-xl relative">
        
        {/* Left Pane - Contacts */}
        <AnimatePresence initial={false}>
          {(!isMobile ? isSidebarOpen : !selectedContact) && (
            <motion.div 
              className={`h-full flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111b21] shrink-0 relative overflow-hidden ${isMobile ? 'absolute inset-0 z-[40] w-full' : 'z-20'}`}
              initial={isMobile ? { x: '-100%', opacity: 1 } : { width: 0, opacity: 0 }}
              animate={isMobile ? { x: 0, opacity: 1 } : { width: 320, opacity: 1 }}
              exit={isMobile ? { x: '-100%', opacity: 1 } : { width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="w-full md:w-[320px] h-full flex flex-col shrink-0">
              <div className="p-4 pt-6 shrink-0 bg-white dark:bg-[#111b21]">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{title}</h2>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setFilterUnread(!filterUnread)}>
                        <Filter className="w-4 h-4 mr-2" />
                        {filterUnread ? 'Show All' : 'Filter Unread'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowCreateGroup(true)}>
                        <Users className="w-4 h-4 mr-2" />
                        New Group
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <Input 
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#f0f2f5] dark:bg-[#202c33] border-transparent rounded-xl h-10 text-[15px] focus-visible:ring-0 placeholder:text-neutral-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-transparent scrollbar-hide">
                <AnimatePresence>
                  {filteredContacts.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center text-neutral-500 text-sm">
                      No contacts found.
                    </motion.div>
                  ) : (
                    filteredContacts.map((contact, idx) => (
                      <button
                        key={contact.name + contact.role}
                        onClick={() => setSelectedContact(contact)}
                        className={`w-full px-4 py-3 flex items-center gap-3.5 transition-colors text-left ${selectedContact?.name === contact.name ? 'bg-[#f0f2f5] dark:bg-[#2a3942]' : 'hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]'}`}
                      >
                        <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-[2px] shrink-0">
                          <div className="w-full h-full rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center overflow-hidden border-2 border-white dark:border-[#111b21]">
                             {contact.avatar ? <img src={contact.avatar} className="w-full h-full object-cover"/> : <User className="w-5 h-5 text-neutral-400" />}
                          </div>
                          {contact.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00a884] border-2 border-white dark:border-[#111b21] rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 border-b border-neutral-100 dark:border-[#202c33] py-1">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <h3 className={`text-[16px] font-medium truncate pr-2 ${selectedContact?.name === contact.name ? 'text-neutral-900 dark:text-white' : 'text-neutral-900 dark:text-neutral-100'}`}>
                              {contact.name}
                            </h3>
                            {contact.lastMessageTime && <span className={`text-[12px] shrink-0 ${contact.unreadCount > 0 ? 'text-[#00a884] font-medium' : 'text-neutral-500'}`}>{contact.lastMessageTime}</span>}
                          </div>
                          <div className="flex justify-between items-center">
                            <p className={`text-[14px] truncate pr-2 ${contact.unreadCount > 0 ? 'text-neutral-900 dark:text-white font-semibold' : 'text-neutral-500 dark:text-neutral-400'}`}>
                              {contact.lastMessage || <span className="italic">Tap to chat</span>}
                            </p>
                            {contact.unreadCount > 0 && (
                              <span className="bg-[#00a884] text-white text-[11px] font-bold px-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-full shrink-0">
                                {contact.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </AnimatePresence>
              </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center Pane - Chat Area */}
        <AnimatePresence initial={false}>
          {(!isMobile || selectedContact) && (
            <motion.div 
              initial={isMobile ? { x: '100%', opacity: 1 } : { opacity: 0 }}
              animate={isMobile ? { x: 0, opacity: 1 } : { opacity: 1 }}
              exit={isMobile ? { x: '100%', opacity: 1 } : { opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`flex-1 h-full flex flex-col relative z-0 ${isMobile ? 'absolute inset-0 z-[50] w-full' : 'flex'}`}
            >
              {!selectedContact ? (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 p-8 z-10 border-b-[6px] border-[#00a884] bg-transparent">
                  <div className="w-72 h-72 rounded-full flex items-center justify-center mb-8">
                    <img src="/logo.png" alt="App Logo" className="w-32 h-32 opacity-20 grayscale" />
                  </div>
                  <h2 className="text-3xl font-light text-neutral-700 dark:text-neutral-300 mb-4">SVCET Web for {currentRole}</h2>
                  <p className="text-[14px] max-w-md text-center text-neutral-500">
                    powered by ZORVEX Technologies
                  </p>
                </div>
              ) : (
                <>

                  {/* Chat Header */}
                  <div className="h-[60px] bg-[#f0f2f5] dark:bg-[#202c33] flex items-center px-2 md:px-4 shrink-0 z-10 shadow-sm border-b border-neutral-200 dark:border-neutral-800">
                    <button 
                      className="md:hidden mr-2 p-1.5 -ml-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full transition-colors"
                      onClick={() => {
                        setSelectedContact(null);
                      }}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <button 
                      className="hidden md:block mr-2 p-1.5 -ml-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full transition-colors"
                      onClick={() => {
                        if (window.innerWidth <= 768) {
                          setSelectedContact(null);
                        } else {
                          setIsSidebarOpen(!isSidebarOpen);
                        }
                      }}
                    >
                      <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex-1 flex items-center min-w-0 cursor-pointer" onClick={() => setShowProfile(!showProfile)}>
                      <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center shrink-0 mr-3 overflow-hidden">
                         {selectedContact.avatar ? <img src={selectedContact.avatar} className="w-full h-full object-cover"/> : <User className="w-5 h-5 text-neutral-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-medium text-[16px] text-neutral-900 dark:text-neutral-100 truncate">{selectedContact.name}</h2>
                        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 truncate">
                          {selectedContact.isOnline ? 'online' : `last seen today at 10:30 PM`}
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      className="ml-2 p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full transition-colors"
                      onClick={() => setShowProfile(!showProfile)}
                    >
                      <Info className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-3 md:p-8 space-y-3 md:space-y-6 relative scrollbar-hide flex flex-col bg-transparent z-10">
                    {activeMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full opacity-60">
                        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 bg-[#ffeecd] dark:bg-[#182229] px-4 py-2 rounded-lg text-center shadow-sm">
                          🔒 Messages are end-to-end encrypted. No one outside of this chat, not even SVCET, can read or listen to them.
                        </p>
                      </div>
                    ) : (
                      <AnimatePresence initial={false}>
                        {activeMessages.map((msg, idx) => {
                          const isMe = msg.senderName === currentUser;
                          const showDate = idx === 0 || (new Date(msg.timestamp).toLocaleDateString() !== new Date(activeMessages[idx-1].timestamp).toLocaleDateString());
                          
                          // For grouping bubbles tightly
                          const isNextMe = idx < activeMessages.length - 1 && activeMessages[idx+1].senderName === currentUser;
                          const isPrevMe = idx > 0 && activeMessages[idx-1].senderName === currentUser;
                          
                          const bubbleRadius = isMe 
                            ? `rounded-lg ${!isNextMe || activeMessages[idx+1].senderName !== currentUser ? 'rounded-br-none' : ''}`
                            : `rounded-lg ${!isNextMe || activeMessages[idx+1].senderName !== currentUser ? 'rounded-bl-none' : ''}`;
                          
                          return (
                            <React.Fragment key={msg.id}>
                              {showDate && (
                                <div className="flex justify-center my-4">
                                  <span className="bg-white/80 dark:bg-[#182229]/80 backdrop-blur-md shadow-sm text-neutral-600 dark:text-neutral-400 text-[12px] uppercase px-3 py-1 rounded-lg">
                                    {new Date(msg.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              )}
                              {msg.id === initialUnreadId && (
                                <div className="flex justify-center my-2">
                                  <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[12px] font-medium px-3 py-1 rounded-lg shadow-sm">
                                    Unread Messages
                                  </span>
                                </div>
                              )}
                              <motion.div 
                                id={`msg-${msg.id}`}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${!isNextMe || activeMessages[idx+1].senderName !== msg.senderName ? 'mb-2' : 'mb-[2px]'}`}
                              >
                                <div className="relative max-w-[85%] md:max-w-[65%]">
                                  {isMobile && (
                                    <>
                                      <div className="absolute top-1/2 -translate-y-1/2 right-full mr-3 flex items-center justify-center z-0 pointer-events-none"
                                           style={{ 
                                             opacity: swipingMsgId === msg.id && swipeOffset > 20 ? Math.min((swipeOffset-20)/30, 1) : 0, 
                                             transform: `scale(${swipingMsgId === msg.id && swipeOffset > 20 ? Math.min((swipeOffset-20)/30, 1) : 0.5})`
                                           }}>
                                        <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center"><Reply className="w-4 h-4 text-neutral-600 dark:text-neutral-300" /></div>
                                      </div>
                                      <div className="absolute top-1/2 -translate-y-1/2 left-full ml-3 flex items-center justify-center z-0 pointer-events-none"
                                           style={{ 
                                             opacity: swipingMsgId === msg.id && swipeOffset < -20 ? Math.min((Math.abs(swipeOffset)-20)/30, 1) : 0, 
                                             transform: `scale(${swipingMsgId === msg.id && swipeOffset < -20 ? Math.min((Math.abs(swipeOffset)-20)/30, 1) : 0.5})`
                                           }}>
                                        <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center"><Forward className="w-4 h-4 text-neutral-600 dark:text-neutral-300" /></div>
                                      </div>
                                    </>
                                  )}
                                  <div 
                                    className="relative group flex items-center gap-2 z-10 w-full"
                                    style={{
                                      transform: swipingMsgId === msg.id ? `translateX(${swipeOffset}px)` : 'none',
                                      transition: swipingMsgId === msg.id ? 'none' : 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                    }}
                                  >
                                  {isMe && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800">
                                            <MoreVertical className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => setReplyingTo(msg)}><Reply className="w-4 h-4 mr-2"/> Reply</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => setForwardingMessage(msg)}><Forward className="w-4 h-4 mr-2"/> Forward</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(msg.content)}><Copy className="w-4 h-4 mr-2"/> Copy</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => deleteMessage(msg.id)} className="text-red-500 focus:bg-red-50 dark:focus:bg-red-900/20"><Trash2 className="w-4 h-4 mr-2"/> Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  )}

                                  <div className={`relative px-3 py-1.5 shadow-sm text-[15px] leading-relaxed break-words w-full ${bubbleRadius} ${
                                    isMe 
                                      ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef]' 
                                      : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef]'
                                  }`} 
                                    onDoubleClick={() => handleDoubleTap(msg.id)}
                                    onTouchStart={(e) => handleTouchStart(e, msg)}
                                    onTouchEnd={() => handleTouchEnd(msg)}
                                    onTouchMove={(e) => handleTouchMove(e, msg)}
                                    onContextMenu={(e) => { if (isMobile) e.preventDefault(); }}
                                  >
                                    
                                    {/* Forwarded Tag */}
                                    {msg.isForwarded && (
                                      <div className={`flex items-center text-[11px] font-medium italic mb-1 ${isMe ? 'text-indigo-200' : 'text-neutral-500'}`}>
                                        <Forward className="w-3 h-3 mr-1" /> Forwarded
                                      </div>
                                    )}

                                    {/* Replied Message Preview */}
                                    {msg.replyTo && (() => {
                                      const repliedMsg = messages.find(m => m.id === msg.replyTo);
                                      if (!repliedMsg) return null;
                                      return (
                                        <div className={`mb-1.5 p-2 rounded bg-black/10 border-l-4 ${isMe ? 'border-white/50' : 'border-indigo-500'} text-[13px]`}>
                                          <p className={`font-bold ${isMe ? 'text-indigo-100' : 'text-indigo-600 dark:text-indigo-400'}`}>{repliedMsg.senderName}</p>
                                          <p className="line-clamp-1 opacity-80">{repliedMsg.content || repliedMsg.attachmentName}</p>
                                        </div>
                                      );
                                    })()}

                                    {/* Group Sender Name */}
                                    {selectedContact.isGroup && !isMe && (
                                      <div className="font-bold text-[12px] text-indigo-500 mb-0.5">{msg.senderName}</div>
                                    )}

                                    {/* Attachment Preview */}
                                    {msg.attachment && (
                                      <div className={`mt-1 mb-1 w-full ${msg.content ? 'pb-2' : ''}`}>
                                        {msg.attachmentType === 'audio' || (msg.attachmentName && msg.attachmentName === 'Voice Message') ? (
                                          <div className={`flex items-center gap-2 p-2 rounded-full ${isMe ? 'bg-black/10' : 'bg-neutral-100 dark:bg-[#2a3942]'}`}>
                                            <audio src={msg.attachment} controls className="h-10 max-w-[200px] outline-none" />
                                          </div>
                                        ) : msg.attachment.startsWith('data:image') ? (
                                          <div className="relative rounded-lg overflow-hidden bg-black/10 flex items-center justify-center min-h-[120px] group/img cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDownload(msg.attachment, msg.attachmentName); }}>
                                            <img src={msg.attachment} alt="attachment" className="w-full max-h-[300px] object-cover transition-transform duration-500 group-hover/img:scale-105" />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                              <Download className="w-8 h-8 text-white drop-shadow-md" />
                                            </div>
                                          </div>
                                        ) : (
                                          <div className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isMe ? 'bg-black/20 hover:bg-black/30' : 'bg-neutral-100 dark:bg-[#2a3942] hover:bg-neutral-200 dark:hover:bg-[#344651]'}`} onClick={() => handleDownload(msg.attachment, msg.attachmentName)}>
                                            <div className={`w-10 h-10 rounded bg-white/20 flex items-center justify-center shrink-0`}>
                                              <FileText className={`w-5 h-5 ${isMe ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0 pr-2">
                                              <p className="text-[14px] font-medium truncate">{msg.attachmentName}</p>
                                              <p className="text-[12px] opacity-70 uppercase tracking-wide">Document</p>
                                            </div>
                                            <Download className={`w-5 h-5 ${isMe ? 'opacity-80' : 'text-neutral-400'}`} />
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    
                                    <div className="flex items-end gap-3 flex-wrap">
                                      {msg.content && <p className="whitespace-pre-wrap pt-0.5 break-words break-all">{msg.content}</p>}
                                      
                                      <div className={`flex items-center justify-end gap-1 shrink-0 ml-auto pt-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {isMe && (
                                          msg.isRead ? <CheckCheck className="w-[16px] h-[16px] text-[#53bdeb] ml-0.5" /> : <Check className="w-[16px] h-[16px] opacity-70 ml-0.5" />
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {!isMe && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800">
                                            <MoreVertical className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                          <DropdownMenuItem onClick={() => setReplyingTo(msg)}><Reply className="w-4 h-4 mr-2"/> Reply</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => setForwardingMessage(msg)}><Forward className="w-4 h-4 mr-2"/> Forward</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(msg.content)}><Copy className="w-4 h-4 mr-2"/> Copy</DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  )}

                                  {/* Reactions */}
                                  {msg.reaction && (
                                    <motion.div 
                                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                                      className={`absolute -bottom-3 ${isMe ? '-left-2' : '-right-2'} bg-white dark:bg-[#202c33] border border-neutral-100 dark:border-neutral-700 rounded-full px-1.5 py-0.5 text-sm shadow-md cursor-pointer hover:scale-110 transition-transform z-10`}
                                      onClick={() => handleDoubleTap(msg.id)}
                                    >
                                      {msg.reaction}
                                    </motion.div>
                                  )}
                                </div>
                                </div>
                              </motion.div>
                            </React.Fragment>
                          );
                        })}
                      </AnimatePresence>
                    )}
                    <div ref={messagesEndRef} className="h-2" />
                  </div>

                  {/* Chat Input Area */}
                  <div className="bg-[#f0f2f5] dark:bg-[#202c33] border-t border-neutral-200 dark:border-neutral-800 px-2 md:px-4 py-2 md:py-3 pb-safe z-20 flex flex-col shrink-0 relative">
                    {/* Reply Preview */}
                    <AnimatePresence>
                      {replyingTo && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: 10, height: 0 }}
                          className="bg-black/5 dark:bg-black/20 rounded-xl mb-2 flex overflow-hidden border-l-4 border-indigo-500 relative"
                        >
                          <div className="flex-1 p-3 pr-10 min-w-0">
                            <p className="font-bold text-sm text-indigo-600 dark:text-indigo-400 mb-1">{replyingTo.senderName}</p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">{replyingTo.content || replyingTo.attachmentName}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="absolute top-2 right-2 w-6 h-6 rounded-full text-neutral-500" onClick={() => setReplyingTo(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-end gap-2 w-full">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full w-10 h-10 shrink-0 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        disabled={isRecording}
                      >
                        <Smile className="w-6 h-6" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full w-10 h-10 shrink-0 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 -ml-1"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isRecording}
                      >
                        <Paperclip className="w-5 h-5" />
                      </Button>

                      <div className="flex-1 relative bg-white dark:bg-[#2a3942] rounded-lg flex items-center min-h-[44px] shadow-sm">
                      
                      {/* Emoji Quick Picker */}
                      <AnimatePresence>
                        {showEmojiPicker && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full mb-3 left-0 bg-white dark:bg-[#202c33] rounded-2xl p-2 shadow-xl border border-neutral-200 dark:border-neutral-700 flex gap-1 z-30"
                          >
                            {QUICK_EMOJIS.map(emoji => (
                              <button 
                                key={emoji} type="button"
                                className="w-10 h-10 text-2xl hover:bg-neutral-100 dark:hover:bg-[#2a3942] rounded-full transition-colors flex items-center justify-center hover:scale-110 active:scale-95"
                                onClick={() => { setMessageInput(prev => prev + emoji); setShowEmojiPicker(false); }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Attachment Preview */}
                      <AnimatePresence>
                        {attachment && !isRecording && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full mb-3 left-0 bg-white dark:bg-[#202c33] rounded-2xl p-3 shadow-xl border border-neutral-200 dark:border-neutral-700 flex items-center gap-3 z-30 max-w-sm"
                          >
                            {attachmentType === 'audio' ? (
                              <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                <Mic className="w-6 h-6 text-indigo-500" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center shrink-0 overflow-hidden">
                                {attachmentType === 'image' ? (
                                  <img src={attachment} alt="preview" className="w-full h-full object-cover" />
                                ) : (
                                  <FileText className="w-6 h-6 text-indigo-500" />
                                )}
                              </div>
                            )}
                            <div className="flex-1 min-w-0 pr-4">
                              <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{attachmentName}</p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="w-8 h-8 rounded-full text-red-500 bg-red-50 dark:bg-red-900/20 absolute -top-2 -right-2 shadow-sm" onClick={clearAttachment}><X className="w-4 h-4" /></Button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.doc,.docx" />
                      
                      {isRecording ? (
                        <div className="flex-1 flex items-center px-4 h-11">
                          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse mr-3 shrink-0"></span>
                          <span className="text-red-500 font-medium">
                            {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
                          </span>
                          <Button variant="ghost" size="icon" className="ml-auto text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={cancelRecording}>
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      ) : (
                        <Textarea 
                          ref={textareaRef}
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                          placeholder="Type a message" 
                          rows={1}
                          className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 px-4 py-3 min-h-[44px] max-h-[120px] text-[15px] placeholder:text-neutral-500 resize-none overflow-y-auto scrollbar-hide"
                          onFocus={() => setShowEmojiPicker(false)}
                        />
                      )}
                    </div>

                    {isRecording ? (
                      <div className="flex items-center gap-1">
                        <Button type="button" size="icon" onClick={stopRecording} className="w-10 h-10 rounded-full shrink-0 bg-red-500 hover:bg-red-600 text-white shadow-md transition-transform hover:scale-105">
                          <Square className="w-4 h-4 fill-current" />
                        </Button>
                      </div>
                    ) : (messageInput.trim() || attachment) ? (
                      <Button type="button" onClick={handleSend} size="icon" className="w-10 h-10 rounded-full shrink-0 bg-[#00a884] hover:bg-[#008f6f] text-white shadow-md transition-transform hover:scale-105 active:scale-95">
                        <Send className="w-5 h-5 ml-1" />
                      </Button>
                    ) : (
                      <Button type="button" size="icon" onClick={startRecording} className="w-10 h-10 rounded-full shrink-0 bg-[#00a884] hover:bg-[#008f6f] text-white shadow-md transition-transform hover:scale-105">
                        <Mic className="w-5 h-5" />
                      </Button>
                    )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Info Right Pane */}
        <AnimatePresence>
          {showProfile && selectedContact && (
            <motion.div 
              initial={isMobile ? { x: '100%' } : { width: 0, opacity: 0 }}
              animate={isMobile ? { x: 0 } : { width: 380, opacity: 1 }}
              exit={isMobile ? { x: '100%' } : { width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`h-full flex flex-col bg-[#f0f2f5] dark:bg-[#111b21] border-l border-neutral-200 dark:border-neutral-800 shrink-0 overflow-hidden ${isMobile ? 'absolute inset-0 z-[60] w-full' : 'absolute md:relative right-0 z-50'}`}
            >
              <div className="w-full md:w-[380px] h-full flex flex-col shrink-0">
                {/* Profile Header */}
                <div className="h-[60px] bg-white dark:bg-[#202c33] flex items-center px-4 shrink-0 shadow-sm sticky top-0 z-10">
                <button 
                  className="mr-4 p-1.5 -ml-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full transition-colors"
                  onClick={() => setShowProfile(false)}
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="font-medium text-[16px] text-neutral-900 dark:text-neutral-100">Contact info</h2>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {/* Hero Section */}
                <div className="bg-white dark:bg-[#111b21] flex flex-col items-center py-8 px-4 mb-2 shadow-sm w-full overflow-hidden">
                  <div className="w-48 h-48 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden mb-4 shadow-md shrink-0">
                    {selectedContact.avatar ? <img src={selectedContact.avatar} className="w-full h-full object-cover"/> : <User className="w-20 h-20 text-neutral-400" />}
                  </div>
                  <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white text-center break-words break-all whitespace-normal w-full">{selectedContact.name}</h2>
                  <p className="text-[15px] text-neutral-500 dark:text-neutral-400 mt-1 break-words break-all text-center w-full">{selectedContact.isGroup ? 'Group' : selectedContact.role || 'User'}</p>
                </div>

                {/* About Section */}
                {!selectedContact.isGroup && (
                  <div className="bg-white dark:bg-[#111b21] py-4 px-6 mb-2 shadow-sm w-full overflow-hidden">
                    <h3 className="text-[14px] font-medium text-neutral-500 mb-2">About</h3>
                    <p className="text-[16px] text-neutral-900 dark:text-neutral-100 break-words break-all whitespace-normal w-full">
                      {selectedContact.department || 'No department specified'}
                    </p>
                    <p className="text-[14px] text-neutral-500 mt-1">Available</p>
                  </div>
                )}

                {/* Media Section */}
                <div className="bg-white dark:bg-[#111b21] py-4 px-6 mb-2 shadow-sm">
                  <div className="flex justify-between items-center mb-3 cursor-pointer group" onClick={() => setShowMediaView(true)}>
                    <h3 className="text-[14px] font-medium text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">Media, links, and docs</h3>
                    <div className="flex items-center text-[13px] text-neutral-400">
                      {activeMessages.filter(m => m.attachment).length} <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {activeMessages.filter(m => m.attachment).slice(-6).reverse().map((msg, idx) => (
                      <div key={idx} className="w-20 h-20 shrink-0 rounded-lg bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center cursor-pointer border border-neutral-200 dark:border-neutral-700">
                        {msg.attachmentType === 'image' || msg.attachment?.startsWith('data:image') ? (
                          <img src={msg.attachment} alt="media" className="w-full h-full object-cover" />
                        ) : msg.attachmentType === 'audio' || msg.attachmentName === 'Voice Message' ? (
                          <Mic className="w-8 h-8 text-neutral-400" />
                        ) : (
                          <FileText className="w-8 h-8 text-neutral-400" />
                        )}
                      </div>
                    ))}
                    {activeMessages.filter(m => m.attachment).length === 0 && (
                      <p className="text-sm text-neutral-400 italic">No media shared yet.</p>
                    )}
                  </div>
                </div>

                {/* Actions Section */}
                <div className="bg-white dark:bg-[#111b21] py-2 mb-2 shadow-sm w-full overflow-hidden">
                  <button className="w-full px-6 py-3 flex items-center gap-4 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors text-left" onClick={() => {}}>
                    <BellOff className="w-5 h-5 text-neutral-500 shrink-0" />
                    <span className="text-[16px] text-neutral-900 dark:text-neutral-100 truncate w-full">Mute notifications</span>
                  </button>
                  <button className="w-full px-6 py-3 flex items-center gap-4 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors text-left" onClick={() => clearChat(selectedContact.name, currentUser)}>
                    <Trash2 className="w-5 h-5 text-red-500 shrink-0" />
                    <span className="text-[16px] text-red-500 truncate w-full">Clear chat</span>
                  </button>
                </div>

                {!selectedContact.isGroup && (
                  <div className="bg-white dark:bg-[#111b21] py-2 mb-6 shadow-sm w-full overflow-hidden">

                    <button className="w-full px-6 py-3 flex items-center gap-4 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors text-left" onClick={() => {}}>
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                      <span className="text-[16px] text-red-500 truncate w-full">Report contact</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Pane - Media View (Slides over Profile) */}
        <AnimatePresence>
          {showMediaView && selectedContact && (
            <motion.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0, position: 'absolute' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full md:w-[380px] h-full flex flex-col bg-[#f0f2f5] dark:bg-[#111b21] border-l border-neutral-200 dark:border-neutral-800 absolute right-0 z-[60] shrink-0"
            >
              {/* Header */}
              <div className="h-[60px] bg-white dark:bg-[#202c33] flex items-center px-4 shrink-0 shadow-sm sticky top-0 z-10">
                <button 
                  className="mr-4 p-1.5 -ml-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full transition-colors"
                  onClick={() => setShowMediaView(false)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="font-medium text-[16px] text-neutral-900 dark:text-neutral-100">Media, links and docs</h2>
              </div>

              {/* Tabs */}
              <div className="flex bg-white dark:bg-[#202c33] border-b border-neutral-200 dark:border-neutral-800 shrink-0">
                <button className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${mediaTab === 'media' ? 'border-[#00a884] text-[#00a884]' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`} onClick={() => setMediaTab('media')}>Media</button>
                <button className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${mediaTab === 'docs' ? 'border-[#00a884] text-[#00a884]' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`} onClick={() => setMediaTab('docs')}>Docs</button>
                <button className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${mediaTab === 'links' ? 'border-[#00a884] text-[#00a884]' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`} onClick={() => setMediaTab('links')}>Links</button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto bg-white dark:bg-[#111b21] p-2 scrollbar-hide">
                {mediaTab === 'media' && (
                  <div className="grid grid-cols-3 gap-1">
                    {mediaMessages.length === 0 ? <p className="col-span-3 text-center text-sm text-neutral-400 py-8">No media shared</p> : mediaMessages.slice().reverse().map(msg => (
                      <div key={msg.id} className="aspect-square bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                        {msg.attachmentType === 'image' || msg.attachment?.startsWith('data:image') ? (
                          <img src={msg.attachment} alt="media" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center text-neutral-400">
                            <Mic className="w-6 h-6 mb-1" />
                            <span className="text-[10px]">{msg.attachmentName || 'Voice'}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {mediaTab === 'docs' && (
                  <div className="flex flex-col gap-2">
                    {docMessages.length === 0 ? <p className="text-center text-sm text-neutral-400 py-8">No docs shared</p> : docMessages.slice().reverse().map(msg => (
                      <div key={msg.id} className="flex items-center gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-[#202c33] rounded-lg cursor-pointer transition-colors border border-neutral-100 dark:border-neutral-800">
                        <div className="w-10 h-10 rounded bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{msg.attachmentName || 'Document'}</h4>
                          <p className="text-xs text-neutral-500 truncate">{new Date(msg.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {mediaTab === 'links' && (
                  <div className="flex flex-col gap-2">
                    {linkMessages.length === 0 ? <p className="text-center text-sm text-neutral-400 py-8">No links shared</p> : linkMessages.slice().reverse().map((msg, idx) => (
                      <a key={`${msg.id}-${idx}`} href={msg.extractedLink} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-[#202c33] rounded-lg cursor-pointer transition-colors border border-neutral-100 dark:border-neutral-800 group">
                        <div className="w-10 h-10 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                          <Link className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm text-blue-600 dark:text-blue-400 font-medium break-all line-clamp-2">{msg.extractedLink}</h4>
                          <p className="text-xs text-neutral-500 mt-1">{new Date(msg.timestamp).toLocaleDateString()}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Group Modal */}
      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="E.g. Computer Science 2026"
                className="bg-neutral-50 dark:bg-neutral-950"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Select Members</Label>
              <div className="max-h-48 overflow-y-auto border border-neutral-200 dark:border-neutral-800 rounded-md p-2 space-y-1">
                {contacts.map(c => (
                  <div key={c.name} className="flex items-center space-x-2 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                    <input 
                      type="checkbox" 
                      id={`member-${c.name}`}
                      checked={selectedGroupMembers.includes(c.name)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedGroupMembers([...selectedGroupMembers, c.name]);
                        else setSelectedGroupMembers(selectedGroupMembers.filter(m => m !== c.name));
                      }}
                      className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor={`member-${c.name}`} className="text-sm cursor-pointer flex-1">
                      {c.name} <span className="text-xs text-neutral-500">({c.role || 'Student'})</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateGroup(false)}>Cancel</Button>
            <Button 
              disabled={!newGroupName.trim() || selectedGroupMembers.length === 0}
              onClick={() => {
                createGroup({ name: newGroupName.trim(), members: [...selectedGroupMembers, currentUser], createdBy: currentUser });
                setShowCreateGroup(false);
                setNewGroupName('');
                setSelectedGroupMembers([]);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Forward Message Modal */}
      <Dialog open={!!forwardingMessage} onOpenChange={(open) => !open && setForwardingMessage(null)}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle>Forward Message to...</DialogTitle>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-1 mt-4 border border-neutral-200 dark:border-neutral-800 rounded-md p-2">
            {allContacts.map(c => (
              <button
                key={c.name}
                className="w-full text-left p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md flex items-center justify-between"
                onClick={() => {
                  sendMessage({
                    senderName: currentUser,
                    senderRole: currentRole,
                    receiverName: c.name,
                    receiverRole: c.isGroup ? 'Group' : (c.role || c.mappedRole || 'User'),
                    content: forwardingMessage.content,
                    attachment: forwardingMessage.attachment,
                    attachmentName: forwardingMessage.attachmentName,
                    attachmentType: forwardingMessage.attachmentType,
                    isForwarded: true
                  });
                  setForwardingMessage(null);
                }}
              >
                <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100">{c.name} {c.isGroup && '(Group)'}</div>
                <Send className="w-4 h-4 text-neutral-400" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      </div>

      {/* Mobile Long-Press Context Menu Overlay */}
      <AnimatePresence>
        {isMobile && longPressedMsg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex flex-col justify-end"
            onClick={() => setLongPressedMsg(null)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-neutral-900 rounded-t-2xl p-4 pb-8 flex flex-col gap-1 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mb-4" />
              
              <button 
                onClick={() => { setReplyingTo(longPressedMsg); setLongPressedMsg(null); }}
                className="w-full text-left p-4 active:bg-neutral-100 dark:active:bg-neutral-800 rounded-xl flex items-center gap-4 text-[17px] text-neutral-900 dark:text-neutral-100 font-medium transition-colors"
              >
                <Reply className="w-6 h-6 text-neutral-500" />
                Reply
              </button>
              
              <button 
                onClick={() => { setForwardingMessage(longPressedMsg); setLongPressedMsg(null); }}
                className="w-full text-left p-4 active:bg-neutral-100 dark:active:bg-neutral-800 rounded-xl flex items-center gap-4 text-[17px] text-neutral-900 dark:text-neutral-100 font-medium transition-colors"
              >
                <Forward className="w-6 h-6 text-neutral-500" />
                Forward
              </button>
              
              <button 
                onClick={() => { navigator.clipboard.writeText(longPressedMsg.content || ''); setLongPressedMsg(null); }}
                className="w-full text-left p-4 active:bg-neutral-100 dark:active:bg-neutral-800 rounded-xl flex items-center gap-4 text-[17px] text-neutral-900 dark:text-neutral-100 font-medium transition-colors"
              >
                <Copy className="w-6 h-6 text-neutral-500" />
                Copy
              </button>
              
              {longPressedMsg.senderName === currentUser && (
                <button 
                  onClick={() => { deleteMessage(longPressedMsg.id); setLongPressedMsg(null); }}
                  className="w-full text-left p-4 active:bg-red-50 dark:active:bg-red-900/20 rounded-xl flex items-center gap-4 text-[17px] text-red-600 dark:text-red-400 font-medium transition-colors"
                >
                  <Trash2 className="w-6 h-6 text-red-500" />
                  Delete
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
};

export default ChatInterface;
