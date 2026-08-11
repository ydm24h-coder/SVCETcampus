import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Edit, AlertCircle, X, Lock, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTimetable } from '@/hooks/useTimetable';
import { useFaculty } from '@/hooks/useFaculty';
import { useNotices } from '@/hooks/useNotices';
import { useDepartments } from '@/hooks/useDepartments';
import Papa from 'papaparse';

const YEARS = ['General', '1', '2', '3', '4'];
const SECTIONS = ['General', 'A', 'B', 'C', 'D', 'E', 'F'];
const DEFAULT_PERIODS = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7', 'Period 8'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimetablePage = () => {
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useTimetable();
  const { faculty } = useFaculty();
  const { addNotice } = useNotices();
  const { departments } = useDepartments();

  const DEPARTMENTS = ['General', ...departments.map(d => d.name)];
  const DEFAULT_EXAM_DEPARTMENTS = departments.map(d => d.name);

  const [activeTab, setActiveTab] = useState('Regular');

  // Dialog States
  const [isRegularOpen, setIsRegularOpen] = useState(false);
  const [isExamOpen, setIsExamOpen] = useState(false);
  const [isStaffOpen, setIsStaffOpen] = useState(false);
  
  // Slot Editor State
  const [activeSlotEditor, setActiveSlotEditor] = useState(null);

  // Form States
  const [formData, setFormData] = useState({});
  const [editId, setEditId] = useState(null);
  const [conflictError, setConflictError] = useState(null);

  const filteredSchedules = schedules.filter(s => s.type === activeTab);

  const getDayOfWeek = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // ---------- CONFLICT & AVAILABILITY LOGIC ----------

  const isFacultyBusy = (day, period, facultyName) => {
    if (!facultyName) return false;
    for (let existing of schedules) {
      if (existing.id === editId) continue;
      const isRegular = existing.type === 'Regular';
      if (!existing.data) continue;
      
      for (let dayObj of existing.data) {
        if (dayObj.day !== day || !dayObj.slots) continue;
        for (let slot of dayObj.slots) {
          if (slot.period === period) {
            const slotFaculty = isRegular ? slot.faculty : existing.faculty;
            if (slotFaculty === facultyName) return true;
          }
        }
      }
    }
    return false;
  };

  const getExternalSlotStatus = (day, period, type) => {
    for (let existing of schedules) {
      if (existing.id === editId) continue;
      const isRegular = existing.type === 'Regular';
      if (!existing.data) continue;

      for (let dayObj of existing.data) {
        if (dayObj.day !== day || !dayObj.slots) continue;
        
        for (let slot of dayObj.slots) {
          if (slot.period === period) {
            
            if (type === 'Staff' && formData.faculty) {
              const slotFaculty = isRegular ? slot.faculty : existing.faculty;
              if (slotFaculty === formData.faculty) {
                const targetClass = isRegular 
                  ? `${existing.department} ${existing.year} ${existing.section || ''}`.trim()
                  : `${slot.targetDepartment} ${slot.targetYear} ${slot.targetSection || ''}`.trim();
                return { booked: true, text: targetClass || 'Another Class' };
              }
            }

            if (type === 'Regular' && formData.department && formData.year) {
              const myTarget = `${formData.department} ${formData.year} ${formData.section || ''}`.trim();
              const slotTarget = isRegular 
                  ? `${existing.department} ${existing.year} ${existing.section || ''}`.trim()
                  : `${slot.targetDepartment} ${slot.targetYear} ${slot.targetSection || ''}`.trim();
                  
              if (myTarget === slotTarget && myTarget !== '') {
                const slotFaculty = isRegular ? slot.faculty : existing.faculty;
                return { booked: true, text: slotFaculty || 'Another Faculty' };
              }
            }

          }
        }
      }
    }
    return { booked: false };
  };

  const checkConflicts = (payload) => {
    const allSlots = [];
    for (let existing of schedules) {
      if (existing.id === editId) continue;
      if (existing.type === 'Regular' || existing.type === 'Staff') {
        const isRegular = existing.type === 'Regular';
        if (existing.data) {
          for (let dayObj of existing.data) {
            if (!dayObj.slots) continue;
            for (let slot of dayObj.slots) {
              allSlots.push({
                sourceTitle: existing.title,
                day: dayObj.day,
                period: slot.period,
                room: slot.room,
                faculty: isRegular ? slot.faculty : existing.faculty,
                targetClass: isRegular ? `${existing.department} ${existing.year} ${existing.section || ''}` : `${slot.targetDepartment} ${slot.targetYear} ${slot.targetSection || ''}`
              });
            }
          }
        }
      }
    }

    if (payload.type === 'Regular' || payload.type === 'Staff') {
      const isRegular = payload.type === 'Regular';
      if (payload.data) {
        for (let dayObj of payload.data) {
          if (!dayObj.slots) continue;
          for (let slot of dayObj.slots) {
            const pFaculty = isRegular ? slot.faculty : payload.faculty;
            const pTargetClass = isRegular ? `${payload.department} ${payload.year} ${payload.section || ''}` : `${slot.targetDepartment} ${slot.targetYear} ${slot.targetSection || ''}`;
            
            for (let aSlot of allSlots) {
              if (dayObj.day === aSlot.day && slot.period === aSlot.period) {
                if (pFaculty && pFaculty === aSlot.faculty) return `Conflict: Prof. ${pFaculty} is already scheduled for ${aSlot.sourceTitle} on ${dayObj.day} during ${slot.period}.`;
                if (slot.room && slot.room === aSlot.room && slot.room.trim() !== '') return `Conflict: Room ${slot.room} is already booked for ${aSlot.sourceTitle} on ${dayObj.day} during ${slot.period}.`;
                if (pTargetClass && pTargetClass === aSlot.targetClass && pTargetClass.trim() !== '') return `Conflict: Class ${pTargetClass} is already booked for ${aSlot.sourceTitle} on ${dayObj.day} during ${slot.period}.`;
              }
            }
          }
        }
      }
    }

    return null;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        attachment: reader.result,
        attachmentName: file.name
      }));
    };
    reader.readAsDataURL(file);
  };

  const saveAndNotify = (type) => {
    setConflictError(null);
    const payload = { ...formData, type, status: 'Published' };
    
    // Default periods if somehow missing
    if (!payload.periods) {
      if (type === 'Exam') {
        payload.periods = [...DEFAULT_EXAM_DEPARTMENTS];
      } else {
        payload.periods = [...DEFAULT_PERIODS];
      }
    }
    
    const conflict = checkConflicts(payload);
    if (conflict) {
      setConflictError(conflict);
      return false;
    }

    const verb = editId ? 'Updated' : 'New';
    if (editId) {
      updateSchedule(editId, payload);
    } else {
      addSchedule(payload);
    }
    
    // For notices
    let targetD = formData.department || 'All';
    let targetY = formData.year || 'All';
    if (type === 'Staff' || type === 'Exam') {
      targetD = 'All'; // Exams now apply to all departments simultaneously
      targetY = formData.year || 'All';
    }

    addNotice({
      title: `${verb} ${type === 'Regular' ? 'Class' : type} Timetable: ${formData.title}`,
      type: 'Information',
      sender: 'Admin',
      priority: editId ? 'Normal' : 'High',
      targetAudience: formData.audience || 'Both',
      targetDepartment: targetD,
      targetYear: targetY,
      isTimetable: true,
      scheduleData: payload,
      content: `A ${verb.toLowerCase()} ${type === 'Regular' ? 'Class' : type} Timetable "${formData.title}" has been published.`
    });
    setEditId(null);
    return true;
  };

  // ---------- SPREADSHEET AUTO FILL ----------

  const downloadCsvTemplate = (type) => {
    let csvContent = "";
    if (type === 'Regular') {
      csvContent = "Day,Period,Subject,Room,Faculty\nMonday,Period 1,Math,101,Prof. Smith\nMonday,Period 2,Physics,102,Prof. Johnson\n";
    } else if (type === 'Staff') {
      csvContent = "Day,Period,Subject,Room,TargetClass\nMonday,Period 1,Math,101,CSE 3 A\nMonday,Period 2,Physics,102,IT 2 B\n";
    } else if (type === 'Exam') {
      csvContent = "Date,CSE,IT,MECH,CIVIL,ECE\n2024-05-10,Data Structures,Web Technologies,Thermodynamics,Solid Mechanics,Signals\n2024-05-12,Algorithms,Database,Fluid Mechanics,Surveying,Circuits\n";
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${type}_Timetable_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset target value so same file can be uploaded again if needed
    e.target.value = null;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        let errorMessages = [];

        if (type === 'Exam') {
          // EXAM CSV PARSING - Centralized format mapped from CSV
          let newPeriods = [...(formData.periods || DEFAULT_EXAM_DEPARTMENTS)];
          let newData = JSON.parse(JSON.stringify(formData.data || []));

          rows.forEach((row, idx) => {
            const date = row.Date?.trim();
            if (!date) return;

            let dateObj = newData.find(d => d.date === date);
            if (!dateObj) {
              dateObj = { date, slots: [] };
              newData.push(dateObj);
            }

            // Loop through all keys (Departments) in the row, except "Date"
            Object.keys(row).forEach(key => {
              if (key === 'Date') return;
              
              const deptName = key.trim();
              const subject = row[key]?.trim();
              
              if (!subject) return; // Skip empty cells
              
              // Dynamically add new department column if it doesn't exist
              if (!newPeriods.includes(deptName)) {
                newPeriods.push(deptName);
              }

              const newSlot = { period: deptName, subject, examType: 'Internal' };
              const existingSlotIdx = dateObj.slots.findIndex(s => s.period === deptName);
              if (existingSlotIdx >= 0) {
                dateObj.slots[existingSlotIdx] = newSlot;
              } else {
                dateObj.slots.push(newSlot);
              }
            });
          });
          
          alert("Exam CSV Uploaded and successfully populated!");
          
          setFormData(prev => ({
            ...prev,
            periods: newPeriods,
            data: newData
          }));
          return; 
        }

        // REGULAR & STAFF CSV PARSING
        let newPeriods = [...(formData.periods || DEFAULT_PERIODS)];
        let newData = JSON.parse(JSON.stringify(formData.data || WEEKDAYS.map(day => ({ day, slots: [] }))));

        rows.forEach((row, idx) => {
          const day = row.Day?.trim();
          const period = row.Period?.trim();
          const subject = row.Subject?.trim();
          const room = row.Room?.trim() || '';
          
          if (!day || !period || !subject) return;

          // Add dynamic period if it doesn't exist
          if (!newPeriods.includes(period)) {
            newPeriods.push(period);
          }

          const dayObj = newData.find(d => d.day.toLowerCase() === day.toLowerCase());
          if (!dayObj) return; // Invalid day

          const newSlot = { period, subject, room };

          if (type === 'Regular') {
            const faculty = row.Faculty?.trim();
            newSlot.faculty = faculty || '';
            
            // Context check for regular:
            const externalStatus = getExternalSlotStatus(dayObj.day, period, 'Regular');
            if (externalStatus.booked) {
              errorMessages.push(`Row ${idx + 2}: ${dayObj.day} ${period} is blocked (${externalStatus.text}).`);
              return;
            }
            if (faculty && isFacultyBusy(dayObj.day, period, faculty)) {
              errorMessages.push(`Row ${idx + 2}: Faculty ${faculty} is busy on ${dayObj.day} ${period}.`);
              return;
            }

          } else {
            const targetClassStr = row.TargetClass?.trim();
            if (targetClassStr) {
              const parts = targetClassStr.split(' ');
              newSlot.targetDepartment = parts[0] || '';
              newSlot.targetYear = parts[1] || '';
              newSlot.targetSection = parts.slice(2).join(' ') || '';
            }

            // Context check for staff:
            const externalStatus = getExternalSlotStatus(dayObj.day, period, 'Staff');
            if (externalStatus.booked) {
              errorMessages.push(`Row ${idx + 2}: Faculty already booked in ${externalStatus.text} on ${dayObj.day} ${period}.`);
              return;
            }
          }

          // Override existing slot if exists
          const existingSlotIdx = dayObj.slots.findIndex(s => s.period === period);
          if (existingSlotIdx >= 0) {
            dayObj.slots[existingSlotIdx] = newSlot;
          } else {
            dayObj.slots.push(newSlot);
          }
        });

        if (errorMessages.length > 0) {
          alert("CSV Uploaded with some skipped rows due to conflicts:\n" + errorMessages.join("\n"));
        } else {
          alert("CSV Uploaded and successfully populated!");
        }

        setFormData(prev => ({
          ...prev,
          periods: newPeriods,
          data: newData
        }));
      }
    });
  };

  // ---------- PERIOD / COLUMN MANAGEMENT ----------
  const addPeriod = () => {
    const currentPeriods = formData.periods || (activeTab === 'Exam' ? [...DEFAULT_EXAM_DEPARTMENTS] : [...DEFAULT_PERIODS]);
    const prefix = activeTab === 'Exam' ? 'New Dept' : 'Period';
    const newPeriodNum = currentPeriods.length + 1;
    setFormData({ ...formData, periods: [...currentPeriods, `${prefix} ${newPeriodNum}`] });
  };

  const deletePeriod = (periodToDelete) => {
    const currentPeriods = formData.periods || (activeTab === 'Exam' ? [...DEFAULT_EXAM_DEPARTMENTS] : [...DEFAULT_PERIODS]);
    const newPeriods = currentPeriods.filter(p => p !== periodToDelete);
    
    // Remove slots associated with this column
    const newData = formData.data?.map(dayObj => ({
      ...dayObj,
      slots: dayObj.slots?.filter(s => s.period !== periodToDelete) || []
    }));

    setFormData({ ...formData, periods: newPeriods, data: newData });
  };

  // Exam Date Management
  const addExamDate = () => {
    const newData = formData.data || [];
    setFormData({ ...formData, data: [...newData, { date: '', slots: [] }] });
  };
  
  const updateExamDate = (index, newDate) => {
    const newData = [...formData.data];
    newData[index].date = newDate;
    setFormData({ ...formData, data: newData });
  };

  const deleteExamDate = (index) => {
    const newData = [...formData.data];
    newData.splice(index, 1);
    setFormData({ ...formData, data: newData });
  };

  const updateColumnName = (oldName, newName) => {
    if (!newName || newName === oldName) return;
    const newPeriods = [...formData.periods];
    const index = newPeriods.indexOf(oldName);
    if (index >= 0) {
      newPeriods[index] = newName;
      // Update all associated slots
      const newData = formData.data?.map(dayObj => ({
        ...dayObj,
        slots: dayObj.slots?.map(s => s.period === oldName ? { ...s, period: newName } : s) || []
      }));
      setFormData({ ...formData, periods: newPeriods, data: newData });
    }
  };

  // ---------- REGULAR TIMETABLE BUILDER ----------
  const initRegularForm = () => {
    setEditId(null);
    setConflictError(null);
    setFormData({
      title: '', department: '', year: '', section: '', audience: 'Both',
      periods: [...DEFAULT_PERIODS],
      data: WEEKDAYS.map(day => ({ day, slots: [] }))
    });
    setIsRegularOpen(true);
  };

  const openEditRegular = (schedule) => {
    setEditId(schedule.id);
    setConflictError(null);
    setFormData({
      ...schedule,
      periods: schedule.periods || [...DEFAULT_PERIODS]
    });
    setIsRegularOpen(true);
  };

  const handleSaveRegular = (e) => {
    e.preventDefault();
    if (saveAndNotify('Regular')) setIsRegularOpen(false);
  };

  // ---------- STAFF TIMETABLE BUILDER ----------
  const initStaffForm = () => {
    setEditId(null);
    setConflictError(null);
    setFormData({
      title: '', faculty: '', audience: 'Faculty',
      periods: [...DEFAULT_PERIODS],
      data: WEEKDAYS.map(day => ({ day, slots: [] }))
    });
    setIsStaffOpen(true);
  };

  const openEditStaff = (schedule) => {
    setEditId(schedule.id);
    setConflictError(null);
    setFormData({
      ...schedule,
      periods: schedule.periods || [...DEFAULT_PERIODS]
    });
    setIsStaffOpen(true);
  };

  const handleSaveStaff = (e) => {
    e.preventDefault();
    if (saveAndNotify('Staff')) setIsStaffOpen(false);
  };

  // ---------- EXAM SCHEDULE BUILDER ----------
  const initExamForm = () => {
    setEditId(null);
    setConflictError(null);
    setFormData({
      title: '', time: '', year: '', audience: 'Both',
      periods: [...DEFAULT_EXAM_DEPARTMENTS],
      data: [{ date: '', slots: [] }] // Start with 1 empty date row
    });
    setIsExamOpen(true);
  };

  const openEditExam = (schedule) => {
    setEditId(schedule.id);
    setConflictError(null);
    setFormData({
      ...schedule,
      periods: schedule.periods || [...DEFAULT_EXAM_DEPARTMENTS],
      data: schedule.data?.map(d => d.slots ? d : { date: d.date || '', slots: [] }) || [{ date: '', slots: [] }]
    });
    setIsExamOpen(true);
  };

  const handleSaveExam = (e) => {
    e.preventDefault();
    if (saveAndNotify('Exam')) setIsExamOpen(false);
  };


  // ---------- SLOT EDITOR LOGIC ----------
  const handleSaveSlot = (e) => {
    e.preventDefault();
    if (!activeSlotEditor) return;
    
    const { type, dayIdx, period, slotIndex } = activeSlotEditor;
    const newData = [...formData.data];
    
    const formDataObj = new FormData(e.target);
    const updatedSlot = { period };
    if (type === 'Regular') {
      updatedSlot.subject = formDataObj.get('subject');
      updatedSlot.room = formDataObj.get('room');
      updatedSlot.faculty = formDataObj.get('faculty');
    } else if (type === 'Staff') {
      updatedSlot.subject = formDataObj.get('subject');
      updatedSlot.room = formDataObj.get('room');
      updatedSlot.targetDepartment = formDataObj.get('targetDepartment');
      updatedSlot.targetYear = formDataObj.get('targetYear');
      updatedSlot.targetSection = formDataObj.get('targetSection');
    }

    if (slotIndex >= 0) {
      newData[dayIdx].slots[slotIndex] = updatedSlot;
    } else {
      if (!newData[dayIdx].slots) newData[dayIdx].slots = [];
      newData[dayIdx].slots.push(updatedSlot);
    }
    
    setFormData({ ...formData, data: newData });
    setActiveSlotEditor(null);
  };

  const handleDeleteSlot = () => {
    if (!activeSlotEditor) return;
    const { dayIdx, slotIndex } = activeSlotEditor;
    if (slotIndex >= 0) {
      const newData = [...formData.data];
      newData[dayIdx].slots.splice(slotIndex, 1);
      setFormData({ ...formData, data: newData });
    }
    setActiveSlotEditor(null);
  };
  
  // Excel-like inline editing handler for Exam Grid
  const handleExamSlotChange = (dIdx, period, subject) => {
    const newData = [...formData.data];
    let slotIndex = newData[dIdx].slots?.findIndex(s => s.period === period);
    
    if (slotIndex >= 0) {
      if (subject.trim() === '') {
        // Delete slot if empty
        newData[dIdx].slots.splice(slotIndex, 1);
      } else {
        newData[dIdx].slots[slotIndex].subject = subject;
      }
    } else if (subject.trim() !== '') {
      if (!newData[dIdx].slots) newData[dIdx].slots = [];
      newData[dIdx].slots.push({ period, subject, examType: 'Internal' });
    }
    
    setFormData({ ...formData, data: newData });
  };

  const getSlot = (scheduleData, day, period) => {
    if (!scheduleData) return null;
    const dayObj = scheduleData.find(d => d.day === day || d.date === day);
    if (!dayObj || !dayObj.slots) return null;
    return dayObj.slots.find(s => s.period === period);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule Manager</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Create and publish timetables for classes, exams, and staff.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={initRegularForm} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Class Full Period Timetable
          </Button>
          <Button onClick={initExamForm} className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Centralized Exam Timetable
          </Button>
          <Button onClick={initStaffForm} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Staff Timetable
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 overflow-x-auto">
        {[
          { id: 'Regular', label: 'Class Full Period Timetables' },
          { id: 'Staff', label: 'Staff Timetables' },
          { id: 'Exam', label: 'Exam Timetables' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border-b-2 border-blue-500' 
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Schedule List */}
      <div className="grid gap-6">
        {filteredSchedules.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 bg-white/50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800 border-dashed">
            No {activeTab === 'Regular' ? 'Class' : activeTab} schedules found. Click the buttons above to create one.
          </div>
        ) : (
          filteredSchedules?.map((schedule) => (
            <Card key={schedule.id} className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur overflow-hidden">
              <CardHeader className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    {schedule.title}
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">Published</span>
                  </CardTitle>
                  <p className="text-sm text-neutral-500 mt-1">
                    {schedule.type === 'Regular' && `${schedule.department} | Year ${schedule.year} ${schedule.section ? `| Sec ${schedule.section}` : ''}`}
                    {schedule.type === 'Staff' && `Faculty: ${schedule.faculty}`}
                    {schedule.type === 'Exam' && `Year ${schedule.year}`}
                    {' '} | Audience: {schedule.audience || 'Both'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (schedule.type === 'Regular') openEditRegular(schedule);
                    else if (schedule.type === 'Exam') openEditExam(schedule);
                    else openEditStaff(schedule);
                  }} className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50">
                    <Edit className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteSchedule(schedule.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {/* Render Regular or Staff Grid */}
                {(schedule.type === 'Regular' || schedule.type === 'Staff') && (
                  <div className="overflow-x-auto w-full max-w-full rounded-lg border border-neutral-200 dark:border-neutral-800">
<table className="w-full text-sm text-left border-collapse min-w-[800px]">
                    <thead className="text-xs text-neutral-700 uppercase bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-300">
                      <tr>
                        <th className="px-4 py-3 border border-neutral-200 dark:border-neutral-800 text-center w-32">Day</th>
                        {(schedule.periods || DEFAULT_PERIODS).map(period => (
                          <th key={period} className="px-4 py-3 border border-neutral-200 dark:border-neutral-800 text-center min-w-[140px] whitespace-nowrap">
                            {period}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {WEEKDAYS.map((day, rIdx) => (
                        <tr key={day} className={`border border-neutral-200 dark:border-neutral-800 ${rIdx % 2 === 0 ? 'bg-white dark:bg-neutral-950' : 'bg-neutral-50/50 dark:bg-neutral-900/30'}`}>
                          <td className="px-4 py-4 border border-neutral-200 dark:border-neutral-800 font-bold text-center text-neutral-700 dark:text-neutral-300">
                            {day}
                          </td>
                          {(schedule.periods || DEFAULT_PERIODS).map(period => {
                            const slot = getSlot(schedule.data, day, period);
                            return (
                              <td key={period} className="border border-neutral-200 dark:border-neutral-800 p-2 align-top">
                                {slot ? (
                                  <div className="h-full p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded flex flex-col justify-center items-center text-center">
                                    <div className="font-bold text-blue-900 dark:text-blue-100 mb-1">{slot.subject}</div>
                                    <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                                      {schedule.type === 'Regular' ? slot.faculty : `${slot.targetDepartment || ''} ${slot.targetYear || ''} ${slot.targetSection || ''}`.trim()}
                                    </div>
                                    <div className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mt-1 uppercase tracking-wider">
                                      Room {slot.room}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-full w-full min-h-[80px] bg-transparent"></div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
</div>
                )}

                {/* Render Exam Grid */}
                {schedule.type === 'Exam' && (
                  <div className="w-full">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-800 flex flex-wrap gap-4 items-center justify-between">
                      <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold">
                        <Clock className="w-4 h-4" /> Time: {schedule.time || 'Not specified'}
                      </div>
                    </div>
                    <div className="overflow-x-auto w-full max-w-full rounded-lg border border-neutral-200 dark:border-neutral-800">
<table className="w-full text-sm text-left border-collapse min-w-[800px]">
                      <thead className="text-xs text-neutral-700 uppercase bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-300">
                        <tr>
                          <th className="px-4 py-3 border border-neutral-200 dark:border-neutral-800 text-center w-40">Date</th>
                          {(schedule.periods || DEFAULT_EXAM_DEPARTMENTS).map(dept => (
                            <th key={dept} className="px-4 py-3 border border-neutral-200 dark:border-neutral-800 text-center min-w-[160px] whitespace-nowrap">
                              {dept}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {schedule.data?.map((dayObj, rIdx) => (
                          <tr key={rIdx} className={`border border-neutral-200 dark:border-neutral-800 ${rIdx % 2 === 0 ? 'bg-white dark:bg-neutral-950' : 'bg-neutral-50/50 dark:bg-neutral-900/30'}`}>
                            <td className="px-4 py-3 border border-neutral-200 dark:border-neutral-800 text-center">
                              <div className="font-bold text-neutral-700 dark:text-neutral-300 text-sm">{dayObj.date || `Row ${rIdx + 1}`}</div>
                              {dayObj.date && <div className="text-xs text-neutral-500 font-medium">{getDayOfWeek(dayObj.date)}</div>}
                            </td>
                            {(schedule.periods || DEFAULT_EXAM_DEPARTMENTS).map(dept => {
                              const slot = getSlot(schedule.data, dayObj.date, dept);
                              return (
                                <td key={dept} className="border border-neutral-200 dark:border-neutral-800 p-2 align-top">
                                  {slot ? (
                                    <div className="h-full p-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded flex flex-col justify-center items-center text-center">
                                      <div className="font-bold text-purple-900 dark:text-purple-100 mb-1">{slot.subject}</div>
                                      <div className="text-[10px] text-purple-600/70 dark:text-purple-400/70 uppercase tracking-wider px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 rounded-full mt-1">
                                        {slot.examType}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="h-full w-full min-h-[80px] bg-transparent"></div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* --- DIALOGS --- */}

      {/* Regular (Class) Dialog */}
      <Dialog open={isRegularOpen} onOpenChange={setIsRegularOpen}>
        <DialogContent className="!max-w-none !w-screen !h-screen !max-h-screen !m-0 !rounded-none border-0 overflow-y-auto bg-neutral-50 dark:bg-neutral-950 flex flex-col p-6 sm:p-10 shadow-none">
          <DialogHeader>
            <DialogTitle className="text-2xl">{editId ? 'Edit Class Timetable' : 'Create Class Full Period Timetable'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveRegular} className="space-y-4 mt-4 flex-1">
            {conflictError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {conflictError}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="grid gap-2 col-span-2 md:col-span-1">
                <Label>Title</Label>
                <Input value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="e.g. Even Semester Schedule" />
              </div>
              <div className="grid gap-2 col-span-2 md:col-span-1">
                <Label>Audience</Label>
                <select value={formData.audience || 'Both'} onChange={e => setFormData({...formData, audience: e.target.value})} required className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:text-white dark:border-neutral-800 dark:bg-neutral-950">
                  <option value="Student">Student Only</option>
                  <option value="Faculty">Faculty Only</option>
                  <option value="Both">Student & Faculty</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Department</Label>
                <select value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})} required className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:text-white dark:border-neutral-800 dark:bg-neutral-950">
                  <option value="" disabled>Select</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Year</Label>
                <select value={formData.year || ''} onChange={e => setFormData({...formData, year: e.target.value})} required className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:text-white dark:border-neutral-800 dark:bg-neutral-950">
                  <option value="" disabled>Select</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Section</Label>
                <select value={formData.section || ''} onChange={e => setFormData({...formData, section: e.target.value})} required className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:text-white dark:border-neutral-800 dark:bg-neutral-950">
                  <option value="" disabled>Select</option>
                  {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div>
                  <h3 className="text-lg font-bold">Interactive Matrix Builder</h3>
                  <p className="text-sm text-neutral-500">Click any cell to add or edit a class slot. Cells marked as booked mean the class is already scheduled.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => downloadCsvTemplate('Regular')} className="text-xs">
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Download Template
                  </Button>
                  <div className="relative">
                    <Input type="file" accept=".csv" onChange={(e) => handleCsvUpload(e, 'Regular')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <Button type="button" variant="secondary" className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs">
                      <Upload className="w-3.5 h-3.5 mr-1.5" /> Auto-Fill from CSV
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[800px]">
                  <thead className="bg-neutral-100 dark:bg-neutral-900">
                    <tr>
                      <th className="px-3 py-2 border border-neutral-200 dark:border-neutral-800 text-center w-24">Day</th>
                      {(formData.periods || DEFAULT_PERIODS).map(period => (
                        <th key={period} className="p-0 border border-neutral-200 dark:border-neutral-800 text-center text-xs relative group min-w-[120px]">
                          <input 
                            type="text" 
                            defaultValue={period} 
                            onBlur={(e) => updateColumnName(period, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.target.blur();
                              }
                            }}
                            className="w-full h-8 text-center bg-transparent border-0 focus:ring-0 font-bold"
                          />
                          <button type="button" onClick={() => deletePeriod(period)} title="Delete Period" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 p-0.5 rounded transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        </th>
                      ))}
                      <th className="px-2 py-2 border border-neutral-200 dark:border-neutral-800 text-center w-12 bg-blue-50 dark:bg-blue-900/10">
                        <Button type="button" variant="ghost" size="icon" onClick={addPeriod} title="Add Period Column" className="w-6 h-6 rounded-full hover:bg-blue-200 hover:text-blue-700">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.data?.map((dayObj, dIdx) => (
                      <tr key={dIdx} className={dIdx % 2 === 0 ? 'bg-white dark:bg-neutral-950' : 'bg-neutral-50/50 dark:bg-neutral-900/30'}>
                        <td className="px-3 py-2 border border-neutral-200 dark:border-neutral-800 font-bold text-center">
                          {dayObj.day}
                        </td>
                        {(formData.periods || DEFAULT_PERIODS).map(period => {
                          const slotIndex = dayObj.slots?.findIndex(s => s.period === period);
                          const slot = slotIndex >= 0 ? dayObj.slots[slotIndex] : null;
                          const externalStatus = !slot ? getExternalSlotStatus(dayObj.day, period, 'Regular') : { booked: false };
                          
                          return (
                            <td key={period} className={`border border-neutral-200 dark:border-neutral-800 p-1 transition-colors ${externalStatus.booked ? 'bg-neutral-100 dark:bg-neutral-900 cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                                onClick={() => {
                                  if (externalStatus.booked) return;
                                  setActiveSlotEditor({ type: 'Regular', dayIdx: dIdx, dayName: dayObj.day, period, slotIndex, initialData: slot || { subject: '', room: '', faculty: '' } })
                                }}>
                              {slot ? (
                                <div className="h-full w-full p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 text-center rounded border border-blue-300 dark:border-blue-700 flex flex-col items-center justify-center min-h-[70px]">
                                  <span className="font-bold text-[11px] leading-tight mb-1">{slot.subject}</span>
                                  <span className="text-[10px] leading-tight">{slot.faculty}</span>
                                  <span className="text-[9px] opacity-70 mt-1">Room {slot.room}</span>
                                </div>
                              ) : externalStatus.booked ? (
                                <div className="h-full w-full p-1 text-center flex flex-col items-center justify-center min-h-[70px]">
                                  <Lock className="w-4 h-4 text-neutral-400 mb-1" />
                                  <span className="font-semibold text-[10px] text-red-600 dark:text-red-400 leading-tight">Booked</span>
                                  <span className="text-[9px] text-neutral-500 leading-tight">{externalStatus.text}</span>
                                </div>
                              ) : (
                                <div className="h-full w-full min-h-[70px] flex items-center justify-center text-neutral-300 dark:text-neutral-700 hover:text-blue-500 transition-colors">
                                  <Plus className="w-5 h-5" />
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/10"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="pt-6">
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg">Publish Class Timetable</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Staff Dialog */}
      <Dialog open={isStaffOpen} onOpenChange={setIsStaffOpen}>
        <DialogContent className="!max-w-none !w-screen !h-screen !max-h-screen !m-0 !rounded-none border-0 overflow-y-auto bg-neutral-50 dark:bg-neutral-950 flex flex-col p-6 sm:p-10 shadow-none">
          <DialogHeader>
            <DialogTitle className="text-2xl">{editId ? 'Edit Staff Timetable' : 'Create Staff Timetable'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveStaff} className="space-y-4 mt-4 flex-1">
            {conflictError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {conflictError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="e.g. Prof. Smith Spring Load" />
              </div>
              <div className="grid gap-2">
                <Label>Audience</Label>
                <select value={formData.audience || 'Faculty'} onChange={e => setFormData({...formData, audience: e.target.value})} required className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:text-white dark:border-neutral-800 dark:bg-neutral-950">
                  <option value="Student">Student Only</option>
                  <option value="Faculty">Faculty Only</option>
                  <option value="Both">Student & Faculty</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Faculty Member</Label>
                <select value={formData.faculty || ''} onChange={e => setFormData({...formData, faculty: e.target.value})} required className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:text-white dark:border-neutral-800 dark:bg-neutral-950">
                  <option value="" disabled>Select Faculty</option>
                  {faculty?.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div>
                  <h3 className="text-lg font-bold">Interactive Matrix Builder</h3>
                  <p className="text-sm text-neutral-500">Click any cell to add or edit a class slot. Cells marked as booked mean the faculty is already scheduled.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => downloadCsvTemplate('Staff')} className="text-xs">
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Download Template
                  </Button>
                  <div className="relative">
                    <Input type="file" accept=".csv" onChange={(e) => handleCsvUpload(e, 'Staff')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <Button type="button" variant="secondary" className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs">
                      <Upload className="w-3.5 h-3.5 mr-1.5" /> Auto-Fill from CSV
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[800px]">
                  <thead className="bg-neutral-100 dark:bg-neutral-900">
                    <tr>
                      <th className="px-3 py-2 border border-neutral-200 dark:border-neutral-800 text-center w-24">Day</th>
                      {(formData.periods || DEFAULT_PERIODS).map(period => (
                        <th key={period} className="p-0 border border-neutral-200 dark:border-neutral-800 text-center text-xs relative group min-w-[120px]">
                          <input 
                            type="text" 
                            defaultValue={period} 
                            onBlur={(e) => updateColumnName(period, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.target.blur();
                              }
                            }}
                            className="w-full h-8 text-center bg-transparent border-0 focus:ring-0 font-bold"
                          />
                          <button type="button" onClick={() => deletePeriod(period)} title="Delete Period" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 p-0.5 rounded transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        </th>
                      ))}
                      <th className="px-2 py-2 border border-neutral-200 dark:border-neutral-800 text-center w-12 bg-emerald-50 dark:bg-emerald-900/10">
                        <Button type="button" variant="ghost" size="icon" onClick={addPeriod} title="Add Period Column" className="w-6 h-6 rounded-full hover:bg-emerald-200 hover:text-emerald-700">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.data?.map((dayObj, dIdx) => (
                      <tr key={dIdx} className={dIdx % 2 === 0 ? 'bg-white dark:bg-neutral-950' : 'bg-neutral-50/50 dark:bg-neutral-900/30'}>
                        <td className="px-3 py-2 border border-neutral-200 dark:border-neutral-800 font-bold text-center">
                          {dayObj.day}
                        </td>
                        {(formData.periods || DEFAULT_PERIODS).map(period => {
                          const slotIndex = dayObj.slots?.findIndex(s => s.period === period);
                          const slot = slotIndex >= 0 ? dayObj.slots[slotIndex] : null;
                          const externalStatus = !slot ? getExternalSlotStatus(dayObj.day, period, 'Staff') : { booked: false };
                          
                          return (
                            <td key={period} className={`border border-neutral-200 dark:border-neutral-800 p-1 transition-colors ${externalStatus.booked ? 'bg-neutral-100 dark:bg-neutral-900 cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                                onClick={() => {
                                  if (externalStatus.booked) return;
                                  setActiveSlotEditor({ type: 'Staff', dayIdx: dIdx, dayName: dayObj.day, period, slotIndex, initialData: slot || { subject: '', room: '', targetDepartment: '', targetYear: '', targetSection: '' } })
                                }}>
                              {slot ? (
                                <div className="h-full w-full p-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100 text-center rounded border border-emerald-300 dark:border-emerald-700 flex flex-col items-center justify-center min-h-[70px]">
                                  <span className="font-bold text-[11px] leading-tight mb-1">{slot.subject}</span>
                                  <span className="text-[10px] leading-tight">{`${slot.targetDepartment || ''} ${slot.targetYear || ''} ${slot.targetSection || ''}`.trim()}</span>
                                  <span className="text-[9px] opacity-70 mt-1">Room {slot.room}</span>
                                </div>
                              ) : externalStatus.booked ? (
                                <div className="h-full w-full p-1 text-center flex flex-col items-center justify-center min-h-[70px]">
                                  <Lock className="w-4 h-4 text-neutral-400 mb-1" />
                                  <span className="font-semibold text-[10px] text-red-600 dark:text-red-400 leading-tight">Booked</span>
                                  <span className="text-[9px] text-neutral-500 leading-tight">{externalStatus.text}</span>
                                </div>
                              ) : (
                                <div className="h-full w-full min-h-[70px] flex items-center justify-center text-neutral-300 dark:text-neutral-700 hover:text-emerald-500 transition-colors">
                                  <Plus className="w-5 h-5" />
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/10"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="pt-6">
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg">Publish Staff Timetable</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Exam Dialog - NOW CENTRALIZED DEPARTMENT GRID with EXCEL-LIKE EDITING */}
      <Dialog open={isExamOpen} onOpenChange={setIsExamOpen}>
        <DialogContent className="!max-w-none !w-screen !h-screen !max-h-screen !m-0 !rounded-none border-0 overflow-y-auto bg-neutral-50 dark:bg-neutral-950 flex flex-col p-6 sm:p-10 shadow-none">
          <DialogHeader>
            <DialogTitle className="text-2xl">{editId ? 'Edit Exam Timetable' : 'Create Centralized Exam Timetable'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveExam} className="space-y-4 mt-4 flex-1">
            {conflictError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {conflictError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="grid gap-2">
                <Label>Exam Name / Title</Label>
                <Input value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="e.g. Midterm Exams" />
              </div>
              <div className="grid gap-2">
                <Label>Exam Time</Label>
                <Input value={formData.time || ''} onChange={e => setFormData({...formData, time: e.target.value})} required placeholder="e.g. 09:30 AM - 12:30 PM" />
              </div>
              <div className="grid gap-2">
                <Label>Year</Label>
                <select value={formData.year || ''} onChange={e => setFormData({...formData, year: e.target.value})} required className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:text-white dark:border-neutral-800 dark:bg-neutral-950">
                  <option value="" disabled>Select</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Audience</Label>
                <select value={formData.audience || 'Both'} onChange={e => setFormData({...formData, audience: e.target.value})} required className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:text-white dark:border-neutral-800 dark:bg-neutral-950">
                  <option value="Student">Student Only</option>
                  <option value="Faculty">Faculty Only</option>
                  <option value="Both">Student & Faculty</option>
                </select>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div>
                  <h3 className="text-lg font-bold">Centralized Exam Matrix</h3>
                  <p className="text-sm text-neutral-500">Rows are specific dates. Columns are Departments. Click any cell to type directly like Excel!</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => downloadCsvTemplate('Exam')} className="text-xs">
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Download Template
                  </Button>
                  <div className="relative">
                    <Input type="file" accept=".csv" onChange={(e) => handleCsvUpload(e, 'Exam')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <Button type="button" variant="secondary" className="bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs">
                      <Upload className="w-3.5 h-3.5 mr-1.5" /> Auto-Fill from CSV
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[800px]">
                  <thead className="bg-neutral-100 dark:bg-neutral-900">
                    <tr>
                      <th className="px-3 py-2 border border-neutral-200 dark:border-neutral-800 text-center w-40">Date</th>
                      {(formData.periods || DEFAULT_EXAM_DEPARTMENTS).map(period => (
                        <th key={period} className="p-0 border border-neutral-200 dark:border-neutral-800 text-center text-xs relative group min-w-[140px]">
                          <input 
                            type="text" 
                            defaultValue={period} 
                            onBlur={(e) => updateColumnName(period, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.target.blur();
                              }
                            }}
                            className="w-full h-8 text-center bg-transparent border-0 focus:ring-0 font-bold"
                          />
                          <button type="button" onClick={() => deletePeriod(period)} title="Delete Department Column" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 p-0.5 rounded transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        </th>
                      ))}
                      <th className="px-2 py-2 border border-neutral-200 dark:border-neutral-800 text-center w-12 bg-purple-50 dark:bg-purple-900/10">
                        <Button type="button" variant="ghost" size="icon" onClick={addPeriod} title="Add Department Column" className="w-6 h-6 rounded-full hover:bg-purple-200 hover:text-purple-700">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.data?.map((dayObj, dIdx) => (
                      <tr key={dIdx} className={dIdx % 2 === 0 ? 'bg-white dark:bg-neutral-950' : 'bg-neutral-50/50 dark:bg-neutral-900/30'}>
                        <td className="p-2 border border-neutral-200 dark:border-neutral-800 text-center relative group min-w-[140px]">
                          <div className="flex flex-col items-center justify-center w-full">
                            <Input 
                              type="date" 
                              value={dayObj.date} 
                              onChange={(e) => updateExamDate(dIdx, e.target.value)} 
                              className="h-8 text-xs font-semibold mb-1 w-full"
                              required
                            />
                            <div className="flex items-center justify-between w-full mt-1">
                              {dayObj.date ? (
                                <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded-full uppercase tracking-wider truncate max-w-[80px]">
                                  {getDayOfWeek(dayObj.date)}
                                </div>
                              ) : <div></div>}
                              <button type="button" onClick={() => deleteExamDate(dIdx)} title="Delete Date Row" className="text-red-500 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors" tabIndex="-1">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>
                        {(formData.periods || DEFAULT_EXAM_DEPARTMENTS).map(period => {
                          const slotIndex = dayObj.slots?.findIndex(s => s.period === period);
                          const slot = slotIndex >= 0 ? dayObj.slots[slotIndex] : null;
                          
                          return (
                            <td key={period} className={`border border-neutral-200 dark:border-neutral-800 p-0 transition-colors focus-within:ring-2 focus-within:ring-purple-500 focus-within:relative z-10 bg-white dark:bg-neutral-950`}>
                              <div className="h-full w-full min-h-[70px] flex items-center justify-center p-1">
                                <textarea
                                  value={slot ? slot.subject : ''}
                                  onChange={(e) => handleExamSlotChange(dIdx, period, e.target.value)}
                                  placeholder="+ Type subject"
                                  className="w-full h-full min-h-[60px] bg-transparent border-0 focus:ring-0 rounded p-1 text-center text-xs font-bold text-purple-900 dark:text-purple-100 placeholder:text-neutral-300 dark:placeholder:text-neutral-700 resize-none outline-none leading-tight flex items-center"
                                />
                              </div>
                            </td>
                          );
                        })}
                        <td className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/10"></td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={(formData.periods?.length || 5) + 2} className="p-2 border border-neutral-200 dark:border-neutral-800">
                        <Button type="button" variant="ghost" onClick={addExamDate} className="w-full text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-dashed border-purple-200 dark:border-purple-800">
                          + Add Exam Date Row
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="pt-6">
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg">Publish Exam Timetable</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Slot Editor Popover/Modal (Only for Regular and Staff now) */}
      <Dialog open={!!activeSlotEditor} onOpenChange={open => !open && setActiveSlotEditor(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CalendarIcon className={`w-5 h-5 ${activeSlotEditor?.type === 'Exam' ? 'text-purple-500' : activeSlotEditor?.type === 'Regular' ? 'text-blue-500' : 'text-emerald-500'}`} />
              {activeSlotEditor?.dayName} - {activeSlotEditor?.period}
            </DialogTitle>
          </DialogHeader>
          {activeSlotEditor && (
            <form onSubmit={handleSaveSlot} className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label>Subject</Label>
                <Input name="subject" defaultValue={activeSlotEditor.initialData.subject} required placeholder="e.g. Data Structures" autoFocus />
              </div>
              
              {activeSlotEditor.type === 'Regular' ? (
                <>
                  <div className="grid gap-2">
                    <Label>Room</Label>
                    <Input name="room" defaultValue={activeSlotEditor.initialData.room} required placeholder="e.g. 302" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Faculty Member</Label>
                    <select name="faculty" defaultValue={activeSlotEditor.initialData.faculty} required className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:text-white dark:border-neutral-800 dark:bg-neutral-950">
                      <option value="" disabled>Select</option>
                      {faculty?.map(f => {
                        const isBusy = activeSlotEditor.initialData.faculty !== f.name && isFacultyBusy(activeSlotEditor.dayName, activeSlotEditor.period, f.name);
                        return (
                          <option key={f.id} value={f.name} disabled={isBusy}>
                            {f.name} {isBusy ? '(Busy in another class)' : ''}
                          </option>
                        )
                      })}
                    </select>
                    <p className="text-xs text-neutral-500">Faculty marked as busy are already teaching another class during this exact time slot.</p>
                  </div>
                </>
              ) : activeSlotEditor.type === 'Staff' ? (
                <>
                  <div className="grid gap-2">
                    <Label>Room</Label>
                    <Input name="room" defaultValue={activeSlotEditor.initialData.room} required placeholder="e.g. 302" />
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-3">
                    <Label className="text-neutral-500 font-semibold">Target Class</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="grid gap-1">
                        <Label className="text-xs">Dept</Label>
                        <select name="targetDepartment" defaultValue={activeSlotEditor.initialData.targetDepartment} required className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs">
                          <option value="" disabled>Select</option>
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-xs">Year</Label>
                        <select name="targetYear" defaultValue={activeSlotEditor.initialData.targetYear} required className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs">
                          <option value="" disabled>Select</option>
                          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-xs">Section</Label>
                        <select name="targetSection" defaultValue={activeSlotEditor.initialData.targetSection} required className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs">
                          <option value="" disabled>Select</option>
                          {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
              
              <div className="flex gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setActiveSlotEditor(null)}>Cancel</Button>
                {activeSlotEditor.slotIndex >= 0 && (
                  <Button type="button" variant="destructive" onClick={handleDeleteSlot}>Clear Slot</Button>
                )}
                <Button type="submit" className={`flex-1 ${activeSlotEditor.type === 'Exam' ? 'bg-purple-600 hover:bg-purple-700' : activeSlotEditor.type === 'Regular' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white`}>
                  {activeSlotEditor.slotIndex >= 0 ? 'Update Slot' : 'Save Slot'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default TimetablePage;
