import React, { useState } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { useRequestComments } from '../../hooks/useRequestComments';

const RequestChat = ({ requestId, currentUser }) => {
  const { comments, addComment } = useRequestComments(requestId);
  const [message, setMessage] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    addComment(requestId, currentUser, message);
    setMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
        <h3 className="font-semibold text-sm">Discussion</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
        {comments.length === 0 ? (
          <div className="text-center text-neutral-400 text-sm py-8">
            No discussion yet.
          </div>
        ) : (
          comments.map((comment, idx) => {
            const isMe = comment.user.includes(currentUser.split(' | ')[0]); // naive matching
            return (
              <div key={comment.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-bl-none'}`}>
                  {comment.message}
                </div>
                <div className="text-[10px] text-neutral-400 mt-1 flex gap-2">
                  <span className="font-medium">{comment.user.split(' | ')[0]}</span>
                  <span>{new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center gap-2">
        <input 
          type="text" 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button type="submit" disabled={!message.trim()} className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default RequestChat;
