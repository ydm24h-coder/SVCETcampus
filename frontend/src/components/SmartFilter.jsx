import React, { useState } from 'react';
import { Search, FilterX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const SmartFilter = ({
  searchQuery,
  setSearchQuery,
  filterDept,
  setFilterDept,
  filterYear,
  setFilterYear,
  filterSection,
  setFilterSection,
  availableDepartments,
  availableYears,
  availableSections,
  showDepartment = true,
  showYear = true,
  showSection = true,
  searchPlaceholder = "Search...",
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleReset = () => {
    setSearchQuery('');
    if (setFilterDept) setFilterDept('All');
    if (setFilterYear) setFilterYear('All');
    if (setFilterSection) setFilterSection('All');
  };

  const hasActiveFilters = searchQuery !== '' || 
    (filterDept && filterDept !== 'All') || 
    (filterYear && filterYear !== 'All') || 
    (filterSection && filterSection !== 'All');

  return (
    <div className="flex flex-col gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm w-full">
      <div className="flex flex-col lg:flex-row gap-4 items-end">
        {/* Search Input */}
        <div className="flex-1 w-full space-y-2">
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input 
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="pl-9 h-10 w-full"
            />
          </div>
        </div>

        {/* Other Filters */}
        <div className={`flex flex-col lg:flex-row items-end transition-all duration-300 ease-in-out overflow-hidden ${isSearchFocused ? 'max-w-0 max-h-0 lg:max-h-[1000px] opacity-0 gap-0' : 'max-w-[1000px] max-h-[1000px] opacity-100 gap-4'}`}>
          {/* Department Filter */}
          {showDepartment && setFilterDept && availableDepartments && (
          <div className="w-full lg:w-48 space-y-2">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Department</label>
            <select 
              value={filterDept}
              onChange={(e) => {
                setFilterDept(e.target.value);
                // Reset downstream filters
                if (setFilterYear) setFilterYear('All');
                if (setFilterSection) setFilterSection('All');
              }}
              className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-neutral-300"
            >
              <option value="All">All Departments</option>
              {availableDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        )}

        {/* Year Filter */}
        {showYear && setFilterYear && availableYears && (
          <div className="w-full lg:w-40 space-y-2">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Year</label>
            <select 
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value);
                // Reset downstream filter
                if (setFilterSection) setFilterSection('All');
              }}
              className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-neutral-300"
            >
              <option value="All">All Years</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{`Year ${year}`}</option>
              ))}
            </select>
          </div>
        )}

        {/* Section Filter */}
        {showSection && setFilterSection && (
          <div className="w-full lg:w-32 space-y-2">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Section</label>
            <select 
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-neutral-300"
            >
              <option value="All">All Sections</option>
              {availableSections.map(section => (
                <option key={section} value={section}>Section {section}</option>
              ))}
            </select>
          </div>
        )}

        {/* Reset Button */}
        <div className="shrink-0 w-full lg:w-auto mt-4 lg:mt-0">
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={!hasActiveFilters}
            className="h-10 w-full lg:w-auto"
            title="Reset all filters"
          >
            <FilterX className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default SmartFilter;
