import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, Trash2, Edit, File as FileIcon, CheckCircle2, Loader2, ExternalLink, Eye, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMaterials } from '@/hooks/useMaterials';
import { useNotices } from '@/hooks/useNotices';
import { saveFileContent, getFileContent } from '@/utils/fileStorage';

const MaterialsPage = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [previewMaterial, setPreviewMaterial] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);

  // Upload State
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState('');
  
  const fileInputRef = useRef(null);
  const uploadIntervalRef = useRef(null);

  const { materials, addMaterial, updateMaterial, deleteMaterial } = useMaterials();
  const { addNotice } = useNotices();

  const handleDelete = (id) => deleteMaterial(id);

  const handleEditClick = (mat) => {
    setEditingMaterial(mat);
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    updateMaterial(editingMaterial.id, editingMaterial);
    
    const sessionUser = JSON.parse(localStorage.getItem('svcet_session_faculty'));
    addNotice({
      title: 'Material Updated',
      content: `The material "${editingMaterial.title}" for ${editingMaterial.course} has been updated.`,
      authorName: sessionUser ? sessionUser.name : 'Faculty',
      authorRole: 'Faculty',
      pinned: false
    });
    
    setIsEditOpen(false);
  };

  // Drag and Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file) => {
    if (file.size > 1024 * 1024 * 1024) { // 1GB
      alert("File is too large! Maximum allowed size is 1GB.");
      return;
    }
    setSelectedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
    if (!newTitle) {
      // Auto-fill title from filename without extension
      setNewTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);

    const matId = Date.now();

    try {
      // Save file directly to IndexedDB to easily support files up to 1GB without crashing
      await saveFileContent(matId, selectedFile);
      
      // Simulate file upload progress for UX
      uploadIntervalRef.current = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(uploadIntervalRef.current);
            completeUpload(matId);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    } catch (err) {
      console.error("Storage Error:", err);
      alert("Failed to save the file. You might be out of disk space.");
      handleCancelUpload();
    }
  };

  const handleCancelUpload = () => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
    }
    setIsUploading(false);
    setUploadProgress(0);
  };

  const completeUpload = (matId) => {
    setTimeout(() => {
      try {
        const ext = selectedFile.name.split('.').pop().toUpperCase();
        const title = newTitle || selectedFile.name;
        const course = newCourse || 'General';

        addMaterial({
          id: matId,
          title,
          course,
          type: ext,
          size: (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          mimeType: selectedFile.type,
          hasRealFile: true
        });
        
        const sessionUser = JSON.parse(localStorage.getItem('svcet_session_faculty'));
        
        addNotice({
          title: `New Material Uploaded`,
          content: `A new material "${title}" has been uploaded for ${course}. You can access it in the Materials module.`,
          authorName: sessionUser ? sessionUser.name : 'Faculty',
          authorRole: 'Faculty',
          pinned: false
        });
        
        // Reset
        setIsUploading(false);
        setUploadProgress(0);
        setSelectedFile(null);
        setFilePreviewUrl(null);
        setNewTitle('');
        setNewCourse('');
        setIsUploadOpen(false);
      } catch (error) {
        console.error("Upload Error:", error);
        alert("Upload failed. Browser storage might be full (Quota Exceeded). Please delete some old materials or try a smaller file.");
        handleCancelUpload();
      }
    }, 500);
  };

  const handlePreview = async (material) => {
    if (material.hasRealFile) {
      const fileBlob = await getFileContent(material.id);
      if (fileBlob) {
        const url = URL.createObjectURL(fileBlob);
        setPreviewMaterial({ ...material, contentUrl: url });
      } else {
        alert("File not found in local storage.");
      }
    } else {
      setPreviewMaterial(material);
    }
  };

  const handleDownload = async (material) => {
    const a = document.createElement('a');
    if (material.hasRealFile) {
      const fileBlob = await getFileContent(material.id);
      if (fileBlob) {
        const url = URL.createObjectURL(fileBlob);
        a.href = url;
        a.download = `${material.title.replace(/\s+/g, '_')}.${material.type.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert("File not found in local storage.");
      }
    } else {
      const content = `Mock content for ${material.title}\nCourse: ${material.course}\nType: ${material.type}\nDownloaded from SVCETcampus.`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      a.href = url;
      const extension = material.type ? material.type.toLowerCase() : 'txt';
      a.download = `${material.title.replace(/\s+/g, '_')}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Materials</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Upload documents and resources for your students.</p>
        </div>

        <Dialog open={isUploadOpen} onOpenChange={(open) => {
          if(!isUploading) setIsUploadOpen(open);
        }}>
          <DialogTrigger render={
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <UploadCloud className="w-4 h-4 mr-2" /> Upload Material
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <DialogHeader>
              <DialogTitle>Upload New Resource</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label>Document Title</Label>
                <Input 
                  placeholder="e.g. Chapter 4 Notes" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  disabled={isUploading}
                />
              </div>
              <div className="grid gap-2">
                <Label>Target Course</Label>
                <Input 
                  placeholder="e.g. Data Structures" 
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  disabled={isUploading}
                />
              </div>

              {/* Drag and Drop Zone */}
              <div 
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all relative
                  ${dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}
                  ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                
                {selectedFile ? (
                  <div className="flex flex-col items-center text-center">
                    <CheckCircle2 className="w-10 h-10 mb-2 text-green-500" />
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate max-w-[200px]">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs mt-1 text-neutral-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    {!isUploading && (
                      <span className="text-xs text-indigo-500 mt-3 font-medium hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                        Click to change file
                      </span>
                    )}
                    {filePreviewUrl && !isUploading && (
                      <div className="mt-4 p-2 border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-900 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {selectedFile.type.startsWith('image/') ? (
                          <img src={filePreviewUrl} alt="Preview" className="max-h-32 object-contain" />
                        ) : selectedFile.type === 'application/pdf' ? (
                          <iframe src={filePreviewUrl} title="Preview" className="w-full h-32 border-0" />
                        ) : (
                          <div className="text-xs text-neutral-500 italic py-4">Preview not available for this file type.</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <FileIcon className={`w-10 h-10 mb-3 ${dragActive ? 'text-indigo-600' : 'text-indigo-400'}`} />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Click to browse or drag file here
                    </span>
                    <span className="text-xs mt-1 text-neutral-500">Supports PDF, PPTX, DOCX, ZIP (Max 1GB)</span>
                  </>
                )}
              </div>

              {/* Progress Bar */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="flex items-center text-indigo-600 dark:text-indigo-400">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Uploading...
                    </span>
                    <span className="flex items-center gap-2">
                      {uploadProgress}%
                      <Button variant="ghost" size="sm" className="h-5 px-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleCancelUpload}>
                        Cancel
                      </Button>
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-200 ease-out" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button 
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50" 
                onClick={handleUploadSubmit}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload File'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* EDIT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle>Edit Material Details</DialogTitle>
          </DialogHeader>
          {editingMaterial && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Document Title</Label>
                <Input 
                  value={editingMaterial.title} 
                  onChange={(e) => setEditingMaterial({...editingMaterial, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Target Course</Label>
                <Input 
                  value={editingMaterial.course} 
                  onChange={(e) => setEditingMaterial({...editingMaterial, course: e.target.value})}
                />
              </div>
              <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 mt-6">
        {materials.length > 0 ? materials.map((mat) => (
          <Card key={mat.id} className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start sm:items-center justify-between pb-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">{mat.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{mat.course}</span>
                    <span>•</span>
                    <span>{mat.type}</span>
                    <span>•</span>
                    <span>{mat.size}</span>
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <Button variant="ghost" size="icon" title="Preview" onClick={() => handlePreview(mat)}>
                  <Eye className="w-4 h-4 text-neutral-500 hover:text-indigo-600" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEditClick(mat)}>
                  <Edit className="w-4 h-4 sm:mr-2" /> 
                  <span className="hidden sm:inline">Edit</span>
                </Button>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => handleDelete(mat.id)} title="Delete file">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        )) : (
          <div className="p-12 text-center text-neutral-500 border border-dashed rounded-xl border-neutral-300 dark:border-neutral-800 flex flex-col items-center">
            <FileText className="w-12 h-12 mb-4 text-neutral-400" />
            <p>No materials uploaded yet.</p>
          </div>
        )}
      </div>

      {/* PREVIEW MODAL */}
      <Dialog open={!!previewMaterial} onOpenChange={(open) => !open && setPreviewMaterial(null)}>
        <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-xl">{previewMaterial?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-neutral-100 dark:bg-neutral-950 rounded-lg overflow-hidden flex items-center justify-center relative mt-2">
            {previewMaterial?.contentUrl ? (
              previewMaterial.mimeType?.startsWith('image/') ? (
                <img src={previewMaterial.contentUrl} alt={previewMaterial.title} className="max-w-full max-h-full object-contain" />
              ) : (
                <iframe src={previewMaterial.contentUrl} className="w-full h-full border-0" title={previewMaterial.title} />
              )
            ) : (
              <div className="text-center p-8 text-neutral-500 flex flex-col items-center">
                <FileText className="w-16 h-16 mb-4 text-neutral-300" />
                <p className="font-medium text-lg text-neutral-700 dark:text-neutral-300">Default Mock Material</p>
                <p className="text-sm mt-2 max-w-sm">This is a default template material and doesn't contain a real file. Please upload a real file to preview it here!</p>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewMaterial(null)}>Close</Button>
            {previewMaterial && (
              <Button className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => handleDownload(previewMaterial)}>
                <Download className="w-4 h-4 mr-2" /> Download File
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaterialsPage;
