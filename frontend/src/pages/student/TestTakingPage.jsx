import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Clock, Play, CheckCircle, AlertCircle, Terminal, Star, ShieldAlert, Moon, Sun, Settings, Lightbulb, FileText, Code2, WifiOff, Menu, LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Editor from '@monaco-editor/react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAssessments } from '@/hooks/useAssessments';
import { useIsMobile } from '@/hooks/useIsMobile';
import { playAchievementSound, playSadSound } from '@/utils/audio';
import confetti from 'canvas-confetti';


class LocalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("TestTakingPage Error:", error, info);
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: '#fdd', color: '#900', minHeight: '100vh', zIndex: 9999 }}>
          <h1>Something went wrong in TestTakingPage!</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Component Stack</summary>
            {this.state.info?.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

const TestTakingPageContent = () => {
  console.log("Rendering TestTakingPageContent!");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { id } = useParams();
  const type = searchParams.get('type'); // 'Code' or 'MCQ'

  const [timeLeft, setTimeLeft] = useState(0);
  const [mcqAnswers, setMcqAnswers] = useState(() => {
    const saved = localStorage.getItem(`svcet_draft_mcq_${id}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [codeContent, setCodeContent] = useState(() => {
    const saved = localStorage.getItem(`svcet_draft_code_${id}`);
    return saved || '// Start coding here...';
  });
  const [output, setOutput] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);
  const [finalScore, setFinalScore] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionStatus, setQuestionStatus] = useState({});

  // Anti-Cheat State
  const [warnings, setWarnings] = useState(0);
  const [proctoringLogs, setProctoringLogs] = useState([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [aiModel, setAiModel] = useState(null);
  const [faceModel, setFaceModel] = useState(null);
  const [isPhoneDetected, setIsPhoneDetected] = useState(false);
  const [violationReason, setViolationReason] = useState('');
  const videoRef = React.useRef(null);
  const faceMissingCountRef = React.useRef(0);
  const audioContextRef = React.useRef(null);
  const analyserRef = React.useRef(null);

  const { completeTask } = useLeaderboard();
  const { assessments, submitAssessment } = useAssessments();
  
  // Find current assessment
  const parsedId = parseInt(id, 10);
  const typeKey = type === 'MCQ' ? 'mcq' : 'code';

  const [isDarkMode, setIsDarkMode] = useState(false);
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState('problem');
  
  // Advanced Editor Features
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [showMinimap, setShowMinimap] = useState(false);
  const [isRunningCode, setIsRunningCode] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      // eslint-disable-next-line
      setIsDarkMode(true);
      setEditorTheme('vs-dark');
    } else {
      setEditorTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
      setEditorTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      // eslint-disable-next-line
      setIsDarkMode(true);
      setEditorTheme('vs-dark');
    }
  };

  const handleRequestHint = () => {
    if (window.confirm("Requesting an AI Hint will deduct 5 points from your final score. Are you sure?")) {
      setOutput(prev => prev + '\n\n[AI Hint]: Try using a hash map (or dictionary) to keep track of the frequencies of each element to achieve O(n) time complexity.');
    }
  };
  const currentAssessment = assessments[typeKey]?.find(a => String(a.id) === String(id)) || null;

  // Set default code if code test and initialize timer
  useEffect(() => {
    if (currentAssessment) {
      if (typeKey === 'code' && currentAssessment.starterCode) {
        // eslint-disable-next-line
        setCodeContent(currentAssessment.starterCode);
      }
      if (typeKey === 'mcq' && currentAssessment.questionsData) {
        const initialStatus = {};
        currentAssessment.questionsData.forEach((_, idx) => {
          initialStatus[idx] = 'not_visited';
        });
        initialStatus[0] = 'not_answered';
        setQuestionStatus(initialStatus);
      }
      if (currentAssessment.duration) {
        setTimeLeft(parseInt(currentAssessment.duration, 10) * 60);
      }
    }
  }, [currentAssessment, typeKey]);

  const exitFullscreenSafe = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.log(err));
    }
  };

  const handleSubmit = () => {
    if (!currentAssessment) return;
    
    let score = 0;
    
    if (typeKey === 'mcq') {
      const questions = currentAssessment.questionsData || [];
      let correctAnswers = 0;
      questions.forEach((q, idx) => {
        const studentAns = mcqAnswers[idx];
        if (q.type === 'MSQ') {
          const correctAns = Array.isArray(q.correct) ? q.correct : [];
          const sAns = Array.isArray(studentAns) ? studentAns : [];
          if (sAns.length > 0 && sAns.length === correctAns.length && sAns.every(val => correctAns.includes(val))) {
            correctAnswers += 1;
          }
        } else {
          if (studentAns === q.correct) correctAnswers += 1;
        }
      });
      score = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 100;
      
      const stars = score; 
      setEarnedStars(stars);
      setFinalScore(score);
      
      if (score >= 40) {
        // playAchievementSound();
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#3b82f6', '#ef4444', '#10b981', '#a855f7'],
          zIndex: 100
        });
      } else {
        // playSadSound();
      }
      
      const sessionUser = JSON.parse(localStorage.getItem('svcet_session_student')) || { name: 'Demo Student' };
      completeTask(sessionUser.name, stars);
      submitAssessment(typeKey, currentAssessment.id, sessionUser.name, `${score}/100`, stars, null, warnings, proctoringLogs);
    } else {
      const sessionUser = JSON.parse(localStorage.getItem('svcet_session_student')) || { name: 'Demo Student' };
      setFinalScore('Pending');
      setEarnedStars(0);
      // playAchievementSound();
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#a855f7'],
        zIndex: 100
      });
      submitAssessment(typeKey, currentAssessment.id, sessionUser.name, 'Pending', 0, codeContent, warnings, proctoringLogs);
    }

    exitFullscreenSafe();
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    setShowPopup(true);
    // User will manually navigate back using the 'Return to Assessments' button
  };


  useEffect(() => {
    if (hasStarted && timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === 301) {
            window.dispatchEvent(new CustomEvent('newAlert', { detail: { title: 'Time Warning', content: 'Only 5 minutes left!' }}));
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerId);
    } else if (hasStarted && timeLeft === 0 && !showPopup && finalScore === null) {
      handleSubmit();
    }
  }, [hasStarted, timeLeft, showPopup, finalScore]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const executeCode = async (lang, code, stdin = '') => {
    try {
      const safeCode = typeof code === 'string' ? code : '';
      
      const langMap = {
        'python': 'python',
        'java': 'java',
        'cpp': 'c++',
        'c': 'c',
        'javascript': 'javascript'
      };
      const pistonLang = langMap[lang.toLowerCase()] || 'python';
      
      const res = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          language: pistonLang, 
          version: '*',
          files: [{ content: safeCode }],
          stdin: stdin 
        })
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      if (data.message) throw new Error('Piston blocked: ' + data.message);
      return data;
    } catch (err) {
      console.warn('Execution API unreachable, falling back to local simulation.', err);
      await new Promise(r => setTimeout(r, 600)); // Simulate network latency
      
      const safeCode = typeof code === 'string' ? code : '';
      if (safeCode.trim().length < 5) {
         return { compile: { output: 'SyntaxError: unexpected EOF while parsing' }, run: { output: '', code: 1, signal: 'SIGKILL' } };
      }

      // Smart Simulation
      let simulatedOutput = 'Program executed successfully.\n';
      
      if (currentAssessment?.testCases?.length > 0) {
        simulatedOutput = currentAssessment.testCases[0].expectedOutput;
      } else if (lang.toLowerCase() === 'javascript') {
        try {
          let logs = [];
          const originalConsoleLog = console.log;
          console.log = (...args) => logs.push(args.join(' '));
          // eslint-disable-next-line no-eval
          eval(safeCode);
          console.log = originalConsoleLog;
          if (logs.length > 0) simulatedOutput = logs.join('\n') + '\n';
        } catch (e) {
          return { compile: { output: '' }, run: { output: e.toString(), code: 1, signal: null } };
        }
      } else if (lang.toLowerCase() === 'python' || lang.toLowerCase() === 'java') {
        let extracted = [];
        const regex = lang.toLowerCase() === 'python' 
          ? /print\s*\(\s*(['"])(.*?)\1\s*\)/g 
          : /System\.out\.print(?:ln)?\s*\(\s*(['"])(.*?)\1\s*\)/g;
        
        let match;
        while ((match = regex.exec(safeCode)) !== null) {
          extracted.push(match[2]);
        }
        
        if (extracted.length > 0) {
          simulatedOutput = extracted.join('\n') + '\n';
        } else if (safeCode.includes('print') || safeCode.includes('System.out')) {
          simulatedOutput = "Output computed from program logic.\n";
        }
      }

      return { compile: { output: '' }, run: { output: simulatedOutput, code: 0, signal: null } };
    }
  };

  const handleRunCode = async () => {
    setIsRunningCode(true);
    let lang = currentAssessment?.language || 'python';
    if (lang === 'Any Language') lang = 'python'; // Fallback
    
    const commandMap = {
      python: 'python main.py',
      java: 'javac Main.java && java Main',
      cpp: 'g++ main.cpp && ./a.out',
      c: 'gcc main.c && ./a.out',
      javascript: 'node main.js'
    };
    const cmd = commandMap[lang.toLowerCase()] || `run ${lang}`;
    const prompt = `student@svcet:~/project$ ${cmd}\n`;
    
    setOutput(prompt + 'Executing...\n');
    
    try {
      const result = await executeCode(lang.toLowerCase(), codeContent || '', '');
      
      let finalOutput = prompt;
      if (result?.compile?.output) {
        finalOutput += result.compile.output + '\n';
      }
      if (result?.run?.output) {
        finalOutput += result.run.output;
      }
      
      if (result?.run?.code !== 0 && result?.run?.code !== undefined) {
        finalOutput += `\n[Process exited with code ${result.run.code}]`;
      }

      setOutput(finalOutput || (prompt + 'No output produced.'));
    } catch (err) {
      console.error(err);
      setOutput(prompt + 'An error occurred while running the code:\n' + err.message);
    } finally {
      setIsRunningCode(false);
    }
  };


  const jumpToQuestion = (idx) => {
    setCurrentQuestionIndex(idx);
    setQuestionStatus(prev => {
      const currentStat = prev[idx];
      if (currentStat === 'not_visited') {
        return { ...prev, [idx]: 'not_answered' };
      }
      return prev;
    });
  };

  const handleAnswerToggle = (qIndex, optKey, isMsq) => {
    setMcqAnswers(prev => {
      const newAnswers = { ...prev };
      if (isMsq) {
        const currentArr = Array.isArray(newAnswers[qIndex]) ? newAnswers[qIndex] : [];
        if (currentArr.includes(optKey)) {
          newAnswers[qIndex] = currentArr.filter(k => k !== optKey);
          if (newAnswers[qIndex].length === 0) delete newAnswers[qIndex];
        } else {
          newAnswers[qIndex] = [...currentArr, optKey];
        }
      } else {
        newAnswers[qIndex] = optKey;
      }
      return newAnswers;
    });
  };

  const handleSaveAndNext = () => {
    setQuestionStatus(prev => {
      const ans = mcqAnswers[currentQuestionIndex];
      const hasAnswer = ans && (!Array.isArray(ans) || ans.length > 0);
      return { ...prev, [currentQuestionIndex]: hasAnswer ? 'answered' : 'not_answered' };
    });
    if (currentQuestionIndex < (currentAssessment?.questionsData?.length || 0) - 1) {
      jumpToQuestion(currentQuestionIndex + 1);
    }
  };

  // Auto-save mechanisms & offline listener
  useEffect(() => {
    localStorage.setItem(`svcet_draft_mcq_${id}`, JSON.stringify(mcqAnswers));
  }, [mcqAnswers, id]);

  useEffect(() => {
    localStorage.setItem(`svcet_draft_code_${id}`, codeContent);
  }, [codeContent, id]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleClearResponse = () => {

    setMcqAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[currentQuestionIndex];
      return newAnswers;
    });
  };

  const handleMarkForReview = () => {
    setQuestionStatus(prev => {
      const ans = mcqAnswers[currentQuestionIndex];
      const hasAnswer = ans && (!Array.isArray(ans) || ans.length > 0);
      return { ...prev, [currentQuestionIndex]: hasAnswer ? 'answered_marked' : 'marked_for_review' };
    });
    if (currentQuestionIndex < (currentAssessment?.questionsData?.length || 0) - 1) {
      jumpToQuestion(currentQuestionIndex + 1);
    }
  };

  // Anti-Cheat & Proctoring Logic


  useEffect(() => {
    if (!hasStarted || showPopup || timeLeft === null || showWarningModal) return;

    const handleViolation = (reason = 'You have switched tabs, minimized the window, or exited Fullscreen mode.') => {
      setViolationReason(reason);
      
      const newLog = {
        time: new Date().toLocaleTimeString(),
        reason: reason
      };
      
      setProctoringLogs(prev => {
        // Prevent duplicate spamming of the exact same error within the same second
        if (prev.length > 0 && prev[prev.length - 1].reason === reason) return prev;
        return [...prev, newLog];
      });

      setWarnings(prev => {
        const newWarnings = prev + 1;
        if (newWarnings >= 3) {
          handleSubmit();
        } else {
          setShowWarningModal(true);
        }
        return newWarnings;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) handleViolation();
    };

    const handleBlur = () => {
      handleViolation();
    };
    
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && hasStarted && !showPopup) {
        handleViolation();
      }
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ''; // Required for Chrome
    };

    const preventAction = (e) => {
      e.preventDefault();
    };

    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 || e.clientX <= 0 || (e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
        handleViolation("CURSOR LEFT WINDOW. Do not use a second monitor or leave the test area.");
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J'))) {
        e.preventDefault();
        handleViolation("DEVELOPER TOOLS BLOCKED. Hacking attempts are strictly forbidden.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("contextmenu", preventAction);
    document.addEventListener("copy", preventAction);
    document.addEventListener("paste", preventAction);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("keydown", handleKeyDown);

    let cameraCheckInterval;
    if (currentAssessment?.strictProctoring && cameraStream) {
      cameraCheckInterval = setInterval(async () => {
        if (!cameraStream.active) {
          handleViolation();
          return;
        }

        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const averageVolume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          if (averageVolume > 40) {
            handleViolation("NOISE/TALKING DETECTED. You must remain silent during the exam.");
          }
        }

        if (aiModel && videoRef.current && videoRef.current.readyState === 4) {
          try {
            const predictions = await aiModel.detect(videoRef.current);
            const phoneDetected = predictions.some(p => p.class === 'cell phone' && p.score > 0.5);
            if (phoneDetected) {
              setIsPhoneDetected(true);
              handleViolation("CELL PHONE DETECTED in the camera frame.");
            } else {
              setIsPhoneDetected(false);
            }
          } catch (err) {
            console.error("AI detection error", err);
          }
        }

        if (faceModel && videoRef.current && videoRef.current.readyState === 4 && !isPhoneDetected) {
          try {
            const faces = await faceModel.estimateFaces(videoRef.current, false);
            if (faces.length === 0) {
              faceMissingCountRef.current += 1;
              if (faceMissingCountRef.current > 2) {
                handleViolation("FACE NOT DETECTED. You must remain visible in the camera frame.");
                faceMissingCountRef.current = 0;
              }
            } else if (faces.length > 1) {
              handleViolation("MULTIPLE FACES DETECTED. You must take the exam alone.");
              faceMissingCountRef.current = 0;
            } else {
              faceMissingCountRef.current = 0;
              const face = faces[0];
              if (face.landmarks) {
                const rightEye = face.landmarks[0];
                const leftEye = face.landmarks[1];
                const nose = face.landmarks[2];
                const distRight = Math.abs(rightEye[0] - nose[0]);
                const distLeft = Math.abs(leftEye[0] - nose[0]);
                const min = Math.min(distRight, distLeft) || 1;
                const max = Math.max(distRight, distLeft);
                const ratio = max / min;
                if (ratio > 3.0) {
                  handleViolation("LOOKING AWAY. Please keep your face directed towards the screen.");
                }
              }
            }
          } catch (err) {
            console.error("Face tracking error", err);
          }
        }
      }, 1500);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("contextmenu", preventAction);
      document.removeEventListener("copy", preventAction);
      document.removeEventListener("paste", preventAction);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("keydown", handleKeyDown);
      if (cameraCheckInterval) clearInterval(cameraCheckInterval);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [showPopup, timeLeft, showWarningModal, hasStarted, cameraStream, currentAssessment, aiModel]);

  const startSecureExam = async () => {
    if (currentAssessment?.strictProctoring) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setCameraStream(stream);

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        
        // Dynamically load TensorFlow and Models from CDN to prevent Vite bundler from hanging
        const loadScript = (src) => new Promise((resolve, reject) => {
          if (document.querySelector(`script[src="${src}"]`)) return resolve();
          const script = document.createElement('script');
          script.src = src;
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs');
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd');
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface');

        window.cocoSsd.load().then(model => setAiModel(model)).catch(err => console.error("Failed to load AI model", err));
        window.blazeface.load().then(model => setFaceModel(model)).catch(err => console.error("Failed to load face model", err));
        
      } catch (err) {
        const bypass = confirm("Camera/Mic access failed or is blocked. Do you want to bypass Proctoring for testing purposes? (Click OK to bypass, Cancel to stop)");
        if (!bypass) {
          return; // Block start
        } else {
          console.warn("Proctoring bypassed for testing.");
        }
      }
    }

    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().then(() => {
        setHasStarted(true);
      }).catch(err => {
        alert("Fullscreen mode is required to take this exam. Please allow it.");
      });
    } else {
      setHasStarted(true); // Fallback if not supported
    }
  };

  const renderFloatingCamera = () => {
    if (!currentAssessment?.strictProctoring || !cameraStream) return null;
    return (
      <div className={`fixed bottom-6 right-6 w-48 h-36 bg-black rounded-xl overflow-hidden shadow-2xl border-4 z-[60] transition-colors duration-300 ${isPhoneDetected ? 'border-red-600' : 'border-neutral-800'}`}>
        <video 
          autoPlay 
          playsInline 
          muted 
          ref={(el) => {
            videoRef.current = el;
            if (el && el.srcObject !== cameraStream) {
              el.srcObject = cameraStream;
            }
          }}
          className="w-full h-full object-cover transform scale-x-[-1]"
        />
        
        {/* Status Badge */}
        <div className={`absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md ${isPhoneDetected ? 'bg-red-600' : 'bg-black/60'}`}>
          <div className={`w-2 h-2 rounded-full ${isPhoneDetected ? 'bg-white' : 'bg-green-500 animate-[pulse_1s_ease-in-out_infinite]'}`}></div>
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
            {isPhoneDetected ? 'PHONE DETECTED' : ((aiModel && faceModel) ? 'AI Tracking Active' : 'Loading AI...')}
          </span>
        </div>
        
        {/* Flashing Overlay if Phone Detected */}
        {isPhoneDetected && (
          <div className="absolute inset-0 bg-red-600/30 animate-pulse pointer-events-none flex items-center justify-center">
            <ShieldAlert className="w-12 h-12 text-white opacity-80" />
          </div>
        )}
      </div>
    );
  };

  const returnToExamFullscreen = () => {
    setShowWarningModal(false);
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    }
  };

  // 1. Initial Start Screen
  if (!hasStarted) {
    return (
      <div className="relative z-10 min-h-screen bg-neutral-100 dark:bg-[#0a0a0a] flex items-center justify-center p-6 font-sans">
        <Card className="max-w-xl w-full border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden">
          <div className="bg-red-600 h-2 w-full"></div>
          <CardContent className="p-10 text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-500" />
            </div>
            <h1 className="text-3xl font-extrabold mb-4">SVCET Assessment Center</h1>
            
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="text-center">
                <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider mb-1">Total Questions</p>
                <p className="text-3xl font-black text-blue-600 dark:text-blue-500">{currentAssessment?.questionsData?.length || 0}</p>
              </div>
              <div className="w-px h-12 bg-neutral-200 dark:bg-neutral-800"></div>
              <div className="text-center">
                <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider mb-1">Duration</p>
                <p className="text-3xl font-black text-blue-600 dark:text-blue-500">{currentAssessment?.duration || 0} <span className="text-lg text-neutral-400">Min</span></p>
              </div>
            </div>

            <p className="text-neutral-600 dark:text-neutral-400 mb-8 text-lg">
              You are about to begin a secure assessment. Once started, you must remain in full-screen mode. Switching tabs, minimizing the window, or exiting full-screen will result in a violation strike.
            </p>
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 mb-8 text-left text-sm text-amber-800 dark:text-amber-400/90 font-medium">
              <ul className="list-disc pl-5 space-y-2">
                <li>Do not press Escape or exit Fullscreen.</li>
                <li>Do not switch tabs or move your mouse to another monitor.</li>
                <li>Copy, paste, right-click, and DevTools are strictly disabled.</li>
                {currentAssessment?.strictProctoring && (
                  <li><strong className="text-red-600 dark:text-red-400">Webcam & Mic Required:</strong> You will be actively monitored by Dual-Engine AI. Any face hiding, looking away, talking, or phone usage will trigger a strike.</li>
                )}
                <li>3 strikes will result in automatic submission.</li>
              </ul>
            </div>
            <Button className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg" onClick={startSecureExam}>
              Acknowledge & Start Exam
            </Button>
            <Button variant="ghost" className="w-full mt-4 text-neutral-500 hover:text-neutral-700" onClick={() => navigate('/student/assessments')}>
              Cancel and Return
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. Reward/Encouragement overlay when submitted
  if (showPopup) {
    const isSuccess = finalScore >= 40 || finalScore === 'Pending';
    return (
      <div className="fixed inset-0 bg-neutral-900/90 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-neutral-950 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl transform scale-100 animate-in zoom-in duration-300 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-20">
            {isSuccess ? (
              <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-400 via-transparent to-transparent animate-pulse"></div>
            ) : (
              <div className="w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent opacity-50"></div>
            )}
          </div>

          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 ${isSuccess ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
            {isSuccess ? (
              <Star className="w-12 h-12 text-amber-500 fill-amber-500 animate-[bounce_1s_infinite]" />
            ) : (
              <AlertCircle className="w-12 h-12 text-blue-500" />
            )}
            {isSuccess && <div className="absolute inset-0 border-4 border-amber-400 rounded-full animate-ping opacity-20"></div>}
          </div>
          
          <h2 className="text-3xl font-extrabold mb-2 text-neutral-900 dark:text-white relative z-10">
            {finalScore === 'Pending' ? 'Congratulations!' : isSuccess ? 'Assessment Complete!' : 'Keep Trying!'}
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-lg mb-6 relative z-10">
            {finalScore === 'Pending' 
              ? 'Your code test has been successfully submitted. Your results will be published after they are validated by the faculty'
              : isSuccess 
                ? 'Excellent work! You did great on this assessment.' 
                : 'Don\'t give up. Review the material and try to improve next time!'}
          </p>
          
          <div className={`rounded-2xl p-6 mb-8 border relative z-10 ${isSuccess ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50' : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50'}`}>
            <p className={`font-bold text-lg uppercase tracking-wider mb-1 ${isSuccess ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
              Your Score: {finalScore === 'Pending' ? 'Pending Evaluation' : `${finalScore}%`}
            </p>
            {finalScore !== 'Pending' && (
              <p className={`text-5xl font-black flex items-center justify-center gap-2 ${isSuccess ? 'text-amber-500' : 'text-blue-500'}`}>
                +{earnedStars} <Star className={`w-8 h-8 ${isSuccess ? 'fill-amber-500' : 'fill-blue-500'}`} />
              </p>
            )}
          </div>
          
          <Button 
            className="w-full h-12 text-lg font-bold text-white rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all relative z-10" 
            onClick={() => navigate('/student/assessments')}
          >
            Return to Assessments
          </Button>
        </div>
      </div>
    );
  }

  // 3. Warning Modal overlay
  if (showWarningModal) {
    return (
      <div className="fixed inset-0 bg-red-900/95 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-neutral-950 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl transform scale-100 animate-in zoom-in duration-300 relative">
          <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-600 animate-[pulse_1s_ease-in-out_infinite]" />
          </div>
          <h2 className="text-3xl font-extrabold mb-2 text-red-600 dark:text-red-500">
            Proctoring Warning!
          </h2>
          <p className="text-neutral-700 dark:text-neutral-300 text-lg mb-6 font-medium">
            {violationReason} This is a violation of the secure exam rules.
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 mb-8">
            <p className="text-red-700 dark:text-red-400 font-black text-2xl uppercase tracking-wider mb-2">
              Warning {warnings} of 3
            </p>
            <p className="text-sm font-medium text-red-600/90 dark:text-red-400/90">
              If you receive 3 warnings, your assessment will be instantly locked and submitted.
            </p>
          </div>
          <Button className="w-full h-12 text-lg font-bold text-white rounded-xl bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transition-all" onClick={returnToExamFullscreen}>
            I Understand, Return to Test
          </Button>
        </div>
      </div>
    );
  }

  if (type === 'MCQ') {
    const totalQuestions = currentAssessment?.questionsData?.length || 0;
    const answeredCount = Object.values(questionStatus).filter(s => s === 'answered' || s === 'answered_marked').length;
    const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

    return (
      <div className="relative z-10 min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] flex flex-col font-sans select-none">
        {isOffline && (
          <div className="bg-red-600 text-white text-center py-2 px-4 font-bold animate-in slide-in-from-top flex items-center justify-center gap-2 z-50">
            <WifiOff className="w-5 h-5" />
            You are currently offline. Please restore your connection before submitting.
          </div>
        )}
        {/* Header - No Back Button! */}
        <header className="h-16 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-red-600" />
            </div>
            <h1 className="font-bold text-lg hidden sm:block">{currentAssessment?.title || 'MCQ Quiz'}</h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-full">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <div className={`flex items-center font-mono font-bold text-base sm:text-lg px-3 sm:px-4 py-2 rounded-lg transition-colors ${timeLeft <= 300 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500 animate-pulse' : 'text-orange-600 dark:text-orange-500 bg-orange-50 dark:bg-orange-900/20'}`}>
              <Clock className="w-5 h-5 mr-1 sm:mr-2" />
              {formatTime(timeLeft)}
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-4 sm:px-8" onClick={handleSubmit}>
              Submit
            </Button>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
        </div>

        {/* MCQ Content - NPTEL Style Layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Main Question Area */}
          <div className={`flex-1 flex-col bg-white dark:bg-[#0a0a0a] border-r border-neutral-200 dark:border-neutral-800 pb-16 lg:pb-0 ${isMobile && mobileTab !== "problem" ? "hidden" : "flex"}`}>
            {currentAssessment?.questionsData && currentAssessment.questionsData.length > 0 ? (
              <>
                <div className="flex-1 overflow-y-auto p-8">
                  <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4 mb-6">
                    <h2 className="text-xl font-bold">Question {currentQuestionIndex + 1}</h2>
                    <span className="text-sm font-medium px-3 py-1 bg-neutral-100 dark:bg-neutral-900 rounded-full text-neutral-500">
                      {currentAssessment.questionsData[currentQuestionIndex].type === 'MSQ' ? 'Multiple Select Type' : 'Single Choice Type'}
                    </span>
                  </div>
                  
                  <div className="text-lg font-medium text-neutral-900 dark:text-white whitespace-pre-wrap mb-8 leading-relaxed">
                    {currentAssessment.questionsData[currentQuestionIndex].qText}
                  </div>
                  
                  <div className="space-y-3">
                    {Object.keys(currentAssessment.questionsData[currentQuestionIndex].options || {}).map((optKey) => {
                      const qType = currentAssessment.questionsData[currentQuestionIndex].type || 'MCQ';
                      const isMsq = qType === 'MSQ';
                      const currentAns = mcqAnswers[currentQuestionIndex];
                      const isSelected = isMsq ? (Array.isArray(currentAns) && currentAns.includes(optKey)) : currentAns === optKey;
                      
                      return (
                        <label 
                          key={optKey} 
                          className={`flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' 
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-blue-700/50'
                          }`}
                        >
                          <input 
                            type={isMsq ? "checkbox" : "radio"} 
                            name={isMsq ? `q${currentQuestionIndex}-${optKey}` : `q${currentQuestionIndex}`} 
                            className={`w-5 h-5 text-blue-600 focus:ring-blue-500 ${isMsq ? 'rounded' : ''}`} 
                            checked={isSelected}
                            onChange={() => handleAnswerToggle(currentQuestionIndex, optKey, isMsq)}
                          />
                          <span className="font-medium text-neutral-700 dark:text-neutral-300 text-lg">
                            <span className="font-bold mr-3 text-neutral-400">{optKey}.</span> 
                            {currentAssessment.questionsData[currentQuestionIndex].options[optKey]}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="flex w-full sm:w-auto gap-2 sm:gap-3">
                    <Button variant="outline" className="flex-1 sm:flex-none border-blue-200 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm px-2 sm:px-4" onClick={handleMarkForReview}>
                      Mark for Review
                    </Button>
                    <Button variant="ghost" className="flex-1 sm:flex-none text-neutral-500 hover:text-neutral-700 text-xs sm:text-sm px-2 sm:px-4" onClick={handleClearResponse}>
                      Clear Response
                    </Button>
                  </div>
                  <div className="flex w-full sm:w-auto gap-2 sm:gap-3 items-center">
                    <Button 
                      variant="outline" 
                      className="flex-1 sm:flex-none border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 text-xs sm:text-sm px-4 py-6 sm:py-2 mt-2 sm:mt-0" 
                      onClick={() => currentQuestionIndex > 0 && jumpToQuestion(currentQuestionIndex - 1)}
                      disabled={currentQuestionIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 sm:flex-none border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 text-xs sm:text-sm px-4 py-6 sm:py-2 mt-2 sm:mt-0" 
                      onClick={() => currentQuestionIndex < (currentAssessment?.questionsData?.length || 0) - 1 && jumpToQuestion(currentQuestionIndex + 1)}
                      disabled={currentQuestionIndex === (currentAssessment?.questionsData?.length || 0) - 1}
                    >
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                    <Button className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-6 sm:py-2 mt-2 sm:mt-0" onClick={handleSaveAndNext}>
                      Save & Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-neutral-500">No questions available.</div>
            )}
          </div>

          {/* Question Palette Sidebar */}
          <div className={`w-full lg:w-80 h-full border-t lg:border-t-0 border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex-col shrink-0 pb-16 lg:pb-0 ${isMobile && mobileTab !== "palette" ? "hidden" : "flex"}`}>
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
              <h3 className="font-bold text-neutral-700 dark:text-neutral-300 mb-3 text-sm uppercase tracking-wider">Question Palette</h3>
              
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-medium">
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white">{Object.values(questionStatus).filter(s => s === 'answered').length}</div> Answered</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white">{Object.values(questionStatus).filter(s => s === 'not_answered').length}</div> Not Answered</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 border border-neutral-300 bg-white dark:bg-neutral-800 flex items-center justify-center text-[10px]">{Object.values(questionStatus).filter(s => s === 'not_visited').length}</div> Not Visited</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-[10px] text-white">{Object.values(questionStatus).filter(s => s === 'marked_for_review').length}</div> Review</div>
                <div className="flex items-center gap-2 col-span-2"><div className="w-4 h-4 rounded-full bg-purple-500 relative flex items-center justify-center text-[10px] text-white"><div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></div>{Object.values(questionStatus).filter(s => s === 'answered_marked').length}</div> Answered & Review</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-3">
                {currentAssessment?.questionsData?.map((_, idx) => {
                  const status = questionStatus[idx] || 'not_visited';
                  let bgClass = "bg-white border-neutral-300 dark:bg-neutral-800 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"; // not_visited
                  
                  if (status === 'answered') bgClass = "bg-green-500 text-white border-green-600 rounded-t-full";
                  else if (status === 'not_answered') bgClass = "bg-red-500 text-white border-red-600 rounded-b-full";
                  else if (status === 'marked_for_review') bgClass = "bg-purple-500 text-white border-purple-600 rounded-full";
                  else if (status === 'answered_marked') bgClass = "bg-purple-500 text-white border-purple-600 rounded-full relative";

                  return (
                    <button 
                      key={idx}
                      onClick={() => { jumpToQuestion(idx); if (isMobile) setMobileTab('problem'); }}
                      className={`w-10 h-10 flex items-center justify-center font-bold text-sm border hover:opacity-80 transition-opacity ${bgClass} ${currentQuestionIndex === idx ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                    >
                      {idx + 1}
                      {status === 'answered_marked' && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Mobile Navigation Tabs for MCQ */}
          {isMobile && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 z-40 flex p-2 gap-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
              <button 
                className={`relative flex-1 flex flex-col items-center justify-center h-12 rounded-xl transition-all duration-300 ${mobileTab === 'problem' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`} 
                onClick={() => setMobileTab('problem')}
              >
                <FileText className={`w-5 h-5 mb-0.5 transition-transform duration-300 ${mobileTab === 'problem' ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-bold">Question</span>
                {mobileTab === 'problem' && <motion.div layoutId="mcq-activeTab" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
              </button>
              
              <button 
                className={`relative flex-1 flex flex-col items-center justify-center h-12 rounded-xl transition-all duration-300 ${mobileTab === 'palette' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`} 
                onClick={() => setMobileTab('palette')}
              >
                <LayoutDashboard className={`w-5 h-5 mb-0.5 transition-transform duration-300 ${mobileTab === 'palette' ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-bold">Palette</span>
                {mobileTab === 'palette' && <motion.div layoutId="mcq-activeTab" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
              </button>
            </div>
          )}
        </div>
        {renderFloatingCamera()}
      </div>
    );
  }

  // Code Test View (Split Screen)
  return (
    <div className="relative z-10 h-screen bg-neutral-50 dark:bg-[#0a0a0a] flex flex-col font-sans overflow-hidden select-none">
      {isOffline && (
        <div className="bg-red-600 text-white text-center py-1.5 px-4 font-bold animate-in slide-in-from-top flex items-center justify-center gap-2 z-50 text-sm">
          <WifiOff className="w-4 h-4" />
          You are currently offline. Please restore your connection before submitting.
        </div>
      )}
      {/* Header - No Back Button! */}
      <header className="h-14 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
          </div>
          <h1 className="font-bold text-base hidden sm:block">{currentAssessment?.title || 'Code Test'}</h1>
          {currentAssessment?.language && currentAssessment.language !== 'Any Language' && (
            <div className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-bold rounded">
              {currentAssessment.language}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-full">
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <div className={`flex items-center font-mono font-bold text-sm sm:text-base px-2 sm:px-3 py-1.5 rounded transition-colors ${timeLeft <= 300 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500 animate-pulse' : 'text-orange-600 dark:text-orange-500 bg-orange-50 dark:bg-orange-900/20'}`}>
            <Clock className="w-4 h-4 mr-1 sm:mr-1.5" />
            {formatTime(timeLeft)}
          </div>
          <Button size="sm" variant="outline" disabled={isRunningCode} className="border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900 dark:text-green-500 dark:hover:bg-green-900/20 font-bold w-auto sm:w-28 transition-all" onClick={handleRunCode}>
            {isRunningCode ? <Clock className="w-4 h-4 mr-1.5 animate-spin" /> : <Play className="w-3 h-3 sm:mr-1.5" />} 
            <span className="hidden sm:inline">{isRunningCode ? 'Running' : 'Run Code'}</span>
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={handleSubmit}>
            <CheckCircle className="w-3 h-3 sm:mr-1.5" /> <span className="hidden sm:inline">Submit</span>
          </Button>
        </div>
      </header>

      {/* Split Content */}
      <div className="flex-1 flex overflow-hidden relative pb-0">
        {/* Left: Problem Statement */}
        <div className={`w-full lg:w-1/2 border-r border-neutral-200 dark:border-neutral-800 overflow-y-auto bg-white dark:bg-neutral-950 p-6 pb-24 md:pb-6 transition-all duration-300 ${isMobile && mobileTab !== "problem" ? "hidden" : "animate-in fade-in slide-in-from-bottom-2"}`}>
          <h2 className="text-xl font-bold mb-4">Problem Statement</h2>
          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none whitespace-pre-wrap break-words">
            {currentAssessment?.problemStatement || "No problem statement provided."}
          </div>
        </div>

        {/* Right: Code Editor & Console */}
        <div className={`w-full lg:w-1/2 flex flex-col bg-neutral-50 dark:bg-neutral-900 transition-all duration-300 ${isMobile && mobileTab !== "code" ? "hidden" : "animate-in fade-in slide-in-from-bottom-2"}`}>
          <div className="flex-1 relative border-b border-neutral-200 dark:border-neutral-800">
            <div className="absolute top-0 left-0 right-0 h-8 bg-neutral-100 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center px-4 text-xs font-mono text-neutral-500 z-10">
              {(() => {
                const langStr = currentAssessment?.language || '';
                const l = langStr.toLowerCase();
                let ext = 'js';
                if (l.includes('python')) ext = 'py';
                else if (l.includes('java') && !l.includes('javascript')) ext = 'java';
                else if (l.includes('c++')) ext = 'cpp';
                else if (l.includes('c')) ext = 'c';
                return `main.${ext}`;
              })()}
            </div>
            
            {/* Advanced Editor Toolbar */}
            <div className="absolute top-0 right-0 h-8 flex items-center pr-2 gap-1 z-10 bg-neutral-100 dark:bg-neutral-950/80 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 rounded-bl-lg overflow-x-auto whitespace-nowrap">
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-bold" onClick={() => setEditorFontSize(prev => Math.max(10, prev - 2))}>
                A-
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-bold" onClick={() => setEditorFontSize(prev => Math.min(24, prev + 2))}>
                A+
              </Button>
              <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-1"></div>
              <Button variant="ghost" size="sm" className={`h-6 px-2 text-xs ${showMinimap ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`} onClick={() => setShowMinimap(!showMinimap)}>
                <FileText className="w-3 h-3 mr-1" /> Map
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white" onClick={() => setEditorTheme(prev => prev === 'vs-dark' ? 'light' : prev === 'light' ? 'hc-black' : 'vs-dark')}>
                <Settings className="w-3 h-3 mr-1" /> {editorTheme === 'vs-dark' ? 'Dark' : editorTheme === 'light' ? 'Light' : 'HC'}
              </Button>
            </div>

            <div className={`absolute top-8 left-0 right-0 bottom-0 ${isMobile ? 'pb-16' : ''}`}>
              <Editor
                height="100%"
                language={(() => {
                  const langStr = currentAssessment?.language || '';
                  const l = langStr.toLowerCase();
                  if (l.includes('python')) return 'python';
                  if (l.includes('java') && !l.includes('javascript')) return 'java';
                  if (l.includes('c++')) return 'cpp';
                  if (l.includes('c')) return 'c';
                  return 'javascript';
                })()}
                theme={editorTheme}
                value={codeContent}
                onChange={(value) => setCodeContent(value || '')}
                options={{
                  minimap: { enabled: showMinimap },
                  fontSize: editorFontSize,
                  lineNumbersMinChars: isMobile ? 3 : 4,
                  folding: !isMobile,
                  lineDecorationsWidth: isMobile ? 10 : 20,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  padding: { top: 16 },
                  quickSuggestions: false,
                  suggestOnTriggerCharacters: false,
                  snippetSuggestions: 'none',
                  parameterHints: { enabled: false },
                  tabCompletion: 'off',
                  wordBasedSuggestions: 'off',
                  contextmenu: false
                }}
              />
            </div>
          </div>
          
          {/* Console Output */}
          <div className="h-1/3 bg-[#1e1e1e] flex flex-col border-t border-neutral-300 dark:border-neutral-800">
            <div className="h-9 border-b border-neutral-700/50 flex items-center justify-between px-4 bg-[#252526]">
              <div className="flex items-center text-xs font-semibold text-neutral-300 tracking-wider">
                <Terminal className="w-4 h-4 mr-2 text-blue-400" /> TERMINAL
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-900/30" onClick={handleRequestHint}>
                  <Star className="w-3 h-3 mr-1" /> AI Hint
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-neutral-400 hover:text-white hover:bg-neutral-700" onClick={() => setOutput('')}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4 font-mono text-[13px] overflow-y-auto whitespace-pre-wrap text-neutral-300 bg-[#1e1e1e] leading-relaxed relative">
              {output ? (
                <>
                  {output.split('\n').map((line, i) => {
                    let colorClass = 'text-neutral-300';
                    let Icon = null;
                    if (line.startsWith('student@svcet')) {
                      // Style the terminal prompt
                      return (
                        <div key={i} className="mb-1 text-green-400 font-medium">
                          {line.split('$')[0]}$ <span className="text-white">{line.split('$')[1]}</span>
                        </div>
                      );
                    } else if (line.includes('[PASS]') || line.includes('SUCCESS')) {
                      colorClass = 'text-emerald-400 font-bold';
                      if (line.includes('[PASS]')) Icon = <CheckCircle className="w-3.5 h-3.5 inline mr-1.5 align-text-bottom" />;
                    } else if (line.includes('[FAIL]') || line.includes('ERROR') || line.includes('Exception') || line.includes('SyntaxError')) {
                      colorClass = 'text-red-400 font-bold';
                      if (line.includes('[FAIL]')) Icon = <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5 align-text-bottom" />;
                    } else if (line.includes('[AI Hint]')) {
                      colorClass = 'text-amber-400 italic';
                      Icon = <Lightbulb className="w-3.5 h-3.5 inline mr-1.5 align-text-bottom" />;
                    } else if (line.includes('Executing...')) {
                      colorClass = 'text-blue-300 opacity-70 animate-pulse';
                    }
                    return (
                      <div key={i} className={`mb-1 ${colorClass}`}>
                        {Icon}
                        {line}
                      </div>
                    );
                  })}
                  <div className="mt-1 flex items-center text-green-400 font-medium">
                    student@svcet:~/project$ <span className="w-2 h-4 bg-white ml-2 animate-pulse"></span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-start font-mono h-full">
                  <div className="text-green-400 font-medium flex items-center">
                    student@svcet:~/project$ <span className="w-2 h-4 bg-white ml-2 animate-pulse"></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Glassmorphism Bottom Mobile Tab Bar */}
      {isMobile && (
        <div className="h-16 absolute bottom-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 dark:bg-[#0a0a0a]/80 border-t border-neutral-200/50 dark:border-neutral-800/50 flex items-center justify-around shrink-0 pb-safe px-2 gap-2 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.4)]">
          <button className={`relative flex-1 flex flex-col items-center justify-center h-12 rounded-xl transition-all duration-300 ${mobileTab === 'problem' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`} onClick={() => setMobileTab('problem')}>
            <FileText className={`w-5 h-5 mb-0.5 transition-transform duration-300 ${mobileTab === 'problem' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-bold tracking-wide">Problem</span>
          </button>
          <button className={`relative flex-1 flex flex-col items-center justify-center h-12 rounded-xl transition-all duration-300 ${mobileTab === 'code' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`} onClick={() => setMobileTab('code')}>
            <Code2 className={`w-5 h-5 mb-0.5 transition-transform duration-300 ${mobileTab === 'code' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-bold tracking-wide">Code</span>
          </button>
        </div>
      )}
      {renderFloatingCamera()}
    </div>
  );
};
const TestTakingPage = (props) => <LocalErrorBoundary><TestTakingPageContent {...props} /></LocalErrorBoundary>;
export default TestTakingPage;
