import { useMemo } from 'react';

export const useSmartFilters = (data = [], currentDept = 'All', currentYear = 'All') => {
  return useMemo(() => {
    // 1. All unique departments from data
    const deptSet = new Set();
    data.forEach(item => {
      if (item.department && String(item.department).toUpperCase() !== 'ALL') {
        deptSet.add(item.department);
      }
    });
    
    // 2. All unique years for the selected department
    const yearSet = new Set();
    data.forEach(item => {
      if (item.year && String(item.year).toUpperCase() !== 'ALL') {
        if (currentDept === 'All' || item.department === currentDept) {
          yearSet.add(item.year);
        }
      }
    });

    // 3. All unique sections for the selected department & year
    const sectionSet = new Set();
    data.forEach(item => {
      if (item.section && String(item.section).toUpperCase() !== 'ALL') {
        const matchDept = currentDept === 'All' || item.department === currentDept;
        const matchYear = currentYear === 'All' || String(item.year) === String(currentYear);
        if (matchDept && matchYear) {
          sectionSet.add(item.section);
        }
      }
    });

    return {
      availableDepartments: Array.from(deptSet).sort(),
      availableYears: Array.from(yearSet).sort((a, b) => String(a).localeCompare(String(b))),
      availableSections: Array.from(sectionSet).sort()
    };
  }, [data, currentDept, currentYear]);
};
