import React, { useState, useMemo } from 'react';
import { BookOpen, MapPin, ArrowLeft, Play, ExternalLink, GraduationCap, Clock, Award, Search, Filter, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCourses } from '@/hooks/useCourses';
import { useSmartFilters } from '@/hooks/useSmartFilters';
import SmartFilter from '@/components/SmartFilter';
import { useDepartments } from '@/hooks/useDepartments';

const MyCoursesPage = () => {
  const { courses } = useCourses();
  const [selectedDomain, setSelectedDomain] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  
  // Progress state (session-based mock)
  const [completedMilestones, setCompletedMilestones] = useState({});

  // Get unique departments for filter dropdown dynamically based on available courses
  const mappedCourses = useMemo(() => courses.map(c => ({ ...c, department: c.dept })), [courses]);
  const { availableDepartments } = useSmartFilters(mappedCourses, filterDept, 'All');

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return mappedCourses.filter(course => {
      const matchesSearch = (course.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (course.code || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = filterDept === 'All' || course.department === filterDept;
      return matchesSearch && matchesDept;
    });
  }, [mappedCourses, searchQuery, filterDept]);

  const toggleMilestone = (milestoneId) => {
    setCompletedMilestones(prev => ({
      ...prev,
      [milestoneId]: !prev[milestoneId]
    }));
  };

  // -----------------------------------------------------
  // ROADMAP VIEWER (STUDENT)
  // -----------------------------------------------------
  if (selectedDomain) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedDomain(null)} className="pl-0 hover:bg-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Domains
          </Button>
        </div>
        
        <div>
          <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
            {selectedDomain.dept}
          </Badge>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">{selectedDomain.name}</h1>
              <p className="text-neutral-500 dark:text-neutral-400 mt-2">Follow this roadmap to master the domain.</p>
            </div>
            
            {/* Progress Circle Overview */}
            {selectedDomain.roadmap && selectedDomain.roadmap.length > 0 && (
              <div className="flex items-center gap-3 bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm shrink-0">
                <div className="w-12 h-12 rounded-full border-4 border-neutral-100 dark:border-neutral-800 flex items-center justify-center relative">
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-blue-500"
                      strokeDasharray={`${
                        selectedDomain.roadmap 
                          ? (selectedDomain.roadmap.filter(m => completedMilestones[m.id]).length / selectedDomain.roadmap.length) * 100 
                          : 0
                      }, 100`}
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    {selectedDomain.roadmap ? Math.round((selectedDomain.roadmap.filter(m => completedMilestones[m.id]).length / selectedDomain.roadmap.length) * 100) : 0}%
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-bold text-neutral-900 dark:text-white">Progress</p>
                  <p className="text-neutral-500 text-xs">
                    {selectedDomain.roadmap.filter(m => completedMilestones[m.id]).length} / {selectedDomain.roadmap.length} Milestones
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-8">
          {!selectedDomain.roadmap || selectedDomain.roadmap.length === 0 ? (
            <div className="text-center p-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50">
              <BookOpen className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Coming Soon</h3>
              <p className="text-neutral-500 text-sm mt-1">The roadmap for this domain is currently being built by the faculty.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-blue-200 dark:before:via-blue-900/50 before:to-transparent">
              {selectedDomain.roadmap.map((milestone, index) => (
                <div key={milestone.id} className="relative flex items-start group">
                  <div className="absolute left-0 -ml-6 mt-1 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-4 border-white dark:border-[#0a0a0a] bg-blue-500 shadow-sm z-10 flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">{index + 1}</span>
                    </div>
                  </div>
                  <Card className={`w-full border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all duration-300 ${completedMilestones[milestone.id] ? 'bg-green-50/30 dark:bg-green-900/10 border-green-200 dark:border-green-900/30' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className={`font-bold text-xl ${completedMilestones[milestone.id] ? 'text-green-700 dark:text-green-400 line-through opacity-70' : ''}`}>{milestone.title}</h4>
                        <button 
                          onClick={() => toggleMilestone(milestone.id)}
                          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                            completedMilestones[milestone.id] 
                              ? 'bg-green-500 text-white hover:bg-green-600' 
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                          }`}
                        >
                          {completedMilestones[milestone.id] ? (
                            <><CheckCircle2 className="w-4 h-4" /> Completed</>
                          ) : (
                            <><Circle className="w-4 h-4" /> Mark Complete</>
                          )}
                        </button>
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-4">
                        {milestone.description}
                      </p>
                      
                      {/* Rich Links */}
                      {(milestone.tamilVideoUrl || milestone.englishVideoUrl || (milestone.usefulLinks && milestone.usefulLinks.length > 0)) && (
                        <div className="flex flex-wrap gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                          {milestone.tamilVideoUrl && (
                            <a href={milestone.tamilVideoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 text-sm font-medium transition-colors">
                              <Play className="w-4 h-4" /> Tamil Video
                            </a>
                          )}
                          {milestone.englishVideoUrl && (
                            <a href={milestone.englishVideoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 text-sm font-medium transition-colors">
                              <Play className="w-4 h-4" /> English Video
                            </a>
                          )}
                          {milestone.usefulLinks && milestone.usefulLinks.map((link, i) => (
                            <a key={i} href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 text-sm font-medium transition-colors">
                              <ExternalLink className="w-4 h-4" /> Resource {i + 1}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Certification Section */}
                      {(milestone.certDescription || milestone.certLink) && (
                        <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/50 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                          <div>
                            <h5 className="font-bold text-amber-700 dark:text-amber-500 flex items-center gap-2 mb-1">
                              <Award className="w-4 h-4" /> Free Certification Available
                            </h5>
                            <p className="text-sm text-amber-600/90 dark:text-amber-400/80">
                              {milestone.certDescription || "Complete this milestone and earn a certificate!"}
                            </p>
                          </div>
                          {milestone.certLink && (
                            <a href={milestone.certLink} target="_blank" rel="noreferrer" className="inline-flex whitespace-nowrap items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-sm transition-colors">
                              Claim Certificate <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------
  // DOMAIN GRID VIEW
  // -----------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Learning Domains</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-lg">Explore available technical domains and their complete learning roadmaps.</p>
        </div>
        
        {/* Search & Filters */}
        <div className="w-full mt-4 md:mt-0">
          <SmartFilter 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterDept={filterDept}
            setFilterDept={setFilterDept}
            availableDepartments={availableDepartments}
            showYear={false}
            showSection={false}
            searchPlaceholder="Search domains..."
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map(course => {
          const totalMilestones = course.roadmap?.length || 0;
          const completedCount = course.roadmap ? course.roadmap.filter(m => completedMilestones[m.id]).length : 0;
          const progressPercent = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;

          return (
          <Card key={course.id} className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col hover:border-blue-400 hover:shadow-xl hover:shadow-blue-900/10 dark:hover:border-blue-500 transition-all duration-300 cursor-pointer group transform hover:-translate-y-1" onClick={() => setSelectedDomain(course)}>
            <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-t-xl pb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                  {course.code}
                </span>
              </div>
              <CardTitle className="text-xl leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{course.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex-1 flex flex-col gap-4">
              <div className="space-y-3">
                <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                  <GraduationCap className="w-4 h-4 mr-2 text-indigo-500" />
                  <span>{course.dept}</span>
                </div>
                <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                  <BookOpen className="w-4 h-4 mr-2 text-orange-500" />
                  <span>{course.credits} Credits</span>
                </div>
                <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                  <MapPin className="w-4 h-4 mr-2 text-emerald-500" />
                  <span>{totalMilestones} Milestones</span>
                </div>
              </div>

              {/* Progress Bar Mini */}
              {totalMilestones > 0 && (
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-neutral-500">Progress</span>
                    <span className={progressPercent > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400'}>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
              
              <Button className="w-full mt-auto bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 transition-colors">
                Continue Learning
              </Button>
            </CardContent>
          </Card>
        )})}
        {filteredCourses.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-16 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl bg-white dark:bg-neutral-900/50">
            <Search className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-4" />
            <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">No domains found</h3>
            <p className="text-neutral-500 mt-2 max-w-sm text-center">We couldn't find any domains matching your search or filter criteria. Try adjusting them.</p>
            <Button variant="outline" className="mt-6" onClick={() => { setSearchQuery(''); setFilterDept('All'); }}>Clear Filters</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCoursesPage;
