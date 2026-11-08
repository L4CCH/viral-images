'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Timeline } from "@/components/home-search-timeline";
import { SearchResults } from "@/components/home-search-results";
import FacetSidebar from '@/components/home-search-facets';
import { useFilters } from '@/contexts/filter-context';
import { searchClusters } from '@/lib/api';
import { Cluster, SearchParams } from "@/lib/types";
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

const INITIAL_LIMIT = 50;
const LOAD_MORE_LIMIT = 20;
const REFETCH_DEBOUNCE_MS = 300;

// Minimal transformation - backend already provides all needed data
const formatClusters = (backendClusters: Cluster[]): ClusterListItem[] =>
  backendClusters.map((cluster) => ({
    id: cluster.id,
    imagePaths: cluster.images,
    dates: cluster.dates,
    newspapers: cluster.newspapers,
    publishers: cluster.publishers,
    thumbnail: cluster.thumbnail,
  }));

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "An unknown error occurred";

export default function HomeClient() {
  // Get filter state from context
  const { startDate, endDate, selectedNewspapers, selectedPublishers } = useFilters();

  const [allClusters, setAllClusters] = useState<ClusterListItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Bumped on every filter change. A response is applied only if it belongs
  // to the current generation, so late responses for old filters are dropped.
  const generationRef = useRef(0);
  const loadMoreAbortRef = useRef<AbortController | null>(null);
  const isInitialMount = useRef(true);

  const filterParams = useMemo<SearchParams>(() => {
    const params: SearchParams = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (selectedNewspapers.length > 0) params.newspaper_name = selectedNewspapers;
    if (selectedPublishers.length > 0) params.publisher = selectedPublishers;
    return params;
  }, [startDate, endDate, selectedNewspapers, selectedPublishers]);

  // Fetch clusters on mount (immediately) and when filters change (debounced)
  useEffect(() => {
    const generation = ++generationRef.current;
    // Results of an in-flight "load more" belong to the old filters
    loadMoreAbortRef.current?.abort();
    const controller = new AbortController();

    const loadClusters = async () => {
      setLoading(true);
      setError(null);
      setLoadMoreError(null);
      try {
        const backendClusters = await searchClusters(
          { ...filterParams, page: 1, limit: INITIAL_LIMIT },
          { signal: controller.signal },
        );
        if (generation !== generationRef.current) return;
        setAllClusters(formatClusters(backendClusters));
        setHasMore(backendClusters.length === INITIAL_LIMIT);
      } catch (err: unknown) {
        if (controller.signal.aborted || generation !== generationRef.current) return;
        console.error('Error fetching data:', err);
        setError(errorMessage(err));
      } finally {
        if (generation === generationRef.current) setLoading(false);
      }
    };

    const delay = isInitialMount.current ? 0 : REFETCH_DEBOUNCE_MS;
    isInitialMount.current = false;
    const timeout = setTimeout(loadClusters, delay);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [filterParams]);

  // Load more clusters for pagination (20 per request, using offset)
  const loadMoreClusters = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;

    const generation = generationRef.current;
    const controller = new AbortController();
    loadMoreAbortRef.current = controller;
    setLoadingMore(true);
    setLoadMoreError(null);

    try {
      const backendClusters = await searchClusters(
        { ...filterParams, offset: allClusters.length, limit: LOAD_MORE_LIMIT },
        { signal: controller.signal },
      );
      if (generation !== generationRef.current) return;
      setAllClusters(prev => [...prev, ...formatClusters(backendClusters)]);
      setHasMore(backendClusters.length === LOAD_MORE_LIMIT);
    } catch (err: unknown) {
      if (controller.signal.aborted || generation !== generationRef.current) return;
      console.error('Error fetching more clusters:', err);
      // Keep the gallery visible; show the error next to a retry button
      setLoadMoreError(errorMessage(err));
    } finally {
      if (loadMoreAbortRef.current === controller) loadMoreAbortRef.current = null;
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loading, allClusters.length, filterParams]);


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
              loadMoreError={loadMoreError}
            />
          </>
        )}
      </main>
    </div>
  );
}
