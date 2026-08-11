import React, { useState } from 'react';
import { X, Paperclip, Send, FileText, Maximize2, Minimize2 } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { saveAttachment } from '../../utils/indexedDB';

const RequestComposeBox = ({ categories, onClose, onSubmit }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    subcategory: '',
    subject: '',
    reason: '',
    startDate: '',
    endDate: '',
    priority: 'Low',
    attachment: null
  });

  const selectedCategory = categories.find(c => c.id === formData.categoryId);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileId = `FILE-${crypto.randomUUID()}`;
      try {
        await saveAttachment(fileId, file, file.name);
        setFormData(prev => ({ 
          ...prev, 
          attachment: { 
            id: fileId, 
            name: file.name, 
            size: file.size, 
            type: file.type 
          } 
        }));
      } catch (error) {
        console.error("Failed to save file to IndexedDB:", error);
        alert("Failed to attach file. It might be too large.");
      }
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.subcategory || !formData.subject || !formData.reason) {
      alert("Please fill all required fields (Category, Type, Subject, Reason).");
      return;
    }
    
    onSubmit({
      ...formData,
      workflow: selectedCategory ? selectedCategory.defaultWorkflow : ['Faculty', 'HOD']
    });
  };

  return (
    <div className={`fixed z-[100] bottom-0 right-4 sm:right-24 w-[calc(100%-2rem)] sm:w-[500px] md:w-[600px] bg-white dark:bg-neutral-900 rounded-t-xl shadow-[0_0_40px_rgba(0,0,0,0.2)] dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-neutral-200 dark:border-neutral-800 transition-all duration-300 flex flex-col ${isMinimized ? 'h-12' : 'h-[600px] max-h-[80vh]'}`}>
      
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-neutral-900 dark:bg-black rounded-t-xl cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <span className="text-white font-medium text-sm">New Request</span>
        <div className="flex items-center gap-3">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {!isMinimized && (
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-neutral-900">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            
            {/* Inline Fields */}
            <div className="border-b border-neutral-100 dark:border-neutral-800 px-4 py-2 flex items-center gap-2">
              <span className="text-sm text-neutral-500 w-24">Category</span>
              <select 
                value={formData.categoryId}
                onChange={e => setFormData(prev => ({...prev, categoryId: e.target.value, subcategory: ''}))}
                className="flex-1 bg-transparent text-sm outline-none text-neutral-900 dark:text-white font-medium"
              >
                <option value="">Select a category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="border-b border-neutral-100 dark:border-neutral-800 px-4 py-2 flex items-center gap-2">
              <span className="text-sm text-neutral-500 w-24">Type</span>
              <select 
                value={formData.subcategory}
                onChange={e => setFormData(prev => ({...prev, subcategory: e.target.value}))}
                className="flex-1 bg-transparent text-sm outline-none text-neutral-900 dark:text-white font-medium"
                disabled={!formData.categoryId}
              >
                <option value="">Specific request type...</option>
                {selectedCategory?.subcategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div className="border-b border-neutral-100 dark:border-neutral-800 px-4 py-2 flex items-center gap-2">
              <span className="text-sm text-neutral-500 w-24">Subject</span>
              <input 
                type="text"
                value={formData.subject}
                onChange={e => setFormData(prev => ({...prev, subject: e.target.value}))}
                placeholder="Brief summary"
                className="flex-1 bg-transparent text-sm outline-none text-neutral-900 dark:text-white font-medium"
              />
            </div>

            <div className="border-b border-neutral-100 dark:border-neutral-800 px-4 py-2 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-neutral-500 w-24">Start Date</span>
                <input type="date" value={formData.startDate} onChange={e => setFormData(prev => ({...prev, startDate: e.target.value}))} className="flex-1 bg-transparent text-sm outline-none text-neutral-900 dark:text-white" />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-neutral-500 w-16">End Date</span>
                <input type="date" value={formData.endDate} onChange={e => setFormData(prev => ({...prev, endDate: e.target.value}))} className="flex-1 bg-transparent text-sm outline-none text-neutral-900 dark:text-white" />
              </div>
            </div>

            <div className="border-b border-neutral-100 dark:border-neutral-800 px-4 py-2 flex items-center gap-2">
              <span className="text-sm text-neutral-500 w-24">Priority</span>
              <select 
                value={formData.priority}
                onChange={e => setFormData(prev => ({...prev, priority: e.target.value}))}
                className="flex-1 bg-transparent text-sm outline-none text-neutral-900 dark:text-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-[250px]">
              <ReactQuill 
                theme="snow" 
                value={formData.reason} 
                onChange={val => setFormData(prev => ({...prev, reason: val}))} 
                placeholder="Write your detailed reason here..."
                className="h-full bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white [&>.ql-toolbar]:border-none [&>.ql-toolbar]:border-b [&>.ql-toolbar]:border-neutral-100 dark:[&>.ql-toolbar]:border-neutral-800 [&>.ql-container]:border-none border-none" 
              />
            </div>
            
            {/* Attachment preview */}
            {formData.attachment && (
              <div className="px-4 py-2 flex items-center gap-3 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg max-w-full">
                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300 truncate">
                    {formData.attachment.name}
                  </span>
                  <button onClick={() => setFormData(prev => ({...prev, attachment: null}))} className="text-blue-400 hover:text-blue-600 ml-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Toolbar */}
          <div className="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-4">
            <button 
              onClick={handleSend}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              Send <Send className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-2">
              <label className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full cursor-pointer text-neutral-500 transition-colors">
                <Paperclip className="w-5 h-5" />
                <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleFileChange} />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestComposeBox;
