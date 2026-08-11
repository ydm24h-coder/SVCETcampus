import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, FileText, Clock, CheckCircle2, 
  XCircle, ChevronRight, Download, Paperclip, ArrowLeft,
  Briefcase, BookOpen, Library, CreditCard, Bus, Home, Laptop, Wrench
} from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import { jsPDF } from 'jspdf';
import { useRequests } from '../../hooks/useRequests';
import { useRequestCategories } from '../../hooks/useRequestCategories';
import RequestDetailView from '../../components/requests/RequestDetailView';
import RequestStatusBadge from '../../components/requests/RequestStatusBadge';
import { useNavigate } from 'react-router-dom';

const getCategoryIcon = (iconName) => {
  const icons = { BookOpen, Briefcase, Library, CreditCard, Bus, Home, Laptop, Wrench, FileText };
  const Icon = icons[iconName] || FileText;
  return <Icon className="w-5 h-5" />;
};

const StudentRequestsPage = () => {
  const { requests, addRequest } = useRequests();
  const { categories } = useRequestCategories();
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('svcet_session_student')) || {};
  const userName = user.name || 'Student';
  const userId = user.registerNumber || user.id || 'Unknown';
  
  // My requests only
  const myRequests = requests.filter(req => req.userRole === 'Student' && req.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const filteredRequests = myRequests.filter(req => {
    if (filterStatus !== 'All' && req.status !== filterStatus) return false;
    if (searchQuery && !(req.subject || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });


  const extractText = (html) => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  };

  const handleDownloadLetter = () => {
    if (!selectedRequest) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("SVCET Campus - Official Document", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Request: ${selectedRequest.subject}`, 20, 40);
    doc.setFont("helvetica", "normal");
    doc.text(`Status: ${selectedRequest.status}`, 20, 50);
    doc.text(`Category: ${selectedRequest.subcategory}`, 20, 60);
    doc.text(`Student: ${selectedRequest.submittedBy} (${selectedRequest.userId})`, 20, 70);
    const splitText = doc.splitTextToSize(extractText(selectedRequest.reason), 170);
    doc.text("Description:", 20, 85);
    doc.text(splitText, 20, 95);
    
    if (selectedRequest.reply) {
      const finalY = 95 + (splitText.length * 6) + 15;
      doc.text("Official Reply:", 20, finalY);
      doc.text(selectedRequest.reply, 20, finalY + 10);
    }
    doc.save(`Request_${selectedRequest.id}.pdf`);
  };

  if (selectedRequest) {
    return (
      <div className="h-[calc(100vh-140px)] w-full">
        <RequestDetailView 
          request={selectedRequest}
          onBack={() => setSelectedRequest(null)}
          onDownload={selectedRequest.status === 'Approved' ? handleDownloadLetter : undefined}
          currentUserStr={`${userName} | ${userId}`}
        />
      </div>
    );
  }



  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Service Requests</h1>
          <p className="text-neutral-500">Track and manage your institutional requests digitally.</p>
        </div>
          <button 
            onClick={() => navigate('/student/requests/create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" /> New Request
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: myRequests.length, icon: FileText, color: 'blue' },
          { label: 'Pending', value: myRequests.filter(r => ['Submitted', 'Under Review'].includes(r.status)).length, icon: Clock, color: 'amber' },
          { label: 'Approved', value: myRequests.filter(r => r.status === 'Approved').length, icon: CheckCircle2, color: 'emerald' },
          { label: 'Rejected', value: myRequests.filter(r => r.status === 'Rejected').length, icon: XCircle, color: 'red' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-${stat.color}-100 text-${stat.color}-600 dark:bg-${stat.color}-900/30 dark:text-${stat.color}-400`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & List */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-4 items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/30">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search requests..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex gap-2 items-center">
            <Filter className="w-4 h-4 text-neutral-500" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm outline-none font-medium">
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400">
              <FileText className="w-12 h-12 mb-4 opacity-20" />
              <p>No requests found matching your filters.</p>
            </div>
          ) : (
            filteredRequests.map(req => {
              const cat = categories.find(c => c.id === req.categoryId);
              return (
                <div 
                  key={req.id} 
                  onClick={() => setSelectedRequest(req)}
                  className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer group hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-600 dark:text-neutral-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      {cat ? getCategoryIcon(cat.icon) : <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">{req.subject}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 font-medium">
                        <span className="font-mono">{req.id}</span>
                        <span>•</span>
                        <span>{req.subcategory}</span>
                        <span>•</span>
                        <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <RequestStatusBadge status={req.status} />
                    <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentRequestsPage;
