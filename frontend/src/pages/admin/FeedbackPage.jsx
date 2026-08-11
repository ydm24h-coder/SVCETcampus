import React, { useState } from 'react';
import { MessageSquare, Filter, CheckCircle, Clock, XCircle, Search, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFeedback } from '@/hooks/useFeedback';

const AdminFeedbackPage = () => {
  const { feedbacks, updateFeedbackStatus, deleteFeedback } = useFeedback();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending': return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'In Progress': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20"><Clock className="w-3 h-3 mr-1" /> In Progress</Badge>;
      case 'Resolved': return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20"><CheckCircle className="w-3 h-3 mr-1" /> Resolved</Badge>;
      case 'Rejected': return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesSearch = f.authorName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facility & Feedback Requests</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Review and manage facility requests and feedback from students and faculty.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input 
            placeholder="Search by name, type, or message..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white dark:bg-neutral-900/50"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-neutral-500" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-10 w-[180px] items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-900/50"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
        <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <CardTitle className="text-lg font-medium flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-indigo-500" />
            Feedback Submissions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredFeedbacks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-200 dark:border-neutral-800">
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[180px]">Reporter</TableHead>
                  <TableHead className="w-[200px]">Type</TableHead>
                  <TableHead>Message / Request</TableHead>
                  <TableHead className="w-[150px] text-center">Status</TableHead>
                  <TableHead className="w-[160px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedbacks.map((item) => (
                  <TableRow key={item.id} className="border-neutral-200 dark:border-neutral-800">
                    <TableCell className="text-sm text-neutral-500">{item.date}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.authorName}</div>
                      <div className="text-xs text-neutral-500">{item.authorRole} • {item.authorId}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-neutral-100 dark:bg-neutral-800">{item.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="truncate text-sm" title={item.message}>{item.message}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select 
                          value={item.status} 
                          onChange={(e) => updateFeedbackStatus(item.id, e.target.value)}
                          className="flex h-8 w-full max-w-[120px] items-center justify-between rounded-md border border-input bg-white px-3 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-900/50"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this feedback?')) {
                              deleteFeedback(item.id);
                            }
                          }}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Delete Feedback"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <MessageSquare className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">No Feedback Found</h3>
              <p className="text-neutral-500 mt-1">There are no feedback or facility requests matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFeedbackPage;
