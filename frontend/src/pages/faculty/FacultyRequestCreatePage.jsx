import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Paperclip, Send, FileText } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { saveAttachment } from '../../utils/indexedDB';
import { useRequests } from '../../hooks/useRequests';
import { useRequestCategories } from '../../hooks/useRequestCategories';

const FacultyRequestCreatePage = () => {
  const navigate = useNavigate();
  const { addRequest } = useRequests();
  const { categories } = useRequestCategories();

  const user = JSON.parse(localStorage.getItem('svcet_session_faculty')) || {};
  const userName = user.name || 'Faculty';
  const userId = user.facultyId || user.id || 'Unknown';

  const [formData, setFormData] = useState({
    categoryId: '',
    subcategory: '',
    subject: '',
    reason: '',
    startDate: '',
    endDate: '',
    priority: 'Low',
    attachment: null,
    toRole: 'Admin',
    toSpecificId: ''
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
    
    const finalTo = formData.toRole === 'Specific ID / Email' ? formData.toSpecificId : formData.toRole;
    if (formData.toRole === 'Specific ID / Email' && !formData.toSpecificId) {
      alert("Please enter the specific ID or Email.");
      return;
    }

    addRequest({
      ...formData,
      workflow: finalTo ? [finalTo] : (selectedCategory ? selectedCategory.defaultWorkflow : ['HOD', 'Admin']),
      submittedBy: userName,
      userId: userId,
      userRole: 'Faculty',
      from: `${userName} | ${userId}`,
      to: finalTo || 'Default Workflow'
    });

    navigate('/faculty/requests');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/faculty/requests')}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">New Faculty Request</h1>
            <p className="text-sm text-neutral-500">Submit requests directly to Administration or HODs.</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 md:p-8 space-y-6 flex-1">
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">To (Direct Recipient)</label>
            <select 
              value={formData.toRole}
              onChange={e => setFormData(prev => ({...prev, toRole: e.target.value}))}
              className="w-full p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-blue-500 transition-colors"
            >
              <option value="Admin">Admin</option>
              <option value="HOD">HOD</option>
              <option value="Principal">Principal</option>
              <option value="Specific ID / Email">Specific ID / Email</option>
            </select>
            {formData.toRole === 'Specific ID / Email' && (
              <input 
                type="text"
                placeholder="Enter Recipient ID or Email (e.g. HOD123 or admin@svcet.edu)"
                value={formData.toSpecificId}
                onChange={e => setFormData(prev => ({...prev, toSpecificId: e.target.value}))}
                className="w-full mt-3 p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-blue-500 transition-colors"
              />
            )}
            <p className="text-xs text-neutral-500 mt-1">Select who should directly receive this request.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Category *</label>
              <select 
                value={formData.categoryId}
                onChange={e => setFormData(prev => ({...prev, categoryId: e.target.value, subcategory: ''}))}
                className="w-full p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">Select a category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Request Type *</label>
              <select 
                value={formData.subcategory}
                onChange={e => setFormData(prev => ({...prev, subcategory: e.target.value}))}
                disabled={!formData.categoryId}
                className="w-full p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
              >
                <option value="">Select a type...</option>
                {selectedCategory?.subcategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Subject *</label>
            <input 
              type="text"
              placeholder="Brief subject of your request"
              value={formData.subject}
              onChange={e => setFormData(prev => ({...prev, subject: e.target.value}))}
              className="w-full p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-blue-500 transition-colors font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Start Date (Optional)</label>
              <input 
                type="date"
                value={formData.startDate}
                onChange={e => setFormData(prev => ({...prev, startDate: e.target.value}))}
                className="w-full p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">End Date (Optional)</label>
              <input 
                type="date"
                value={formData.endDate}
                onChange={e => setFormData(prev => ({...prev, endDate: e.target.value}))}
                className="w-full p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2 flex-1">
            <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Description / Reason *</label>
            <div className="h-64 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors">
              <ReactQuill 
                theme="snow"
                value={formData.reason}
                onChange={val => setFormData(prev => ({...prev, reason: val}))}
                className="h-[calc(100%-42px)] border-none"
                placeholder="Write your detailed request here..."
              />
            </div>
          </div>

          {/* Attachment Preview */}
          {formData.attachment && (
            <div className="inline-flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 rounded-xl mt-4">
              <FileText className="w-5 h-5" />
              <span className="text-sm font-medium truncate max-w-[200px]">{formData.attachment.name}</span>
              <button 
                type="button"
                onClick={() => setFormData(prev => ({...prev, attachment: null}))}
                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded-full"
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl text-neutral-600 dark:text-neutral-300 transition-colors">
            <Paperclip className="w-5 h-5" />
            <span className="text-sm font-medium">Attach File</span>
            <input type="file" className="hidden" onChange={handleFileChange} />
          </label>
          
          <button 
            onClick={handleSend}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            Submit Request <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacultyRequestCreatePage;
