
'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getFacets, type Facets } from '@/lib/api';
import { useFilters } from '@/contexts/filter-context';

const FacetSidebar = () => {
  // Get filter state and handlers from context
  const { startYear, endYear, selectedNewspapers, selectedPublishers, handleNewspaperFilterChange, handlePublisherFilterChange } = useFilters();
  const [facets, setFacets] = useState<Facets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch facets from backend
  useEffect(() => {
    const fetchFacets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params: { start_date?: string; end_date?: string } = {};
        if (startYear) {
          params.start_date = `${startYear}-01-01`;
        }
        if (endYear) {
          params.end_date = `${endYear}-12-31`;
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
  }, [startYear, endYear]);

  if (loading) {
    return (
      <aside className="w-64 p-4 border-r">
        <div className="mt-4 border p-4">
          <p className="text-sm text-muted-foreground">Loading facets...</p>
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="w-64 p-4 border-r">
        <div className="mt-4 border p-4">
          <p className="text-sm text-destructive">Error: {error}</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 p-4 border-r">
      {/* <h2 className="text-lg font-semibold mb-4">Filter by</h2> */}
      <div className="mt-4 border p-4">
        <h3 className="font-semibold mb-4">Newspaper Name</h3>
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
                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {name} ({count})
              </label>
            </div>
          ))}
        </ScrollArea>
      </div>
      <div className="mt-4 border p-4">
        <h3 className="font-semibold mb-4">Publisher</h3>
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
                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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

export default FacetSidebar;
