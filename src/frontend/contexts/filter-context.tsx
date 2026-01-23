'use client';

import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { getDatasetMetadata } from '@/lib/api';

interface FilterContextType {
  startYear: number;
  endYear: number;
  selectedNewspapers: string[];
  selectedPublishers: string[];
  handleDateRangeChange: (start: number, end: number) => void;
  handleNewspaperFilterChange: (newspaper: string) => void;
  handlePublisherFilterChange: (publisher: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [startYear, setStartYear] = useState(1700);
  const [endYear, setEndYear] = useState(2000);
  const [selectedNewspapers, setSelectedNewspapers] = useState<string[]>([]);
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);

  // Fetch dataset metadata on mount to initialize date range
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const metadata = await getDatasetMetadata();
        // Extract years from YYYY-MM-DD format dates
        const startYearFromMetadata = parseInt(metadata.dates.start_date.split('-')[0]);
        const endYearFromMetadata = parseInt(metadata.dates.end_date.split('-')[0]);
        setStartYear(startYearFromMetadata);
        setEndYear(endYearFromMetadata);
      } catch (error) {
        // Silently fallback to default values (1700 and 2000) if fetch fails
        console.error('Failed to fetch dataset metadata, using default date range:', error);
      }
    };

    fetchMetadata();
  }, []);

  const handleDateRangeChange = useCallback((start: number, end: number) => {
    setStartYear(start);
    setEndYear(end);
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
      startYear,
      endYear,
      selectedNewspapers,
      selectedPublishers,
      handleDateRangeChange,
      handleNewspaperFilterChange,
      handlePublisherFilterChange,
    }),
    [startYear, endYear, selectedNewspapers, selectedPublishers, handleDateRangeChange, handleNewspaperFilterChange, handlePublisherFilterChange]
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

