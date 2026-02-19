'use client';

import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { getDatasetMetadata } from '@/lib/api';

interface FilterContextType {
  // Canonical date filters in YYYY-MM-DD format (passed directly to backend)
  startDate: string;
  endDate: string;
  selectedNewspapers: string[];
  selectedPublishers: string[];
  // Update the date range using YYYY-MM-DD strings
  handleDateRangeChange: (start: string, end: string) => void;
  handleNewspaperFilterChange: (newspaper: string) => void;
  handlePublisherFilterChange: (publisher: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  // Store full dates in YYYY-MM-DD format to align with backend expectations
  const [startDate, setStartDate] = useState('1900-01-01');
  const [endDate, setEndDate] = useState('1950-12-31');
  const [selectedNewspapers, setSelectedNewspapers] = useState<string[]>([]);
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);

  // Fetch dataset metadata on mount to initialize date range
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const metadata = await getDatasetMetadata();
        // Use canonical YYYY-MM-DD dates directly from the dataset metadata
        setStartDate(metadata.dates.start_date);
        setEndDate(metadata.dates.end_date);
      } catch (error) {
        console.error('Failed to fetch dataset metadata, using default date range:', error);
      }
    };

    fetchMetadata();
  }, []);

  const handleDateRangeChange = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  const handleNewspaperFilterChange = useCallback((newspaper: string) => {
    setSelectedNewspapers(prev =>
      prev.includes(newspaper)
        ? prev.filter(n => n !== newspaper)
        : [...prev, newspaper]
    );
  }, []);

  const handlePublisherFilterChange = useCallback((publisher: string) => {
    setSelectedPublishers(prev =>
      prev.includes(publisher)
        ? prev.filter(p => p !== publisher)
        : [...prev, publisher]
    );
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      startDate,
      endDate,
      selectedNewspapers,
      selectedPublishers,
      handleDateRangeChange,
      handleNewspaperFilterChange,
      handlePublisherFilterChange,
    }),
    [startDate, endDate, selectedNewspapers, selectedPublishers, handleDateRangeChange, handleNewspaperFilterChange, handlePublisherFilterChange]
  );

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}

