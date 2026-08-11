import React, { useState } from 'react';
import { 
  Search, Filter, FileText, Clock, CheckCircle2, 
  XCircle, ChevronRight, Download, ArrowLeft, Building2, UserCircle2, ShieldAlert, Plus
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { jsPDF } from 'jspdf';
import { useRequests } from '../../hooks/useRequests';
import { useRequestWorkflow } from '../../hooks/useRequestWorkflow';
import RequestDetailView from '../../components/requests/RequestDetailView';
import RequestStatusBadge from '../../components/requests/RequestStatusBadge';
import { useNavigate } from 'react-router-dom';

const FacultyRequestsPage = () => {
  const { requests } = useRequests();
  const { approveRequest, rejectRequest, requestDocuments, forwardRequest } = useRequestWorkflow();
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('svcet_session_faculty')) || {};
  const userName = user.name || 'Faculty';
  const userId = user.facultyId || user.id || 'Unknown';
  const isHOD = user.isHOD || false;
  const userDepartment = user.department || 'Unknown';
  
  const userDetailsStr = `${userName} | ${userId}`;

  // Filter requests based on whether the user is an HOD or normal Faculty
  const pendingRequests = requests.filter(req => {
    // If specifically routed to this faculty's ID or email
    if (req.currentStage === user.facultyId || req.currentStage === user.id || req.currentStage === user.email) {
      return true;
    }
    
    // If user is HOD, they see requests currently at 'HOD' stage OR 'Faculty' stage (if they act as both)
    if (isHOD) {
      return req.currentStage === 'HOD' || req.currentStage === 'Faculty';
    }
    // Normal Faculty only sees 'Faculty' stage
    return req.currentStage === 'Faculty';
  }).sort((a, b) => b.createdAt - a.createdAt);

  const completedRequests = requests.filter(req => {
    // Show requests that this faculty member participated in (check timeline)
    return req.timeline && req.timeline.some(t => t.user === userDetailsStr);
  }).sort((a, b) => b.updatedAt - a.updatedAt);

  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' or 'History'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  const displayRequests = activeTab === 'Pending' ? pendingRequests : completedRequests;
  
  const filteredRequests = displayRequests.filter(req => {
    if (searchQuery && !req.subject.toLowerCase().includes(searchQuery.toLowerCase()) && !req.submittedBy.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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
    doc.text("SVCET Campus - Request Report", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Request: ${selectedRequest.subject}`, 20, 40);
    doc.setFont("helvetica", "normal");
    doc.text(`Status: ${selectedRequest.status}`, 20, 50);
    doc.text(`Category: ${selectedRequest.subcategory}`, 20, 60);
    doc.text(`Student: ${selectedRequest.submittedBy} (${selectedRequest.userId})`, 20, 70);
    const splitText = doc.splitTextToSize(extractText(selectedRequest.reason), 170);
    doc.text("Description:", 20, 85);
    doc.text(splitText, 20, 95);
    doc.save(`Request_${selectedRequest.id}.pdf`);
  };

  const handleAction = (actionType, remarks = '') => {
    if (!selectedRequest) return;
    
    if (actionType === 'Approve') {
      approveRequest(selectedRequest.id, selectedRequest.currentStage, selectedRequest.workflow, userDetailsStr, remarks);
    } else if (actionType === 'Reject') {
      rejectRequest(selectedRequest.id, selectedRequest.currentStage, userDetailsStr, remarks);
    } else if (actionType === 'RequestDocs') {
      requestDocuments(selectedRequest.id, selectedRequest.currentStage, userDetailsStr, remarks);
    }
    
    setSelectedRequest(null);
  };

  if (selectedRequest) {
    const canTakeAction = activeTab === 'Pending' && selectedRequest.status !== 'Approved' && selectedRequest.status !== 'Rejected';
    
    const actions = canTakeAction ? [
      { label: 'Approve & Forward', icon: CheckCircle2, color: 'emerald', onClick: (remarks) => handleAction('Approve', remarks) },
      { label: 'Reject', icon: XCircle, color: 'red', onClick: (remarks) => handleAction('Reject', remarks) },
      { label: 'Ask for Documents', icon: ShieldAlert, color: 'amber', onClick: (remarks) => handleAction('RequestDocs', remarks) }
    ] : [];

    return (
      <div className="h-[calc(100vh-140px)] w-full">
        <RequestDetailView 
          request={selectedRequest}
          onBack={() => setSelectedRequest(null)}
          onDownload={handleDownloadLetter}
          actions={actions}
          currentUserStr={userDetailsStr}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Request Reviews</h1>
          <p className="text-neutral-500">
            {isHOD ? `Manage department requests for ${userDepartment}` : 'Review requests assigned to you.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isHOD && (
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-bold">
              <Building2 className="w-4 h-4" /> HOD Access Active
            </div>
          )}
          <button 
            onClick={() => navigate('/faculty/requests/create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" /> New Request
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Pending My Review', value: pendingRequests.length, icon: Clock, color: 'amber' },
          { label: 'Completed Reviews', value: completedRequests.length, icon: CheckCircle2, color: 'emerald' },
          { label: 'Total Handled', value: pendingRequests.length + completedRequests.length, icon: FileText, color: 'blue' },
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

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-4 items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/30">
          <div className="flex bg-neutral-100 dark:bg-neutral-950 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('Pending')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'Pending' ? 'bg-white dark:bg-neutral-800 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            >
              Needs Review
            </button>
            <button 
              onClick={() => setActiveTab('History')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'History' ? 'bg-white dark:bg-neutral-800 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            >
              History
            </button>
          </div>
          
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search by student or subject..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400">
              <CheckCircle2 className="w-12 h-12 mb-4 text-emerald-500 opacity-50" />
              <p>You're all caught up! No requests need your attention.</p>
            </div>
          ) : (
            filteredRequests.map(req => (
              <div 
                key={req.id} 
                onClick={() => setSelectedRequest(req)}
                className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer group hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-lg">
                    {req.submittedBy.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">{req.subject}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 font-medium">
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">{req.submittedBy}</span>
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyRequestsPage;
