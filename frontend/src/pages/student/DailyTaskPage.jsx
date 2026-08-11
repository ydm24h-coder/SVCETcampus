import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, CheckCircle, ArrowLeft, Terminal, Star, Code2, FileText, History, ListChecks, Keyboard, XCircle, Clock, Cpu, Moon, Sun, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import { playAchievementSound, playSadSound } from '@/utils/audio';
import confetti from 'canvas-confetti';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import Editor from '@monaco-editor/react';

const DailyTaskPage = () => {
  const navigate = useNavigate();
  const [currentTask, setCurrentTask] = useState(null);
  const [language, setLanguage] = useState('python');
  const [codeContent, setCodeContent] = useState('');
  const [customInput, setCustomInput] = useState('');
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [runResult, setRunResult] = useState(null);

  const [showPopup, setShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  
  const [layoutType, setLayoutType] = useState(1);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('dark');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      setIsDark(true);
    }
  };

  const { completeDailyTask, students } = useLeaderboard();
  const { getDailyTask } = useDailyTasks();
  
  const sessionUser = JSON.parse(localStorage.getItem('svcet_session_student')) || { name: 'Demo Student' };
  
  const userStats = students.find(s => s.name === sessionUser.name) || { dailyTaskLog: [] };
  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = (userStats.dailyTaskLog || []).includes(today);

  useEffect(() => {
    document.title = 'Daily Task';
    const task = getDailyTask();
    setCurrentTask(task);
    if (task && task.starterCode) {
      setCodeContent(task.starterCode[language] || '');
    }
  }, []);

  useEffect(() => {
    if (currentTask && currentTask.starterCode) {
      setCodeContent(currentTask.starterCode[language] || '');
    }
  }, [language, currentTask]);

  const handleRunCode = async () => {
    setIsExecuting(true);
    setBottomTab('result');
    setRunResult(null);

    setTimeout(() => {
      const isStarterCode = codeContent.trim() === (currentTask?.starterCode?.[language] || '').trim();
      const isSuccess = !isStarterCode && codeContent.length > 20;
      
      setRunResult(isSuccess ? 'Passed' : 'Failed');
      setIsExecuting(false);
    }, 1200);
  };

  const handleSubmit = () => {
    if (isCompletedToday && !submissionResult) {
      setSubmissionResult({
        status: 'Accepted',
        runtime: 42,
        runtimeBeats: 88.5,
        memory: 16.2,
        memoryBeats: 50.1
      });
      setLeftTab('submissions');
      return;
    }

    setIsSubmitting(true);
    setLeftTab('submissions');
    setSubmissionResult(null);

    setTimeout(() => {
      const isStarterCode = codeContent.trim() === (currentTask?.starterCode?.[language] || '').trim();
      const isSuccess = !isStarterCode && codeContent.length > 20;

      if (isSuccess) {
        playAchievementSound();
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#3b82f6', '#ef4444', '#10b981', '#a855f7'],
          zIndex: 100
        });
        
        completeDailyTask(sessionUser.name);
        
        const runtime = Math.floor(Math.random() * 40) + 15;
        const runtimeBeats = (Math.random() * 30 + 65).toFixed(2);
        const memory = (Math.random() * 5 + 14).toFixed(1);
        const memoryBeats = (Math.random() * 40 + 45).toFixed(2);

        setSubmissionResult({
          status: 'Accepted',
          runtime,
          runtimeBeats,
          memory,
          memoryBeats
        });
        
        setShowPopup(true);
      } else {
        playSadSound();
        setSubmissionResult({
          status: 'Wrong Answer',
          message: 'Output did not match expected output for hidden test case #3.'
        });
      }
      setIsSubmitting(false);
    }, 1500);
  };

  const [leftTab, setLeftTab] = useState('description');
  const [bottomTab, setBottomTab] = useState('testcases');

  // Helper render functions for panels
  const renderDescriptionPane = () => (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#1a1a1a] rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm relative z-0">
      <div className="flex bg-neutral-50 dark:bg-[#222] border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <button 
          className={`px-4 py-2 text-xs font-medium flex items-center gap-2 transition-colors ${leftTab === 'description' ? 'border-b-2 border-b-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-[#1a1a1a]' : 'border-b-2 border-b-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
          onClick={() => setLeftTab('description')}
        >
          <FileText className="w-3.5 h-3.5" /> Description
        </button>
        <button 
          className={`px-4 py-2 text-xs font-medium flex items-center gap-2 transition-colors ${leftTab === 'submissions' ? 'border-b-2 border-b-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-[#1a1a1a]' : 'border-b-2 border-b-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
          onClick={() => setLeftTab('submissions')}
        >
          <History className="w-3.5 h-3.5" /> Submissions
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#1a1a1a] relative">
        {leftTab === 'description' ? (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{currentTask?.id}. {currentTask?.title}</h2>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                currentTask?.difficulty === 'Easy' ? 'bg-green-100/50 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                currentTask?.difficulty === 'Medium' ? 'bg-yellow-100/50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-red-100/50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {currentTask?.difficulty}
              </span>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-neutral-700 dark:text-neutral-300">
              {currentTask?.problemStatement}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {isSubmitting ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
                <p className="text-neutral-500 text-sm animate-pulse">Evaluating hidden test cases...</p>
              </div>
            ) : submissionResult ? (
              <div className="flex-1 p-6 overflow-y-auto">
                {submissionResult.status === 'Accepted' ? (
                  <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                      <CheckCircle className="w-10 h-10 text-green-500 dark:text-green-400" />
                      <div>
                        <h2 className="text-3xl font-black text-green-500 dark:text-green-400 tracking-tight">Accepted</h2>
                        <p className="text-neutral-500 text-sm mt-1">Submitted successfully</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="bg-neutral-50 dark:bg-[#222] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                            <Clock className="w-5 h-5 text-amber-500" />
                            <span className="font-bold text-lg">Runtime</span>
                          </div>
                          <div className="text-3xl font-black text-neutral-900 dark:text-white">
                            {submissionResult.runtime} <span className="text-sm font-semibold text-neutral-500">ms</span>
                          </div>
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                          Beats <strong className="text-green-600 dark:text-green-400 text-lg">{submissionResult.runtimeBeats}%</strong> of users with Python3
                        </div>
                        <div className="relative pt-4 pb-2">
                          <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${submissionResult.runtimeBeats}%` }}></div>
                          </div>
                          <div className="absolute top-0 right-0 -mt-2 text-[10px] font-bold text-neutral-400">100%</div>
                          <div className="absolute top-0 left-0 -mt-2 text-[10px] font-bold text-neutral-400">0%</div>
                        </div>
                      </div>
                      <div className="bg-neutral-50 dark:bg-[#222] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                            <Cpu className="w-5 h-5 text-amber-500" />
                            <span className="font-bold text-lg">Memory</span>
                          </div>
                          <div className="text-3xl font-black text-neutral-900 dark:text-white">
                            {submissionResult.memory} <span className="text-sm font-semibold text-neutral-500">MB</span>
                          </div>
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                          Beats <strong className="text-green-600 dark:text-green-400 text-lg">{submissionResult.memoryBeats}%</strong> of users with Python3
                        </div>
                        <div className="relative pt-4 pb-2">
                          <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${submissionResult.memoryBeats}%` }}></div>
                          </div>
                          <div className="absolute top-0 right-0 -mt-2 text-[10px] font-bold text-neutral-400">100%</div>
                          <div className="absolute top-0 left-0 -mt-2 text-[10px] font-bold text-neutral-400">0%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 p-6 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                      <XCircle className="w-10 h-10 text-red-500 dark:text-red-400" />
                      <div>
                        <h2 className="text-3xl font-black text-red-500 dark:text-red-400 tracking-tight">Wrong Answer</h2>
                        <p className="text-neutral-500 text-sm mt-1">Failed hidden test cases</p>
                      </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl p-5 text-red-800 dark:text-red-300 font-medium">
                      {submissionResult.message}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 p-8 text-center space-y-4">
                <History className="w-12 h-12 opacity-20" />
                <p>Submit your code to see detailed Time and Space complexity graphs.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderEditorPane = () => (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm text-[#d4d4d4] relative z-0">
      <div className="flex items-center justify-between bg-[#2d2d2d] border-b border-[#404040] px-2 py-1 shrink-0">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-green-500 ml-1" />
          <span className="text-xs font-semibold text-neutral-300">Code</span>
        </div>
        <div className="flex gap-1.5">
          {['python', 'cpp', 'c', 'java'].map((lang) => (
            <button 
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
                language === lang 
                  ? 'bg-[#4d4d4d] text-white shadow-sm' 
                  : 'text-[#9cdcfe] hover:bg-[#3d3d3d]'
              }`}
            >
              {lang === 'python' ? 'Python3' : lang === 'cpp' ? 'C++' : lang === 'c' ? 'C' : 'Java'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 relative flex overflow-hidden">
        <Editor
          height="100%"
          language={language === 'python' ? 'python' : language === 'cpp' ? 'cpp' : language === 'c' ? 'c' : 'java'}
          theme={isDark ? 'vs-dark' : 'light'}
          value={codeContent}
          onChange={(value) => setCodeContent(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            padding: { top: 16 }
          }}
        />
      </div>
    </div>
  );

  const renderTerminalPane = () => (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#1a1a1a] rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm relative z-0">
      <div className="flex items-center justify-between bg-neutral-50 dark:bg-[#222] border-b border-neutral-200 dark:border-neutral-800 pr-2 shrink-0">
        <div className="flex">
          <button 
            className={`px-4 py-2 text-xs font-medium flex items-center gap-2 transition-colors ${bottomTab === 'testcases' ? 'border-b-2 border-b-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-[#1a1a1a]' : 'border-b-2 border-b-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            onClick={() => setBottomTab('testcases')}
          >
            <ListChecks className="w-3.5 h-3.5" /> Testcases
          </button>
          <button 
            className={`px-4 py-2 text-xs font-medium flex items-center gap-2 transition-colors ${bottomTab === 'input' ? 'border-b-2 border-b-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-[#1a1a1a]' : 'border-b-2 border-b-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            onClick={() => setBottomTab('input')}
          >
            <Keyboard className="w-3.5 h-3.5" /> Custom Input
          </button>
          <button 
            className={`px-4 py-2 text-xs font-medium flex items-center gap-2 transition-colors ${bottomTab === 'result' ? 'border-b-2 border-b-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-[#1a1a1a]' : 'border-b-2 border-b-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
            onClick={() => setBottomTab('result')}
          >
            <Terminal className="w-3.5 h-3.5" /> Test Result
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-white dark:bg-neutral-950 relative">
        {bottomTab === 'testcases' && (
          <div className="p-4 space-y-6">
            {currentTask?.testCases?.map((tc, idx) => (
              <div key={idx} className="space-y-2">
                <div className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  Test Case {idx + 1}
                </div>
                <div className="grid grid-cols-1 gap-2 pl-7">
                  <div>
                    <div className="text-neutral-500 mb-1 font-sans font-medium text-[11px] uppercase tracking-wider">Input</div>
                    <div className="bg-neutral-50 dark:bg-[#1a1a1a] p-2.5 rounded-md border border-neutral-200 dark:border-neutral-800 font-mono text-xs text-[#1a1a1a] dark:text-[#d4d4d4] whitespace-pre-wrap">
                      {tc.input}
                    </div>
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-neutral-500 text-sm">No test cases available for this problem.</div>
            )}
          </div>
        )}

        {bottomTab === 'input' && (
          <div className="h-full flex flex-col p-4">
            <div className="text-neutral-500 mb-1.5 font-sans font-medium text-[11px] uppercase tracking-wider">Standard Input (stdin)</div>
            <Textarea 
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Type any custom input data your program needs here..."
              className="flex-1 resize-none font-mono text-xs bg-neutral-50 dark:bg-[#1a1a1a] border-neutral-200 dark:border-neutral-800 focus-visible:ring-1 focus-visible:ring-amber-500"
            />
          </div>
        )}

        {bottomTab === 'result' && (
          <div className="h-full flex flex-col">
            {isExecuting ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
                <p className="text-neutral-500 text-sm animate-pulse">Running test cases...</p>
              </div>
            ) : runResult ? (
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="mb-6 flex items-center gap-3">
                  {runResult === 'Passed' ? (
                    <>
                      <h2 className="text-3xl font-black text-green-500 dark:text-green-400 tracking-tight">Accepted</h2>
                      <CheckCircle className="w-8 h-8 text-green-500 dark:text-green-400" />
                    </>
                  ) : (
                    <>
                      <h2 className="text-3xl font-black text-red-500 dark:text-red-400 tracking-tight">Wrong Answer</h2>
                      <XCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
                    </>
                  )}
                </div>
                
                <div className="space-y-6">
                  {currentTask?.testCases?.map((tc, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        Test Case {idx + 1}
                        {runResult === 'Passed' ? (
                          <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                        ) : idx === 0 ? (
                          <XCircle className="w-4 h-4 text-red-500 ml-2" />
                        ) : (
                          <span className="text-xs text-neutral-400 ml-2 italic">Skipped</span>
                        )}
                      </div>
                      
                      {(runResult === 'Passed' || idx === 0) && (
                        <div className="grid grid-cols-1 gap-3 pl-7 mt-2">
                          <div>
                            <div className="text-neutral-500 mb-1 font-sans font-medium text-[11px] uppercase tracking-wider">Input</div>
                            <div className="bg-neutral-50 dark:bg-[#1a1a1a] p-2.5 rounded-md border border-neutral-200 dark:border-neutral-800 font-mono text-xs text-[#1a1a1a] dark:text-[#d4d4d4] whitespace-pre-wrap">
                              {tc.input}
                            </div>
                          </div>
                          <div>
                            <div className="text-neutral-500 mb-1 font-sans font-medium text-[11px] uppercase tracking-wider">Expected Output</div>
                            <div className="bg-neutral-50 dark:bg-[#1a1a1a] p-2.5 rounded-md border border-neutral-200 dark:border-neutral-800 font-mono text-xs text-[#1a1a1a] dark:text-[#d4d4d4] whitespace-pre-wrap">
                              {tc.expectedOutput}
                            </div>
                          </div>
                          <div>
                            <div className="text-neutral-500 mb-1 font-sans font-medium text-[11px] uppercase tracking-wider">Actual Output</div>
                            <div className={`p-2.5 rounded-md border font-mono text-xs whitespace-pre-wrap ${runResult === 'Passed' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300'}`}>
                              {runResult === 'Passed' ? tc.expectedOutput : 'null\n(Your code returned an incorrect response)'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-neutral-500">
                You must run your code first
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (showPopup) {
    return (
      <div className="fixed inset-0 bg-neutral-900/90 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-neutral-950 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl transform scale-100 animate-in zoom-in duration-300 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-400 via-transparent to-transparent animate-pulse"></div>
          </div>
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 bg-amber-100 dark:bg-amber-900/30">
            <Star className="w-12 h-12 text-amber-500 fill-amber-500 animate-[bounce_1s_infinite]" />
            <div className="absolute inset-0 border-4 border-amber-400 rounded-full animate-ping opacity-20"></div>
          </div>
          <h2 className="text-3xl font-extrabold mb-2 text-neutral-900 dark:text-white relative z-10">
            Daily Task Complete!
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-lg mb-6 relative z-10">
            Awesome! You solved today's algorithmic challenge.
          </p>
          <div className="rounded-2xl p-6 mb-8 border relative z-10 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50">
            <p className="font-bold text-lg uppercase tracking-wider mb-1 text-amber-600 dark:text-amber-400">
              Reward
            </p>
            <p className="text-2xl font-black flex items-center justify-center gap-2 text-amber-500 mb-2">
              +15 <Star className="w-5 h-5 fill-amber-500" />
            </p>
            <p className="text-xl font-bold flex items-center justify-center gap-2 text-orange-500">
              Streak Continued!
            </p>
          </div>
          <div className="flex gap-4 relative z-10">
            <Button className="flex-1 h-12 text-md bg-neutral-200 text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700" onClick={() => setShowPopup(false)}>
              View Metrics
            </Button>
            <Button className="flex-1 h-12 text-md text-white bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate('/student')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-neutral-100 dark:bg-[#0a0a0a] flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="h-12 bg-white dark:bg-[#1e1e1e] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 shrink-0 z-10">
        {/* Left Side */}
        <div className="flex items-center gap-4 w-[200px]">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-neutral-100 dark:hover:bg-[#2d2d2d]" onClick={() => navigate('/student')}>
            <ArrowLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
              <Code2 className="w-4 h-4 text-amber-500" />
              Daily Task
            </span>
          </div>
        </div>

        {/* Center: Run & Submit Actions */}
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="ghost" 
            className="bg-neutral-100 hover:bg-neutral-200 dark:bg-[#2d2d2d] dark:hover:bg-[#3d3d3d] dark:text-neutral-300 h-8 rounded-md transition-colors text-xs font-medium px-4" 
            onClick={handleRunCode} 
            disabled={isExecuting || isSubmitting}
          >
            {isExecuting ? <Terminal className="w-3 h-3 mr-2 animate-pulse text-amber-500" /> : <Play className="w-3 h-3 mr-2 text-neutral-500 dark:text-neutral-400 fill-current" />} 
            Run
          </Button>
          <Button 
            size="sm" 
            className="bg-green-600/10 hover:bg-green-600/20 text-green-600 dark:bg-green-500/10 dark:hover:bg-green-500/20 dark:text-green-500 shadow-none border-transparent h-8 rounded-md transition-colors text-xs font-medium px-4 disabled:opacity-50" 
            onClick={handleSubmit} 
            disabled={isSubmitting || (isCompletedToday && submissionResult?.status === 'Accepted')}
          >
            <CheckCircle className="w-3 h-3 mr-2" /> 
            Submit
          </Button>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 w-[200px] justify-end relative">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-neutral-100 dark:hover:bg-[#2d2d2d] text-neutral-500" onClick={toggleTheme}>
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </Button>
          
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-8 w-8 text-neutral-500 ${showLayoutMenu ? 'bg-neutral-100 dark:bg-[#2d2d2d]' : 'hover:bg-neutral-100 dark:hover:bg-[#2d2d2d]'}`}
              onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            >
              <Layout className="w-4 h-4" />
            </Button>
            
            {showLayoutMenu && (
              <>
                {/* Backdrop to close menu when clicking outside */}
                <div className="fixed inset-0 z-40" onClick={() => setShowLayoutMenu(false)}></div>
                
                <div className="absolute top-10 right-0 w-52 bg-white dark:bg-[#1e1e1e] border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col py-1">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                    Workspace Layout
                  </div>
                  <button className={`px-4 py-2.5 text-xs text-left hover:bg-neutral-50 dark:hover:bg-[#2a2a2a] flex items-center gap-2 ${layoutType === 1 ? 'text-amber-600 dark:text-amber-400 font-medium bg-amber-50/50 dark:bg-amber-900/10' : 'text-neutral-700 dark:text-neutral-300'}`} onClick={() => { setLayoutType(1); setShowLayoutMenu(false); }}>
                    Standard
                  </button>
                  <button className={`px-4 py-2.5 text-xs text-left hover:bg-neutral-50 dark:hover:bg-[#2a2a2a] flex items-center gap-2 ${layoutType === 2 ? 'text-amber-600 dark:text-amber-400 font-medium bg-amber-50/50 dark:bg-amber-900/10' : 'text-neutral-700 dark:text-neutral-300'}`} onClick={() => { setLayoutType(2); setShowLayoutMenu(false); }}>
                    Flipped Workspace
                  </button>
                  <button className={`px-4 py-2.5 text-xs text-left hover:bg-neutral-50 dark:hover:bg-[#2a2a2a] flex items-center gap-2 ${layoutType === 3 ? 'text-amber-600 dark:text-amber-400 font-medium bg-amber-50/50 dark:bg-amber-900/10' : 'text-neutral-700 dark:text-neutral-300'}`} onClick={() => { setLayoutType(3); setShowLayoutMenu(false); }}>
                    Terminal Bottom
                  </button>
                  <button className={`px-4 py-2.5 text-xs text-left hover:bg-neutral-50 dark:hover:bg-[#2a2a2a] flex items-center gap-2 ${layoutType === 4 ? 'text-amber-600 dark:text-amber-400 font-medium bg-amber-50/50 dark:bg-amber-900/10' : 'text-neutral-700 dark:text-neutral-300'}`} onClick={() => { setLayoutType(4); setShowLayoutMenu(false); }}>
                    Code Left, Split Right
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Split Content */}
      <div className="flex-1 flex overflow-hidden p-1.5 bg-neutral-100 dark:bg-[#0a0a0a]">
        {layoutType === 1 && (
          <PanelGroup direction="horizontal">
            <Panel defaultSize={45} minSize={20}>{renderDescriptionPane()}</Panel>
            <PanelResizeHandle className="w-2 flex flex-col justify-center items-center group cursor-col-resize transition-colors relative z-10"><div className="w-1 h-8 bg-neutral-300 dark:bg-neutral-700 rounded-full group-hover:bg-amber-500 transition-colors"></div></PanelResizeHandle>
            <Panel defaultSize={55} minSize={30}>
              <PanelGroup direction="vertical">
                <Panel defaultSize={60} minSize={20}>{renderEditorPane()}</Panel>
                <PanelResizeHandle className="h-2 flex justify-center items-center group cursor-row-resize transition-colors relative z-10"><div className="w-8 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full group-hover:bg-amber-500 transition-colors"></div></PanelResizeHandle>
                <Panel defaultSize={40} minSize={15}>{renderTerminalPane()}</Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        )}

        {layoutType === 2 && (
          <PanelGroup direction="horizontal">
            <Panel defaultSize={55} minSize={30}>
              <PanelGroup direction="vertical">
                <Panel defaultSize={60} minSize={20}>{renderEditorPane()}</Panel>
                <PanelResizeHandle className="h-2 flex justify-center items-center group cursor-row-resize transition-colors relative z-10"><div className="w-8 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full group-hover:bg-amber-500 transition-colors"></div></PanelResizeHandle>
                <Panel defaultSize={40} minSize={15}>{renderTerminalPane()}</Panel>
              </PanelGroup>
            </Panel>
            <PanelResizeHandle className="w-2 flex flex-col justify-center items-center group cursor-col-resize transition-colors relative z-10"><div className="w-1 h-8 bg-neutral-300 dark:bg-neutral-700 rounded-full group-hover:bg-amber-500 transition-colors"></div></PanelResizeHandle>
            <Panel defaultSize={45} minSize={20}>{renderDescriptionPane()}</Panel>
          </PanelGroup>
        )}

        {layoutType === 3 && (
          <PanelGroup direction="vertical">
            <Panel defaultSize={60} minSize={30}>
              <PanelGroup direction="horizontal">
                <Panel defaultSize={45} minSize={20}>{renderDescriptionPane()}</Panel>
                <PanelResizeHandle className="w-2 flex flex-col justify-center items-center group cursor-col-resize transition-colors relative z-10"><div className="w-1 h-8 bg-neutral-300 dark:bg-neutral-700 rounded-full group-hover:bg-amber-500 transition-colors"></div></PanelResizeHandle>
                <Panel defaultSize={55} minSize={20}>{renderEditorPane()}</Panel>
              </PanelGroup>
            </Panel>
            <PanelResizeHandle className="h-2 flex justify-center items-center group cursor-row-resize transition-colors relative z-10"><div className="w-8 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full group-hover:bg-amber-500 transition-colors"></div></PanelResizeHandle>
            <Panel defaultSize={40} minSize={20}>{renderTerminalPane()}</Panel>
          </PanelGroup>
        )}

        {layoutType === 4 && (
          <PanelGroup direction="horizontal">
            <Panel defaultSize={55} minSize={30}>{renderEditorPane()}</Panel>
            <PanelResizeHandle className="w-2 flex flex-col justify-center items-center group cursor-col-resize transition-colors relative z-10"><div className="w-1 h-8 bg-neutral-300 dark:bg-neutral-700 rounded-full group-hover:bg-amber-500 transition-colors"></div></PanelResizeHandle>
            <Panel defaultSize={45} minSize={20}>
              <PanelGroup direction="vertical">
                <Panel defaultSize={50} minSize={20}>{renderDescriptionPane()}</Panel>
                <PanelResizeHandle className="h-2 flex justify-center items-center group cursor-row-resize transition-colors relative z-10"><div className="w-8 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full group-hover:bg-amber-500 transition-colors"></div></PanelResizeHandle>
                <Panel defaultSize={50} minSize={15}>{renderTerminalPane()}</Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        )}
      </div>
    </div>
  );
};

export default DailyTaskPage;
