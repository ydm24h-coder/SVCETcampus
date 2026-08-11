import React, { useMemo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAssessments } from '@/hooks/useAssessments';
import { useStudents } from '@/hooks/useStudents';
import { useDepartments } from '@/hooks/useDepartments';

const PerformanceChart = ({ departmentFilter = 'All', yearFilter = 'All' }) => {
  const { assessments } = useAssessments();
  const { students } = useStudents();
  const { departments } = useDepartments();

  const chartData = useMemo(() => {
    let groups = {};
    if (departmentFilter === 'All') {
       departments.forEach(d => { groups[d.name] = { totalScore: 0, count: 0, passCount: 0 }; });
    } else if (yearFilter === 'All') {
       ['1', '2', '3', '4'].forEach(y => { groups[y] = { totalScore: 0, count: 0, passCount: 0 }; });
    } else {
       groups[`${departmentFilter} Yr ${yearFilter}`] = { totalScore: 0, count: 0, passCount: 0 };
    }

    const allSubmissions = [];
    (assessments.code || []).forEach(a => allSubmissions.push(...(a.submissions || [])));
    (assessments.mcq || []).forEach(a => allSubmissions.push(...(a.submissions || [])));

    allSubmissions.forEach(sub => {
      const student = students.find(s => s.name === sub.studentName);
      if (student && student.department && student.year) {
        if (departmentFilter !== 'All' && student.department !== departmentFilter) return;
        if (yearFilter !== 'All' && String(student.year) !== String(yearFilter)) return;

        let targetGroup;
        if (departmentFilter === 'All') targetGroup = student.department;
        else if (yearFilter === 'All') targetGroup = String(student.year);
        else targetGroup = `${departmentFilter} Yr ${yearFilter}`;

        if (groups[targetGroup]) {
          let scoreStr = String(sub.score || '0');
          let scoreVal = parseInt(scoreStr.split('/')[0]) || 0;
          groups[targetGroup].totalScore += scoreVal;
          groups[targetGroup].count += 1;
          if (scoreVal >= 50) {
            groups[targetGroup].passCount += 1;
          }
        }
      }
    });

    const data = Object.keys(groups).map((key, index) => {
      const stats = groups[key];
      const avgScore = stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0;
      const passRate = stats.count > 0 ? Math.round((stats.passCount / stats.count) * 100) : 0;
      
      let label = key;
      if (departmentFilter === 'All') {
        label = key.length > 5 ? key.substring(0, 4).toUpperCase() : key.toUpperCase();
      } else if (yearFilter === 'All') {
        label = `Year ${key}`;
      }
      
      return {
        dept: label,
        avgScore,
        passRate
      };
    });

    if (data.length === 0) {
      if (departmentFilter !== 'All' && yearFilter === 'All') {
        return [
          { dept: 'Year 1', avgScore: 0, passRate: 0 },
          { dept: 'Year 2', avgScore: 0, passRate: 0 }
        ];
      }
      return [
        { dept: 'CSE', avgScore: 0, passRate: 0 },
        { dept: 'IT', avgScore: 0, passRate: 0 }
      ];
    }
    return data;
  }, [assessments, students, departments, departmentFilter, yearFilter]);
  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
            </linearGradient>
            <filter id="glowCyan">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
          <XAxis dataKey="dept" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[50, 100]} />
          <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[50, 100]} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '8px', color: '#fff', backdropFilter: 'blur(10px)' }}
            cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
          <Bar 
            yAxisId="left" 
            dataKey="avgScore" 
            name="Avg Score (%)" 
            barSize={20} 
            fill="url(#colorScore)" 
            radius={[4, 4, 0, 0]} 
            animationDuration={1500}
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="passRate" 
            name="Pass Rate (%)" 
            stroke="#06b6d4" 
            strokeWidth={3} 
            dot={{ r: 4, strokeWidth: 2, fill: '#0f172a' }} 
            activeDot={{ r: 6, fill: '#06b6d4', strokeWidth: 0 }}
            filter="url(#glowCyan)"
            animationDuration={1500}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;
