import React from 'react';
import { FileText, Download, ExternalLink, Folders, FileImage } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMaterials } from '@/hooks/useMaterials';
import { getFileContent } from '@/utils/fileStorage';
import { useState } from 'react';

const StudentMaterialsPage = () => {
  const { materials } = useMaterials();
  const [previewMaterial, setPreviewMaterial] = useState(null);

  // Group materials by course
  const courseGroups = materials.reduce((acc, mat) => {
    const cName = mat.course || 'General';
    if (!acc[cName]) {
      acc[cName] = {
        id: cName,
        title: cName,
        code: '',
        faculty: 'Faculty',
        materials: []
      };
    }
    acc[cName].materials.push(mat);
    return acc;
  }, {});

  const displayedCourses = Object.values(courseGroups);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Study Materials</h1>
        <p className="text-neutral-500 dark:text-neutral-400">Download lecture notes, slides, and study resources for your enrolled courses.</p>
      </div>

      <div className="grid gap-6">
        {displayedCourses.map(course => (
          <Card key={course.id} className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
            <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-t-xl pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Folders className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">{course.title} Materials</CardTitle>
                  <CardDescription className="text-sm font-medium mt-1">
                    {course.code} • Taught by {course.faculty}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {course.materials.length > 0 ? (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {course.materials.map(mat => (
                    <div key={mat.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-neutral-400" />
                        <div>
                          <p className="text-sm font-medium">{mat.title}</p>
                          <p className="text-xs text-neutral-500">{mat.type} • {mat.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" title="Preview" onClick={() => handlePreview(mat)}>
                          <ExternalLink className="w-4 h-4 text-neutral-500" />
                        </Button>
                        <Button variant="outline" size="sm" className="hidden sm:flex text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900 dark:hover:bg-blue-900/20" onClick={() => handleDownload(mat)}>
                          <Download className="w-4 h-4 mr-2" /> Download
                        </Button>
                        <Button variant="outline" size="icon" className="sm:hidden text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900 dark:hover:bg-blue-900/20" onClick={() => handleDownload(mat)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-neutral-500">No materials uploaded yet.</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

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
                <p className="text-sm mt-2 max-w-sm">This is a default template material and doesn't contain a real file. Please upload a real file from the Faculty portal to preview it here!</p>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewMaterial(null)}>Close</Button>
            {previewMaterial && (
              <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => handleDownload(previewMaterial)}>
                <Download className="w-4 h-4 mr-2" /> Download File
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentMaterialsPage;
