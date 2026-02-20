'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Timeline } from "@/components/home-search-timeline";
import { SearchResults } from "@/components/home-search-results";
import FacetSidebar from '@/components/home-search-facets';
import { useFilters } from '@/contexts/filter-context';
import { searchClusters } from '@/lib/api';
import { Cluster } from "@/lib/types";
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Filter } from 'lucide-react';


interface ClusterListItem {
  id: string;
  imagePaths: string[];
  dates: Cluster["dates"];
  newspapers: string[];
  publishers: string[];
  thumbnail: string;
}

export default function HomeClient() {
  // Get filter state from context
  const { startDate, endDate, selectedNewspapers, selectedPublishers } = useFilters();
  
  const [allClusters, setAllClusters] = useState<ClusterListItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const INITIAL_LIMIT = 50;
  const LOAD_MORE_LIMIT = 20;
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Minimal transformation - backend already provides all needed data
  const formatClusters = (backendClusters: Cluster[]): ClusterListItem[] => {
    return backendClusters.map((cluster) => ({
      id: cluster.id,
      imagePaths: cluster.images,
      dates: cluster.dates,
      newspapers: cluster.newspapers,
      publishers: cluster.publishers,
      thumbnail: cluster.thumbnail,
    }));
  };


  const REFETCH_DEBOUNCE_MS = 300;
  const isInitialMount = useRef(true);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch clusters on mount (immediate) and when filters change (debounced)
  useEffect(() => {
    const loadClusters = async () => {
      try {
        if (isInitialMount.current) {
          isInitialMount.current = false;
        } else {
          setLoading(true);
          setError(null);
        }

        const searchParams: any = {
          page: 1,
          limit: INITIAL_LIMIT,
        };
        if (startDate) searchParams.start_date = startDate;
        if (endDate) searchParams.end_date = endDate;
        if (selectedNewspapers.length > 0) searchParams.newspaper_name = selectedNewspapers;
        if (selectedPublishers.length > 0) searchParams.publisher = selectedPublishers;

        const backendClusters = await searchClusters(searchParams);
        const formattedClusters = formatClusters(backendClusters);
        setAllClusters(formattedClusters);
        setHasMore(backendClusters.length === INITIAL_LIMIT);
      } catch (err: unknown) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    if (isInitialMount.current) {
      loadClusters();
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
          debounceTimeoutRef.current = null;
        }
      };
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    debounceTimeoutRef.current = setTimeout(loadClusters, REFETCH_DEBOUNCE_MS);
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [startDate, endDate, selectedNewspapers, selectedPublishers]);

  // Load more clusters for pagination (20 per request, using offset)
  const loadMoreClusters = useCallback(async () => {
    if (!loadingMore && hasMore && !loading) {
      try {
        setLoadingMore(true);
        const nextOffset = allClusters.length;

        const searchParams: any = {
          offset: nextOffset,
          limit: LOAD_MORE_LIMIT,
        };
        if (startDate) searchParams.start_date = startDate;
        if (endDate) searchParams.end_date = endDate;
        if (selectedNewspapers.length > 0) searchParams.newspaper_name = selectedNewspapers;
        if (selectedPublishers.length > 0) searchParams.publisher = selectedPublishers;

        const backendClusters = await searchClusters(searchParams);
        const formattedClusters = formatClusters(backendClusters);
        setAllClusters(prev => [...prev, ...formattedClusters]);
        setHasMore(backendClusters.length === LOAD_MORE_LIMIT);
      } catch (err: unknown) {
        console.error('Error fetching more clusters:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoadingMore(false);
      }
    }
  }, [loadingMore, hasMore, loading, allClusters.length, startDate, endDate, selectedNewspapers, selectedPublishers]);


  return (
    <div className="flex">
      <div className="hidden shrink-0 md:block">
        <FacetSidebar />
      </div>
      <main className="flex-1 px-4 py-4">
        <div className="md:hidden mb-4">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 overflow-auto">
              <FacetSidebar className="w-full" />
            </SheetContent>
          </Sheet>
        </div>
        <Timeline />
        {error && (
          <div className="px-4 py-4 text-center text-destructive">Error: {error}</div>
        )}
        {!error && loading && allClusters.length === 0 && (
          <div className="px-4 py-4 text-center text-muted-foreground">Loading application data...</div>
        )}
        {!error && (allClusters.length > 0 || !loading) && (
          <>
            {loading && allClusters.length > 0 && (
              <div className="px-2 py-1 text-center text-sm text-muted-foreground">Updating…</div>
            )}
            <SearchResults
              clusters={allClusters}
              loadMore={loadMoreClusters}
              hasMore={hasMore}
              loadingMore={loadingMore}
            />
          </>
        )}
      </main>
    </div>
  );
}