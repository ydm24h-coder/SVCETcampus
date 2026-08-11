import { useState, useEffect } from 'react';

const STORAGE_KEY = 'svcet_request_categories';

const defaultCategories = [
  {
    id: 'CAT-ACAD',
    name: 'Academic',
    subcategories: ['Leave Application', 'On Duty (OD)', 'Course Registration', 'Marks Discrepancy', 'Other'],
    defaultWorkflow: ['Faculty', 'HOD'],
    slaDays: 2,
    icon: 'BookOpen'
  },
  {
    id: 'CAT-PLACE',
    name: 'Placement',
    subcategories: ['Interview Permission', 'Resume Verification', 'Offer Letter Submission', 'Training Request'],
    defaultWorkflow: ['Placement Officer', 'HOD'],
    slaDays: 3,
    icon: 'Briefcase'
  },
  {
    id: 'CAT-LIB',
    name: 'Library',
    subcategories: ['Book Request', 'Overdue Waiver', 'Lost Book Report', 'Access Issue'],
    defaultWorkflow: ['Librarian'],
    slaDays: 1,
    icon: 'Library'
  },
  {
    id: 'CAT-FIN',
    name: 'Finance',
    subcategories: ['Fee Payment Issue', 'Scholarship Application', 'Refund Request', 'Fine Waiver'],
    defaultWorkflow: ['Finance Dept', 'Admin'],
    slaDays: 5,
    icon: 'CreditCard'
  },
  {
    id: 'CAT-TRANS',
    name: 'Transport',
    subcategories: ['Bus Pass Issue', 'Route Change', 'Bus Delay Report'],
    defaultWorkflow: ['Transport Coordinator'],
    slaDays: 2,
    icon: 'Bus'
  },
  {
    id: 'CAT-HOSTEL',
    name: 'Hostel',
    subcategories: ['Hostel Leave', 'Room Change Request', 'Maintenance Issue', 'Mess Food Feedback'],
    defaultWorkflow: ['Warden'],
    slaDays: 1,
    icon: 'Home'
  },
  {
    id: 'CAT-IT',
    name: 'IT Support',
    subcategories: ['Wi-Fi Issue', 'Portal Login Problem', 'Software Installation', 'Hardware Repair'],
    defaultWorkflow: ['IT Admin'],
    slaDays: 1,
    icon: 'Laptop'
  },
  {
    id: 'CAT-FAC',
    name: 'Facilities',
    subcategories: ['Classroom Maintenance', 'AC/Fan Repair', 'Lab Equipment Issue'],
    defaultWorkflow: ['Facilities Manager'],
    slaDays: 2,
    icon: 'Wrench'
  },
  {
    id: 'CAT-EXAM',
    name: 'Examinations',
    subcategories: ['Hall Ticket Issue', 'Re-evaluation Request', 'Exam Time Clash', 'Transcripts'],
    defaultWorkflow: ['Exam Cell', 'HOD'],
    slaDays: 7,
    icon: 'FileText'
  },
  {
    id: 'CAT-OTHERS',
    name: 'Others',
    subcategories: ['General Query', 'Feedback', 'Complaint', 'Other'],
    defaultWorkflow: ['Faculty', 'HOD', 'Admin'],
    slaDays: 5,
    icon: 'FileText'
  }
];

export const useRequestCategories = () => {
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let parsed = defaultCategories;
    if (saved) {
      try {
        parsed = JSON.parse(saved);
        // Ensure "Others" category exists if loaded from old storage
        if (!parsed.find(c => c.id === 'CAT-OTHERS')) {
          const othersCat = {
            id: 'CAT-OTHERS',
            name: 'Others',
            subcategories: ['General Query', 'Feedback', 'Complaint', 'Other'],
            defaultWorkflow: ['Faculty', 'HOD', 'Admin'],
            slaDays: 5,
            icon: 'FileText'
          };
          parsed.push(othersCat);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
        return parsed;
      } catch (e) {
        console.error('Error parsing request categories', e);
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    return parsed;
  });

  const saveCategories = (updater) => {
    setCategories(prev => {
      const newCategories = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCategories));
      window.dispatchEvent(new Event('svcet_request_categories_updated'));
      return newCategories;
    });
  };

  useEffect(() => {
    const handleStorageChange = (e) => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCategories(JSON.parse(saved));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('svcet_request_categories_updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('svcet_request_categories_updated', handleStorageChange);
    };
  }, []);

  const addCategory = (category) => {
    saveCategories(prev => [...prev, { ...category, id: `CAT-${crypto.randomUUID().split('-')[0].toUpperCase()}` }]);
  };

  const updateCategory = (id, updates) => {
    saveCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat));
  };

  const deleteCategory = (id) => {
    saveCategories(prev => prev.filter(cat => cat.id !== id));
  };

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory
  };
};
