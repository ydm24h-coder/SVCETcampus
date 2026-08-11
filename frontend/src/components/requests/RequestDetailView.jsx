import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Download, Trash2, Clock, CheckCircle2, 
  XCircle, FileText, Send, UserCircle2, ShieldAlert,
  Paperclip, MoreVertical
} from 'lucide-react';
import DOMPurify from 'dompurify';
import RequestStatusBadge from './RequestStatusBadge';
import { useRequestComments } from '../../hooks/useRequestComments';
import { getAttachmentUrl } from '../../utils/indexedDB';

const RequestDetailView = ({ 
  request, 
  onBack, 
  onDownload, 
  onDelete, 
  actions = [], 
  currentUserStr 
}) => {
  const { comments, addComment } = useRequestComments(request.id);
  const [replyMessage, setReplyMessage] = useState('');
  const [actionRemarks, setActionRemarks] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState(request?.attachment?.url || null);

  useEffect(() => {
    let objectUrl = null;
    const fetchAttachment = async () => {
      if (request?.attachment?.id) {
        objectUrl = await getAttachmentUrl(request.attachment.id);
        if (objectUrl) setAttachmentUrl(objectUrl);
      }
    };
    fetchAttachment();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [request]);

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    addComment(request.id, currentUserStr, replyMessage);
    setReplyMessage('');
  };

  // Combine timeline and comments into a single threaded conversation
  const thread = [
    ...(request.timeline || []).map(t => ({ ...t, type: 'timeline', time: t.timestamp })),
    ...comments.map(c => ({ ...c, type: 'comment', time: c.timestamp }))
  ].sort((a, b) => a.time - b.time);

  const getTimelineIcon = (action) => {
    if (action === 'Approved') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (action === 'Rejected') return <XCircle className="w-4 h-4 text-red-500" />;
    if (action === 'Request Created') return <FileText className="w-4 h-4 text-blue-500" />;
    return <Clock className="w-4 h-4 text-neutral-500" />;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
      {/* Top Action Bar (Gmail Style) */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50">
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-600 dark:text-neutral-400"
            title="Back to list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="hidden sm:flex gap-2">
            {onDownload && (
              <button 
                onClick={onDownload}
                className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-600 dark:text-neutral-400"
                title="Download PDF"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            {onDelete && (
              <button 
                onClick={onDelete}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors text-red-600 dark:text-red-500"
                title="Delete Request"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md">
            {request.id}
          </span>
          <RequestStatusBadge status={request.status} />
          {/* Mobile More Options */}
          <button className="sm:hidden p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full text-neutral-600">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white dark:bg-neutral-900">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
          
          {/* Header & Subject */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
                request.priority === 'High' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                request.priority === 'Medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
              }`}>
                {request.priority} Priority
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md">
                {request.subcategory}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-normal text-neutral-900 dark:text-white leading-tight">
              {request.subject}
            </h1>
          </div>

          {/* Initial Request (First Email) */}
          <div className="flex gap-4">
            <div className="hidden sm:flex w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full items-center justify-center font-bold text-lg flex-shrink-0">
              {request.submittedBy.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                      {request.submittedBy}
                    </span>
                    <span className="text-xs text-neutral-500 truncate">
                      &lt;{request.userId}&gt;
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500">to institution</div>
                </div>
                <div className="text-xs text-neutral-500 flex-shrink-0">
                  {new Date(request.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>

              <div 
                className="prose dark:prose-invert max-w-none text-neutral-800 dark:text-neutral-200 text-sm sm:text-base"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(request.reason) }}
              />

              {request.startDate && (
                <div className="mt-4 inline-flex items-center gap-2 p-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-700 dark:text-neutral-300">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Requested Timeline:</span> 
                  {request.startDate} {request.endDate ? `to ${request.endDate}` : ''}
                </div>
              )}

              {/* Attachments */}
              {request.attachment && (
                <div className="mt-6 border-t border-neutral-100 dark:border-neutral-800 pt-4">
                  <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Attachments</div>
                  <a 
                    href={attachmentUrl || '#'} 
                    download={request.attachment.name}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-3 p-3 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:shadow-sm transition-all group max-w-sm"
                  >
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{request.attachment.name}</p>
                      <p className="text-xs text-neutral-500">Download</p>
                    </div>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Thread (Timeline + Comments) */}
          {thread.length > 1 && (
            <div className="space-y-6 mt-8 relative before:absolute before:inset-0 before:ml-5 sm:before:ml-9 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 dark:before:via-neutral-800 before:to-transparent">
              {thread.slice(1).map((item, idx) => {
                if (item.type === 'timeline') {
                  // Ignore redundant "Request Created" in thread since it's the main email above
                  if (item.action === 'Request Created') return null;
                  
                  return (
                    <div key={`tl-${idx}`} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white dark:border-neutral-900 bg-neutral-100 dark:bg-neutral-800 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ml-2 sm:ml-6 md:ml-0">
                        {getTimelineIcon(item.action)}
                      </div>
                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 shadow-sm ml-2 md:ml-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-neutral-900 dark:text-white">{item.stage} - {item.action}</span>
                          <span className="text-[10px] text-neutral-500">{new Date(item.time).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs text-neutral-500 mb-1">By {item.user}</div>
                        {item.remarks && <div className="text-sm text-neutral-700 dark:text-neutral-300 mt-2">{item.remarks}</div>}
                      </div>
                    </div>
                  );
                }

                if (item.type === 'comment') {
                  return (
                    <div key={`cm-${item.id}`} className="flex gap-4 relative z-10 ml-0 sm:ml-4 bg-white dark:bg-neutral-900">
                      <div className="hidden sm:flex w-10 h-10 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full items-center justify-center font-bold text-lg flex-shrink-0">
                        {item.user.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm bg-white dark:bg-neutral-950">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-bold text-neutral-900 dark:text-white text-sm">{item.user.split(' | ')[0]}</span>
                            <span className="text-xs text-neutral-500 ml-2">{new Date(item.time).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                        </div>
                        <div className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">{item.message}</div>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}

          {/* Action Area (For Faculty/Admin) */}
          {actions.length > 0 && (
            <div className="mt-8 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 sm:p-6">
              <h3 className="font-semibold text-sm mb-3">Review Actions</h3>
              <textarea 
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder="Add official remarks (optional)..."
                className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 min-h-[80px] mb-4 transition-colors"
              />
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {actions.map((act, idx) => (
                  <button 
                    key={idx}
                    onClick={() => act.onClick(actionRemarks)}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors
                      ${act.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                      ${act.color === 'red' ? 'bg-red-600 hover:bg-red-700' : ''}
                      ${act.color === 'amber' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                      ${act.color === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                      ${!['emerald','red','amber','indigo'].includes(act.color) ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    `}
                  >
                    {act.icon && <act.icon className="w-4 h-4" />}
                    {act.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reply Box */}
          <div className="mt-8 flex gap-4">
             <div className="hidden sm:flex w-10 h-10 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full items-center justify-center font-bold text-lg flex-shrink-0">
               {currentUserStr.charAt(0).toUpperCase()}
             </div>
             <form onSubmit={handleSendReply} className="flex-1 min-w-0 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors shadow-sm bg-white dark:bg-neutral-950">
               <textarea 
                 value={replyMessage}
                 onChange={(e) => setReplyMessage(e.target.value)}
                 placeholder="Click here to reply or add a comment..."
                 className="w-full bg-transparent p-4 text-sm outline-none resize-none min-h-[100px]"
               />
               <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
                 <button type="button" className="p-2 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors">
                   <Paperclip className="w-4 h-4" />
                 </button>
                 <button 
                   type="submit" 
                   disabled={!replyMessage.trim()}
                   className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                 >
                   <Send className="w-4 h-4" /> Send
                 </button>
               </div>
             </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RequestDetailView;
