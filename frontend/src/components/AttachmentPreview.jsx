import React, { useState } from 'react';
import { Download, FileText, Image as ImageIcon, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const AttachmentPreview = ({ attachment, attachmentName, onDownload }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!attachment) return null;

  const isImage = attachment.startsWith('data:image/');
  const isPdf = attachment.startsWith('data:application/pdf');

  return (
    <>
      <div 
        onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
        className="mt-4 flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white/50 dark:bg-neutral-900/30 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors shadow-sm"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg shrink-0">
            {isImage ? <ImageIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate text-neutral-800 dark:text-neutral-200">
              {attachmentName || 'Attachment'}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-medium">
              Click to view document
            </span>
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-5xl h-[85vh] p-0 flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 rounded-2xl" onClick={(e) => e.stopPropagation()}>
          <DialogTitle className="sr-only">Document Viewer</DialogTitle>
          
          {/* Header bar mimicking Document Reader */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-sm shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              {isImage ? <ImageIcon className="w-5 h-5 text-indigo-500 shrink-0" /> : <FileText className="w-5 h-5 text-emerald-500 shrink-0" />}
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                {attachmentName || 'Document Viewer'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDownload) onDownload(attachment, attachmentName);
                }}
                className="flex items-center border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Download className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>
          
          {/* Document Display Area */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-neutral-200/50 dark:bg-neutral-950/50">
            {isImage ? (
              <img 
                src={attachment} 
                alt={attachmentName} 
                className="max-w-full max-h-full object-contain rounded shadow-md bg-white dark:bg-neutral-900"
              />
            ) : isPdf ? (
              <iframe 
                src={attachment} 
                title={attachmentName}
                className="w-full h-full border-0 bg-white dark:bg-neutral-900 rounded shadow-md"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-neutral-400 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 w-full max-w-md">
                <FileText className="w-16 h-16 mb-4 opacity-50 text-indigo-300" />
                <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300">Preview not available</p>
                <p className="text-sm text-neutral-500 mt-2 text-center">This file type cannot be previewed directly in the browser.</p>
                <Button 
                  className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDownload) onDownload(attachment, attachmentName);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" /> Download File
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AttachmentPreview;
