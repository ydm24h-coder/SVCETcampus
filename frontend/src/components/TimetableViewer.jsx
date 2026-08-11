import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, FileText, User, MapPin, Paperclip } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TimetableViewer = ({ scheduleData, title }) => {
  if (!scheduleData) return null;

  const handleDownload = (attachment, attachmentName) => {
    if (!attachment) return;
    const link = document.createElement("a");
    link.href = attachment;
    link.download = attachmentName || "Notice_Attachment";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDayOfWeek = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const exportScheduleToPDF = () => {
    if (scheduleData.attachment) {
      handleDownload(scheduleData.attachment, scheduleData.attachmentName || `${(title || scheduleData.title || 'Schedule').replace(/\s+/g, '_')}_Document`);
      return;
    }

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(63, 81, 181);
    doc.text("Sri Venkateswara College of Engineering", 105, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(title || scheduleData.title || "Timetable", 105, 25, { align: 'center' });
    
    // Metadata
    doc.setFontSize(10);
    let metaText = `Type: ${scheduleData.type}`;
    if (scheduleData.type === 'Regular') {
      metaText = `Department: ${scheduleData.department}   |   Year: ${scheduleData.year}   |   ` + metaText;
    } else if (scheduleData.type === 'Exam') {
      metaText = `Year: ${scheduleData.year}   |   Time: ${scheduleData.time}   |   ` + metaText;
    } else if (scheduleData.type === 'Staff') {
      metaText = `Faculty: ${scheduleData.faculty}   |   ` + metaText;
    }
    
    doc.text(metaText, 105, 33, { align: 'center' });
    doc.line(14, 38, 196, 38);

    let startY = 45;

    if (scheduleData.type === 'Regular' || scheduleData.type === 'Staff') {
      const periods = scheduleData.periods || ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7', 'Period 8'];
      
      const head = [['Day', ...periods]];
      const body = [];
      
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      days.forEach(day => {
        const row = [day];
        const dayData = scheduleData.data?.find(d => d.day === day);
        periods.forEach(period => {
          const slot = dayData?.slots?.find(s => s.period === period);
          if (slot) {
            row.push(`${slot.subject}\n${scheduleData.type === 'Regular' ? slot.faculty : `${slot.targetDepartment||''} ${slot.targetYear||''}`}\nRoom ${slot.room}`);
          } else {
            row.push('');
          }
        });
        body.push(row);
      });

      autoTable(doc, {
        startY: startY,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [63, 81, 181] },
        styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
        margin: { top: 10, left: 10, right: 10 }
      });
      
    } else if (scheduleData.type === 'Exam') {
      const departments = scheduleData.periods || ['CSE', 'AIML', 'AIDS', 'CS', 'IT', 'EEE', 'ECE', 'MECH', 'CIVIL'];
      
      const head = [['Date', 'Day', ...departments]];
      const body = [];
      
      scheduleData.data?.forEach(dayObj => {
        const row = [dayObj.date, getDayOfWeek(dayObj.date)];
        departments.forEach(dept => {
          const slot = dayObj.slots?.find(s => s.period === dept);
          if (slot) {
            row.push(`${slot.subject}\n(${slot.examType})`);
          } else {
            row.push('');
          }
        });
        body.push(row);
      });

      autoTable(doc, {
        startY: startY,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [156, 39, 176] },
        styles: { fontSize: 8, cellPadding: 3, halign: 'center' },
        margin: { top: 10, left: 10, right: 10 }
      });
    }

    doc.save(`${(title || scheduleData.title || 'Schedule').replace(/\s+/g, '_')}_Schedule.pdf`);
  };

  const renderRegularOrStaffMatrix = () => {
    const periods = scheduleData.periods || ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7', 'Period 8'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return (
      <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-lg">
        <table className="w-full text-sm text-left border-collapse min-w-[600px]">
          <thead className="bg-neutral-100 dark:bg-neutral-900">
            <tr>
              <th className="px-2 py-2 border border-neutral-200 dark:border-neutral-800 text-center text-xs w-20">Day</th>
              {periods.map(period => (
                <th key={period} className="px-2 py-2 border border-neutral-200 dark:border-neutral-800 text-center text-xs">{period}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day, dIdx) => (
              <tr key={day} className={dIdx % 2 === 0 ? 'bg-white dark:bg-neutral-950' : 'bg-neutral-50/50 dark:bg-neutral-900/30'}>
                <td className="px-2 py-2 border border-neutral-200 dark:border-neutral-800 font-bold text-center text-xs">{day}</td>
                {periods.map(period => {
                  const dayData = scheduleData.data?.find(d => d.day === day);
                  const slot = dayData?.slots?.find(s => s.period === period);
                  return (
                    <td key={period} className="border border-neutral-200 dark:border-neutral-800 p-1 align-top">
                      {slot ? (
                        <div className="bg-blue-50 dark:bg-blue-900/20 text-center rounded p-1 h-full flex flex-col justify-center min-h-[60px]">
                          <span className="font-bold text-[10px] text-blue-900 dark:text-blue-100 leading-tight mb-0.5">{slot.subject}</span>
                          <span className="text-[9px] text-blue-700 dark:text-blue-300">
                            {scheduleData.type === 'Regular' ? slot.faculty : `${slot.targetDepartment||''} ${slot.targetYear||''}`}
                          </span>
                          <span className="text-[8px] text-blue-600/70 mt-0.5 uppercase">Rm {slot.room}</span>
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderExamMatrix = () => {
    const departments = scheduleData.periods || ['CSE', 'AIML', 'AIDS', 'CS', 'IT', 'EEE', 'ECE', 'MECH', 'CIVIL'];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
          <Clock className="w-4 h-4" /> Exam Time: {scheduleData.time || 'Not specified'}
        </div>
        
        <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-lg">
          <table className="w-full text-sm text-left border-collapse min-w-[600px]">
            <thead className="bg-neutral-100 dark:bg-neutral-900">
              <tr>
                <th className="px-3 py-2 border border-neutral-200 dark:border-neutral-800 text-center text-xs w-28">Date</th>
                {departments.map(dept => (
                  <th key={dept} className="px-3 py-2 border border-neutral-200 dark:border-neutral-800 text-center text-xs">{dept}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scheduleData.data?.map((dayObj, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white dark:bg-neutral-950' : 'bg-neutral-50/50 dark:bg-neutral-900/30'}>
                  <td className="px-2 py-2 border border-neutral-200 dark:border-neutral-800 text-center">
                    <div className="font-bold text-xs">{dayObj.date}</div>
                    <div className="text-[9px] uppercase tracking-wider text-neutral-500 mt-0.5">{getDayOfWeek(dayObj.date)}</div>
                  </td>
                  {departments.map(dept => {
                    const slot = dayObj.slots?.find(s => s.period === dept);
                    return (
                      <td key={dept} className="border border-neutral-200 dark:border-neutral-800 p-1 align-top">
                        {slot ? (
                          <div className="bg-purple-50 dark:bg-purple-900/20 text-center rounded p-2 h-full flex flex-col justify-center min-h-[50px]">
                            <span className="font-bold text-[11px] text-purple-900 dark:text-purple-100">{slot.subject}</span>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="mt-2 mb-4">
        <h3 className="font-bold text-neutral-900 dark:text-white mb-4">
          {scheduleData.type === 'Exam' ? 'Centralized Exam Schedule' : scheduleData.type === 'Regular' ? 'Class Schedule' : 'Staff Schedule'}
        </h3>
        
        {(scheduleData.type === 'Regular' || scheduleData.type === 'Staff') && renderRegularOrStaffMatrix()}
        {scheduleData.type === 'Exam' && renderExamMatrix()}
      </div>
      
      <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <Button onClick={exportScheduleToPDF} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center">
          <FileText className="w-4 h-4 mr-2" /> 
          {scheduleData.attachment ? "Download Attached Document" : "Download Timetable PDF"}
        </Button>
      </div>
    </div>
  );
};

export default TimetableViewer;
