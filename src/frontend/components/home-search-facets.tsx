
'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getFacets } from '@/lib/api';
import { SearchFacets } from '@/lib/types';
import { useFilters } from '@/contexts/filter-context';
import { cn } from '@/lib/utils';

interface SearchFacetsSidebarProps {
  className?: string;
}

const SearchFacetsSidebar = ({ className }: SearchFacetsSidebarProps) => {
  const asideClass = cn('w-64 shrink-0 p-4', className);
  // Get filter state and handlers from context
  const { startDate, endDate, selectedNewspapers, selectedPublishers, handleNewspaperFilterChange, handlePublisherFilterChange } = useFilters();
  const [facets, setFacets] = useState<SearchFacets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch facets from backend
  useEffect(() => {
    const fetchFacets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params: { start_date?: string; end_date?: string } = {};
        if (startDate) {
          params.start_date = startDate;
        }
        if (endDate) {
          params.end_date = endDate;
        }
        
        const fetchedFacets = await getFacets(params);
        setFacets(fetchedFacets);
      } catch (err) {
        console.error('Error fetching facets:', err);
        setError(err instanceof Error ? err.message : 'Failed to load facets');
      } finally {
        setLoading(false);
      }
    };

    fetchFacets();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <aside className={asideClass}>
        <div className="mt-4 border p-4">
          <p className="text-sm text-muted-foreground">Loading facets...</p>
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className={asideClass}>
        <div className="mt-4 border p-4">
          <p className="text-sm text-destructive">Error: {error}</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className={asideClass}>
      {/* <h2 className="text-lg font-semibold mb-4">Filter by</h2> */}
      <div className="mt-4 border p-4">
        <h3 className="font-medium text-lg mb-4">Newspaper</h3>
        <ScrollArea className="h-80">
          {Object.entries(facets?.newspapers || {}).map(([name, count]) => (
            <div key={name} className="flex items-center space-x-2 mb-2">
              <Checkbox
                id={`newspaper-${name}`}
                checked={selectedNewspapers.includes(name)}
                onCheckedChange={() => handleNewspaperFilterChange(name)}
              />
              <label
                htmlFor={`newspaper-${name}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {name} ({count})
              </label>
            </div>
          ))}
        </ScrollArea>
      </div>
      <div className="mt-4 border p-4">
        <h3 className="font-medium text-lg mb-4">Publisher</h3>
        <ScrollArea className="h-80">
          {Object.entries(facets?.publishers || {}).map(([name, count]) => (
            <div key={name} className="flex items-center space-x-2 mb-2">
              <Checkbox
                id={`publisher-${name}`}
                checked={selectedPublishers.includes(name)}
                onCheckedChange={() => handlePublisherFilterChange(name)}
              />
              <label
                htmlFor={`publisher-${name}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {name} ({count})
              </label>
            </div>
          ))}
        </ScrollArea>
      </div>
    </aside>
  );
};

export default SearchFacetsSidebar;
