import { useState, useEffect } from 'react';

const STORAGE_KEY = 'svcet_assessments';

const defaultAssessments = { 
  code: [], 
  mcq: [
    {
      id: 9999,
      title: "NPTEL Secure Assessment: Computer Networks",
      course: "CSE-401",
      duration: "45",
      dueDate: "2026-12-31",
      status: "Published",
      targetDepartment: "CSE",
      targetYear: "3",
      strictProctoring: true,
      createdBy: "System Admin",
      questionsData: [
        {
          qText: "1. Which layer of the OSI model is responsible for reliable end-to-end data transfer?",
          options: { A: "Network Layer", B: "Transport Layer", C: "Data Link Layer", D: "Application Layer" },
          correct: "B"
        },
        {
          qText: "2. What is the length of an IPv4 address?",
          options: { A: "16 bits", B: "32 bits", C: "64 bits", D: "128 bits" },
          correct: "B"
        },
        {
          qText: "3. Which protocol uses UDP as its transport protocol?",
          options: { A: "HTTP", B: "FTP", C: "DNS", D: "SMTP" },
          correct: "C"
        },
        {
          qText: "4. What is the purpose of the Subnet Mask in IP networking?",
          options: { A: "To mask the IP from hackers", B: "To divide an IP address into network and host addresses", C: "To speed up packet routing", D: "To assign dynamic IPs" },
          correct: "B"
        },
        {
          qText: "5. In the context of routing, what does OSPF stand for?",
          options: { A: "Open Shortest Path First", B: "Optical Standard Packet Forwarding", C: "Open System Path Finder", D: "Over Secure Protocol Forwarding" },
          correct: "A"
        },
        {
          qText: "6. Which of the following is a Class C IP address?",
          options: { A: "10.0.0.1", B: "172.16.0.1", C: "192.168.1.1", D: "224.0.0.1" },
          correct: "C"
        },
        {
          qText: "7. What does the Address Resolution Protocol (ARP) do?",
          options: { A: "Maps an IP address to a MAC address", B: "Maps a Domain Name to an IP address", C: "Translates private IPs to public IPs", D: "Encrypts IP packets" },
          correct: "A"
        },
        {
          qText: "8. Which port number is typically used by the HTTPS protocol?",
          options: { A: "80", B: "21", C: "443", D: "22" },
          correct: "C"
        },
        {
          qText: "9. What is a 'MAC' address in networking?",
          options: { A: "Multi-Access Control", B: "Media Access Control", C: "Memory Allocation Center", D: "Mobile Assigned Code" },
          correct: "B"
        },
        {
          qText: "10. Which mechanism is used by TCP for congestion control?",
          options: { A: "Additive Increase Multiplicative Decrease (AIMD)", B: "Token Bucket", C: "Leaky Bucket", D: "Carrier Sense Multiple Access" },
          correct: "A"
        }
      ],
      submissions: []
    }
  ] 
};

export const useAssessments = () => {
  const [assessments, setAssessmentsState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.mcq || parsed.mcq.length === 0) {
        parsed.mcq = defaultAssessments.mcq;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAssessments));
    return defaultAssessments;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setAssessmentsState(JSON.parse(saved));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('assessmentsUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('assessmentsUpdated', handleStorageChange);
    };
  }, []);

  const setAssessments = (newAssessments) => {
    let updated;
    if (typeof newAssessments === 'function') {
      updated = newAssessments(assessments);
    } else {
      updated = newAssessments;
    }
    setAssessmentsState(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('assessmentsUpdated'));
  };

  const addAssessment = (type, assessment) => {
    const newAssessment = { ...assessment, id: Date.now() };
    setAssessments(prev => ({
      ...prev,
      [type]: [newAssessment, ...prev[type]]
    }));
  };

  const updateAssessment = (type, id, updatedFields) => {
    setAssessments(prev => ({
      ...prev,
      [type]: prev[type].map(a => a.id === id ? { ...a, ...updatedFields } : a)
    }));
  };

  const deleteAssessment = (type, id) => {
    setAssessments(prev => ({
      ...prev,
      [type]: prev[type].filter(a => a.id !== id)
    }));
  };

  const submitAssessment = (type, id, studentName, score, starsEarned, codeContent = null, warnings = 0, proctoringLogs = []) => {
    setAssessments(prev => {
      const typeArray = prev[type];
      const updatedArray = typeArray.map(a => {
        if (a.id === id) {
          const currentSubmissions = a.submissions || [];
          // Replace if exists, else append
          const existingIndex = currentSubmissions.findIndex(s => s.studentName === studentName);
          let newSubmissions = [...currentSubmissions];
          
          if (existingIndex >= 0) {
            newSubmissions[existingIndex] = { studentName, score, starsEarned, codeContent, warnings, proctoringLogs, date: new Date().toLocaleDateString() };
          } else {
            newSubmissions.push({ studentName, score, starsEarned, codeContent, warnings, proctoringLogs, date: new Date().toLocaleDateString() });
          }
          
          return { ...a, submissions: newSubmissions };
        }
        return a;
      });
      return { ...prev, [type]: updatedArray };
    });
  };

  const gradeSubmission = (type, id, studentName, newScore) => {
    setAssessments(prev => {
      const typeArray = prev[type];
      const updatedArray = typeArray.map(a => {
        if (a.id === id) {
          const currentSubmissions = a.submissions || [];
          const newSubmissions = currentSubmissions.map(s => {
            if (s.studentName === studentName) {
              return { ...s, score: `${newScore}/100`, starsEarned: parseInt(newScore, 10) };
            }
            return s;
          });
          return { ...a, submissions: newSubmissions };
        }
        return a;
      });
      return { ...prev, [type]: updatedArray };
    });
  };

  return { assessments, setAssessments, addAssessment, updateAssessment, deleteAssessment, submitAssessment, gradeSubmission };
};
