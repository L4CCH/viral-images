'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Timeline } from "@/components/timeline";
import { ClusterList } from "@/components/cluster-list";
import FacetSidebar from '@/components/facet-sidebar';
import { searchClusters, type BackendCluster } from '@/lib/api';
import { useFilters } from '@/contexts/filter-context';

export interface ClusterData {
  id: string;
  imagePaths: string[];
  dates: {
    start_date: string; // YYYY-MM-DD format
    end_date: string; // YYYY-MM-DD format
  };
  newspapers: string[];
  publishers: string[];
  thumbnail: string;
}

export default function HomeClient() {
  // Get filter state from context
  const { startYear, endYear, selectedNewspapers, selectedPublishers } = useFilters();
  
  const [allClusters, setAllClusters] = useState<ClusterData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const backendLimit = 50; // Backend limit per request
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Minimal transformation - backend already provides all needed data
  const formatClusters = (backendClusters: BackendCluster[]): ClusterData[] => {
    return backendClusters.map((cluster: BackendCluster) => ({
      id: cluster.id,
      imagePaths: cluster.images,
      dates: cluster.dates,
      newspapers: cluster.newspapers,
      publishers: cluster.publishers,
      thumbnail: cluster.thumbnail,
    }));
  };


  // Track if this is the initial mount to avoid double-fetching
  const isInitialMount = useRef(true);

  // Fetch clusters on mount and when filters change
  useEffect(() => {
    const loadClusters = async () => {
      try {
        if (isInitialMount.current) {
          isInitialMount.current = false;
        } else {
          setLoading(true);
          setError(null);
        }
        
        setCurrentPage(1);

        // Build search params with current filters
        const searchParams: any = {
          page: 1,
          limit: backendLimit,
        };

        // Add date filters
        if (startYear || endYear) {
          searchParams.start_date = `${startYear}-01-01`;
          searchParams.end_date = `${endYear}-12-31`;
        }

        // Add newspaper filter
        if (selectedNewspapers.length > 0) {
          searchParams.newspaper_name = selectedNewspapers[0];
        }

        // Add publisher filter
        if (selectedPublishers.length > 0) {
          searchParams.publisher = selectedPublishers[0];
        }

        console.log(`Fetching clusters page 1 with filters:`, searchParams);
        const backendClusters = await searchClusters(searchParams);
        console.log(`Fetched ${backendClusters.length} clusters`);

        const formattedClusters = formatClusters(backendClusters);
        setAllClusters(formattedClusters);

        // Check if there are more clusters to load
        setHasMore(backendClusters.length === backendLimit);
      } catch (err: unknown) {
        console.error('Error fetching data:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    loadClusters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startYear, endYear, selectedNewspapers, selectedPublishers]);

  // Load more clusters for pagination
  const loadMoreClusters = useCallback(async () => {
    if (!loadingMore && hasMore && !loading) {
      try {
        setLoadingMore(true);
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);

        // Build search params with current filters
        const searchParams: any = {
          page: nextPage,
          limit: backendLimit,
        };

        // Add date filters
        if (startYear || endYear) {
          searchParams.start_date = `${startYear}-01-01`;
          searchParams.end_date = `${endYear}-12-31`;
        }

        // Add newspaper filter
        if (selectedNewspapers.length > 0) {
          searchParams.newspaper_name = selectedNewspapers[0];
        }

        // Add publisher filter
        if (selectedPublishers.length > 0) {
          searchParams.publisher = selectedPublishers[0];
        }

        console.log(`Fetching clusters page ${nextPage} with filters:`, searchParams);
        const backendClusters = await searchClusters(searchParams);
        console.log(`Fetched ${backendClusters.length} clusters`);

        const formattedClusters = formatClusters(backendClusters);
        setAllClusters(prev => [...prev, ...formattedClusters]);

        // Check if there are more clusters to load
        setHasMore(backendClusters.length === backendLimit);
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
  }, [loadingMore, hasMore, loading, currentPage, startYear, endYear, selectedNewspapers, selectedPublishers, backendLimit]);


  if (loading) {
    return <div className="px-4 py-4 text-center">Loading application data...</div>;
  }

  if (error) {
    return <div className="px-4 py-4 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex">
      <FacetSidebar />
      <main className="flex-1 px-4 py-4">
        {/* <h1 className="text-3xl font-bold mb-8 text-center">Viral Images</h1> */}
        <Timeline />
        <ClusterList
          clusters={allClusters}
          loadMore={loadMoreClusters}
          hasMore={hasMore}
        />
        {loadingMore && (
          <div className="px-4 py-4 text-center text-gray-500">Loading more clusters...</div>
        )}
      </main>
    </div>
  );
}