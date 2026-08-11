import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, BarChart3 } from 'lucide-react';
import { ComposedChart, Bar, Line, Area, ReferenceLine, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export const ActivityHeatmap = ({ activityLog = [] }) => {
  const [graphView, setGraphView] = useState('weekly');
  const today = new Date();
  
  const daysToCurrentDay = today.getDay(); // 0-6
  const numWeeks = 20; // 20 weeks for a nice rich history view
  const totalDays = (numWeeks - 1) * 7 + (daysToCurrentDay + 1);

  const days = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({
      date: d,
      dateStr: d.toISOString().split('T')[0],
    });
  }

  const activityCounts = activityLog.reduce((acc, dateStr) => {
    acc[dateStr] = (acc[dateStr] || 0) + 1;
    return acc;
  }, {});

  const totalActiveDays = Object.keys(activityCounts).length;
  
  const getColorClass = (count) => {
    if (!count) return 'bg-neutral-200 dark:bg-neutral-700/80';
    return 'bg-red-600 dark:bg-red-500';
  };

  const numColumns = Math.floor((totalDays + days[0].date.getDay() - 1) / 7) + 1;
  const columns = Array.from({ length: numColumns }, () => null);
  
  days.forEach((day, index) => {
    const colIndex = Math.floor((index + days[0].date.getDay()) / 7);
    if (!columns[colIndex]) columns[colIndex] = day;
  });

  const getGraphData = () => {
    if (graphView === 'weekly') {
      const wData = Array.from({ length: numColumns }, () => ({ name: '', activity: 0 }));
      days.forEach((day, index) => {
        const colIndex = Math.floor((index + days[0].date.getDay()) / 7);
        wData[colIndex].activity += (activityCounts[day.dateStr] || 0);
        if (wData[colIndex].name === '') {
          wData[colIndex].name = day.date.toLocaleString('default', { month: 'short', day: 'numeric' });
        }
      });
      return wData;
    }
    
    if (graphView === 'monthly') {
      const mData = [];
      for(let i=11; i>=0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const prefix = `${year}-${month}`;
        
        let count = 0;
        activityLog.forEach(dateStr => {
          if (dateStr.startsWith(prefix)) count++;
        });
        mData.push({ name: d.toLocaleString('default', { month: 'short' }), activity: count, fullMonth: d.toLocaleString('default', { month: 'long', year: 'numeric' }) });
      }
      return mData;
    }
    
    if (graphView === 'yearly') {
      const yData = [];
      const currentYear = today.getFullYear();
      for(let i=4; i>=0; i--) {
        const yStr = (currentYear - i).toString();
        let count = 0;
        activityLog.forEach(dateStr => {
          if (dateStr.startsWith(yStr)) count++;
        });
        yData.push({ name: yStr, activity: count });
      }
      return yData;
    }
    
    if (graphView === 'overall') {
      const dowData = [
        { name: 'Sun', activity: 0 },
        { name: 'Mon', activity: 0 },
        { name: 'Tue', activity: 0 },
        { name: 'Wed', activity: 0 },
        { name: 'Thu', activity: 0 },
        { name: 'Fri', activity: 0 },
        { name: 'Sat', activity: 0 },
      ];
      activityLog.forEach(dateStr => {
        const d = new Date(dateStr);
        if(!isNaN(d.getTime())) {
          dowData[d.getDay()].activity++;
        }
      });
      return dowData;
    }
    return [];
  };

  const graphData = getGraphData();
  const averageActivity = graphData.length > 0 
    ? (graphData.reduce((sum, item) => sum + item.activity, 0) / graphData.length).toFixed(1)
    : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      let title = label;
      if (graphView === 'weekly') title = `Week of ${label}`;
      else if (graphView === 'monthly') title = payload[0].payload.fullMonth;
      else if (graphView === 'yearly') title = `Year ${label}`;
      else if (graphView === 'overall') title = `${label}days`;

      return (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-lg shadow-xl">
          <p className="text-xs text-neutral-500 mb-1">{title}</p>
          <p className="text-sm font-bold text-red-600 dark:text-red-500">
            {payload[0].value} {payload[0].value === 1 ? 'Activity' : 'Activities'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 md:col-span-2 shadow-sm overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              Activity History
            </CardTitle>
            <CardDescription className="mt-1">
              {totalActiveDays} active days out of the last {totalDays}.
            </CardDescription>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800/50 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700/50">
            <Activity className="w-4 h-4 text-red-500" />
            <span>Consistency is key</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2 -mx-2 px-2 custom-scrollbar">
          <div className="min-w-max flex gap-2">
            {/* Day Labels */}
            <div className="grid grid-rows-7 gap-1.5 text-[10px] font-medium text-neutral-400 pt-[18px] pr-2">
              <div className="h-3 sm:h-4 flex items-center justify-end"></div>
              <div className="h-3 sm:h-4 flex items-center justify-end">Mon</div>
              <div className="h-3 sm:h-4 flex items-center justify-end"></div>
              <div className="h-3 sm:h-4 flex items-center justify-end">Wed</div>
              <div className="h-3 sm:h-4 flex items-center justify-end"></div>
              <div className="h-3 sm:h-4 flex items-center justify-end">Fri</div>
              <div className="h-3 sm:h-4 flex items-center justify-end"></div>
            </div>
            
            <div className="flex flex-col">
              {/* Month Labels */}
              <div className="flex gap-1.5 mb-1.5 text-[10px] font-medium text-neutral-400 h-3">
                {columns.map((colDay, i) => {
                  if (!colDay) return <div key={i} className="w-3 sm:w-4 flex-shrink-0" />;
                  let isNewMonth = false;
                  if (i === 0 || colDay.date.getDate() <= 7) {
                    isNewMonth = true;
                  }
                  return (
                    <div key={i} className="w-3 sm:w-4 flex-shrink-0 relative">
                      {isNewMonth && (
                        <span className="absolute -left-1 whitespace-nowrap">{colDay.date.toLocaleString('default', { month: 'short' })}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Heatmap Grid */}
              <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5">
                {/* Pad first week if it doesn't start on Sunday */}
                {Array.from({ length: days[0].date.getDay() }).map((_, i) => (
                  <div key={`pad-${i}`} className="w-3 h-3 sm:w-4 sm:h-4 bg-transparent" />
                ))}
                
                {days.map((day, idx) => {
                  const count = activityCounts[day.dateStr] || 0;
                  return (
                    <div 
                      key={idx} 
                      title={`${day.date.toDateString()}: ${count} activity${count !== 1 ? 's' : ''}`}
                      className={`w-3 h-3 sm:w-4 sm:h-4 rounded-[3px] transition-all duration-300 cursor-pointer hover:ring-2 hover:ring-neutral-400 hover:ring-offset-1 dark:hover:ring-offset-neutral-900 hover:scale-110 ${getColorClass(count)}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-6 flex items-center justify-end gap-4 text-xs text-neutral-500 font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-[2px] bg-neutral-200 dark:bg-neutral-700/80" />
              <span>Inactive</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-[2px] bg-red-600 dark:bg-red-500" />
              <span>Active</span>
            </div>
          </div>
        </div>

        {/* Dynamic Activity Graph */}
        <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-red-500" />
              Activity Breakdown & Vectors
            </h3>
            <div className="flex flex-wrap sm:flex-nowrap justify-center bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-lg gap-1 relative">
              {['weekly', 'monthly', 'yearly', 'overall'].map((view) => (
                <button 
                  key={view}
                  onClick={() => setGraphView(view)}
                  className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors z-10 ${graphView === view ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                >
                  {graphView === view && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white dark:bg-neutral-700 rounded-md shadow-sm -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar pb-2">
            <div style={{ width: Math.max(500, graphData.length * 40), height: 220 }}>
                <ComposedChart width={Math.max(500, graphData.length * 40)} height={220} data={graphData} margin={{ top: 15, right: 15, left: -25, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#888888' }} 
                  tickLine={false} 
                  axisLine={false}
                  minTickGap={20}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#888888' }} 
                  tickLine={false} 
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(220, 38, 38, 0.05)' }} />
                
                <Area 
                  type="monotone" 
                  dataKey="activity" 
                  fill="#fee2e2" 
                  stroke="none" 
                  fillOpacity={0.5}
                  isAnimationActive={false}
                />
                
                <ReferenceLine 
                  y={Number(averageActivity)} 
                  stroke="#999" 
                  strokeDasharray="3 3" 
                  label={{ position: 'top', value: 'Avg', fill: '#888', fontSize: 10 }} 
                />

                <Bar dataKey="activity" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
                  {graphData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.activity > 0 ? '#dc2626' : '#e5e5e5'} 
                      className={entry.activity === 0 ? "dark:fill-neutral-800" : ""}
                    />
                  ))}
                </Bar>
                
                <Line 
                  type="monotone" 
                  dataKey="activity" 
                  stroke="#b91c1c" 
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 5, fill: '#dc2626', stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
