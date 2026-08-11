import React from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, GraduationCap, Building, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudents } from '@/hooks/useStudents';
import { useFaculty } from '@/hooks/useFaculty';
import { useDepartments } from '@/hooks/useDepartments';
import { useCourses } from '@/hooks/useCourses';
import { useState } from 'react';
import AttendanceChart from '@/components/charts/AttendanceChart';
import PerformanceChart from '@/components/charts/PerformanceChart';

const AdminDashboard = () => {
  const { students } = useStudents();
  const { faculty } = useFaculty();
  const { departments } = useDepartments();
  const { courses } = useCourses();

  const [dashboardDept, setDashboardDept] = useState('All');
  const [dashboardYear, setDashboardYear] = useState('All');

  const stats = [
    { title: 'Total Students', value: students?.length || 0, icon: <Users className="w-6 h-6 text-blue-500" />, trend: 'Active students' },
    { title: 'Total Faculty', value: faculty?.length || 0, icon: <GraduationCap className="w-6 h-6 text-indigo-500" />, trend: 'Active faculty' },
    { title: 'Departments', value: departments?.length || 0, icon: <Building className="w-6 h-6 text-purple-500" />, trend: 'All departments' },
    { title: 'Active Courses', value: courses?.length || 0, icon: <BookOpen className="w-6 h-6 text-emerald-500" />, trend: 'Across all semesters' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">Welcome back to the SVCET Admin Portal. Here is what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
                <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-300 truncate">
                  {stat.title}
                </CardTitle>
                <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {stat.trend}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-lg font-semibold">Analytics Filters</h2>
          <p className="text-sm text-neutral-500">Filter the charts below by department and year.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select 
            className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dashboardDept}
            onChange={(e) => setDashboardDept(e.target.value)}
          >
            <option value="All">All Departments</option>
            {['CSE', 'AIML', 'AIDS', 'CS', 'IT', 'EEE', 'ECE', 'MECH', 'CIVIL'].map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select 
            className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dashboardYear}
            onChange={(e) => setDashboardYear(e.target.value)}
          >
            <option value="All">All Years</option>
            {['1', '2', '3', '4'].map(year => (
              <option key={year} value={year}>{year} Year</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Analytics Charts */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur h-full flex flex-col">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-medium truncate">Daily Attendance Trends</CardTitle>
              <p className="text-xs text-neutral-500 mt-1 line-clamp-2">Average daily attendance rate over the last 6 days</p>
            </CardHeader>
            <CardContent className="flex-1 pt-6 pb-2 pl-0">
              <AttendanceChart departmentFilter={dashboardDept} yearFilter={dashboardYear} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur h-full flex flex-col">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-medium truncate">Department Performance</CardTitle>
              <p className="text-xs text-neutral-500 mt-1 line-clamp-2">Average scores vs Pass rates by department</p>
            </CardHeader>
            <CardContent className="flex-1 pt-6 pb-2 pr-4 pl-0">
              <PerformanceChart departmentFilter={dashboardDept} yearFilter={dashboardYear} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
