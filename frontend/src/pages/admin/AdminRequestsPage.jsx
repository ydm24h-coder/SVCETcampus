import React, { useState } from 'react';
import { 
  Search, FileText, CheckCircle2, XCircle, ChevronRight, Download, 
  ArrowLeft, Settings, BarChart3, ListTodo, Plus, Trash2, Edit, Clock
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { jsPDF } from 'jspdf';
import { useRequests } from '../../hooks/useRequests';
import { useRequestWorkflow } from '../../hooks/useRequestWorkflow';
import { useRequestCategories } from '../../hooks/useRequestCategories';
import { useRequestAnalytics } from '../../hooks/useRequestAnalytics';
import RequestDetailView from '../../components/requests/RequestDetailView';
import RequestStatusBadge from '../../components/requests/RequestStatusBadge';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const AdminRequestsPage = () => {
  const { requests, deleteRequests } = useRequests();
  const { categories, addCategory, deleteCategory } = useRequestCategories();
  const { getAnalytics } = useRequestAnalytics();
  const { approveRequest, rejectRequest } = useRequestWorkflow();
  
  const user = JSON.parse(localStorage.getItem('svcet_session_admin')) || {};
  const userName = user.name || 'Admin';
  const userId = user.adminId || user.id || 'Unknown';
  const userDetailsStr = `${userName} | ${userId}`;

  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Analytics', 'Settings'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  const analyticsData = getAnalytics();

  const filteredRequests = requests.filter(req => {
    if (searchQuery && !req.subject.toLowerCase().includes(searchQuery.toLowerCase()) && !req.submittedBy.toLowerCase().includes(searchQuery.toLowerCase()) && !req.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.createdAt - a.createdAt);

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
    doc.save(`Admin_Report_${selectedRequest.id}.pdf`);
  };

  const handleAction = (actionType, remarks = '') => {
    if (!selectedRequest) return;
    
    if (actionType === 'Approve') {
      approveRequest(selectedRequest.id, selectedRequest.currentStage, selectedRequest.workflow, userDetailsStr, remarks);
    } else if (actionType === 'Reject') {
      rejectRequest(selectedRequest.id, selectedRequest.currentStage, userDetailsStr, remarks);
    }
    
    setSelectedRequest(null);
  };

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: analyticsData.totalRequests, icon: ListTodo, color: 'blue' },
          { label: 'Pending', value: analyticsData.pending, icon: Clock, color: 'amber' },
          { label: 'Approved', value: analyticsData.approved, icon: CheckCircle2, color: 'emerald' },
          { label: 'Rejected', value: analyticsData.rejected, icon: XCircle, color: 'red' },
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm h-80">
          <h3 className="font-bold text-lg mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData.categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" />
              <YAxis dataKey="name" type="category" width={100} stroke="#9CA3AF" />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff'}} />
              <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col items-center justify-center text-center h-80">
          <h3 className="font-bold text-lg mb-4 w-full text-left">Approval Rate Overview</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Approved', value: analyticsData.approved, color: '#10B981' },
                  { name: 'Rejected', value: analyticsData.rejected, color: '#EF4444' },
                  { name: 'Pending', value: analyticsData.pending, color: '#F59E0B' }
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {[
                  { name: 'Approved', value: analyticsData.approved, color: '#10B981' },
                  { name: 'Rejected', value: analyticsData.rejected, color: '#EF4444' },
                  { name: 'Pending', value: analyticsData.pending, color: '#F59E0B' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff'}} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center justify-center pointer-events-none mt-6">
            <span className="text-3xl font-bold">{analyticsData.approvalRate}%</span>
            <span className="text-xs text-neutral-500">Approved</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50">
        <div>
          <h3 className="font-bold text-lg">Request Categories</h3>
          <p className="text-sm text-neutral-500">Configure categories, subcategories, and their default workflows.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {categories.map(cat => (
          <div key={cat.id} className="p-6 flex items-start justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-bold text-lg">{cat.name}</span>
                <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs rounded-md font-mono">{cat.id}</span>
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-md font-bold">SLA: {cat.slaDays} Days</span>
              </div>
              <p className="text-sm text-neutral-500 mb-3"><span className="font-medium text-neutral-700 dark:text-neutral-300">Subcategories:</span> {cat.subcategories.join(', ')}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">Workflow:</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">Student</span>
                  {cat.defaultWorkflow.map(step => (
                    <React.Fragment key={step}>
                      <ChevronRight className="w-3 h-3 text-neutral-400" />
                      <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">{step}</span>
                    </React.Fragment>
                  ))}
                  <ChevronRight className="w-3 h-3 text-neutral-400" />
                  <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded">Admin/Completed</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
              <button onClick={() => deleteCategory(cat.id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (selectedRequest) {
    const canTakeAction = selectedRequest.status !== 'Approved' && selectedRequest.status !== 'Rejected';
    
    const actions = canTakeAction ? [
      { label: 'Force Approve', icon: CheckCircle2, color: 'indigo', onClick: (remarks) => handleAction('Approve', remarks) },
      { label: 'Force Reject', icon: XCircle, color: 'red', onClick: (remarks) => handleAction('Reject', remarks) }
    ] : [];

    return (
      <div className="h-[calc(100vh-140px)] w-full">
        <RequestDetailView 
          request={selectedRequest}
          onBack={() => setSelectedRequest(null)}
          onDownload={handleDownloadLetter}
          onDelete={() => { deleteRequests([selectedRequest.id]); setSelectedRequest(null); }}
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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Request Management</h1>
          <p className="text-neutral-500">Monitor all institutional requests, configure workflows, and generate reports.</p>
        </div>
      </div>

      <div className="flex bg-white dark:bg-neutral-900 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 w-fit">
        {[
          { id: 'All', label: 'All Requests', icon: ListTodo },
          { id: 'Analytics', label: 'Analytics & Reports', icon: BarChart3 },
          { id: 'Settings', label: 'Settings & Categories', icon: Settings },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'All' && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-4 items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/30">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Search by ID, subject, or student name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="text-sm font-medium text-neutral-500">
              Showing {filteredRequests.length} requests
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p>No requests found matching your search.</p>
              </div>
            ) : (
              filteredRequests.map(req => (
                <div 
                  key={req.id} 
                  onClick={() => setSelectedRequest(req)}
                  className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer group hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-500 font-bold font-mono text-[10px]">
                      {req.id.replace('REQ-', '')}
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">{req.subject}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 font-medium">
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">{req.submittedBy}</span>
                        <span>•</span>
                        <span>{req.subcategory}</span>
                        <span>•</span>
                        <span>Current Stage: <span className="text-blue-600 dark:text-blue-400 font-bold">{req.currentStage}</span></span>
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
      )}

      {activeTab === 'Analytics' && renderAnalytics()}
      {activeTab === 'Settings' && renderSettings()}
    </div>
  );
};

export default AdminRequestsPage;
