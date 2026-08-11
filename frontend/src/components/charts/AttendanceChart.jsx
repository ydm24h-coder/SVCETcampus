import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAttendance } from '@/hooks/useAttendance';
import { useStudents } from '@/hooks/useStudents';

const AttendanceChart = ({ departmentFilter = 'All', yearFilter = 'All' }) => {
  const { students: attendanceRecords } = useAttendance();
  const { students: allStudents } = useStudents();

  const chartData = useMemo(() => {
    let filteredStudents = allStudents;
    
    if (departmentFilter !== 'All') {
      filteredStudents = filteredStudents.filter(s => s.department === departmentFilter);
    }
    if (yearFilter !== 'All') {
      filteredStudents = filteredStudents.filter(s => String(s.year) === String(yearFilter));
    }
    
    const totalStudents = filteredStudents.length;
    const filteredRecordIds = filteredStudents.map(s => s.id);
    const presentCount = attendanceRecords.filter(r => r.status === 'Present' && filteredRecordIds.includes(r.id)).length;
    
    // If there are no students, default to 100%. If there are students but no attendance records, default to 0%.
    // Usually, 100% is better for an empty system to look positive.
    let todayPercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 100;

    const data = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      let d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      if (i === 0) {
        data.push({ day: 'Today', attendance: todayPercentage });
      } else {
        data.push({ day: dayStr, attendance: 0 });
      }
    }
    return data;
  }, [attendanceRecords, allStudents, departmentFilter, yearFilter]);
  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <filter id="lineGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
          <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 100]} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '8px', color: '#fff', backdropFilter: 'blur(10px)' }}
            itemStyle={{ color: '#60a5fa' }}
            cursor={{ stroke: 'rgba(59, 130, 246, 0.2)', strokeWidth: 2, fill: 'rgba(59, 130, 246, 0.05)' }}
          />
          <Area 
            type="monotone" 
            dataKey="attendance" 
            name="Attendance %"
            stroke="#3b82f6" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorAttendance)" 
            animationDuration={1500}
            filter="url(#lineGlow)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceChart;
