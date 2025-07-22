'use client';

import { useState, useEffect, useMemo } from 'react';
import { Timeline } from "@/components/timeline";
import { ClusterList } from "@/components/cluster-list";
import { MetadataItem } from "@/lib/types";
import FacetSidebar from '@/components/facet-sidebar';

export interface ClusterData {
  id: string;
  imagePaths: string[];
  firstImageMeta?: MetadataItem;
  newspaperName?: string;
  publisherName?: string;
}

export default function HomeClient() {
  const [currentStartYear, setCurrentStartYear] = useState(1756);
  const [currentEndYear, setCurrentEndYear] = useState(1963);
  const [allClusters, setAllClusters] = useState<ClusterData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Number of items to load per page
  
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNewspapers, setSelectedNewspapers] = useState<string[]>([]);
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [clustersRes, metadataRes] = await Promise.all([
          fetch('/api/data?type=clusters'),
          fetch('/api/data?type=metadata'),
        ]);

        if (!clustersRes.ok) throw new Error('Failed to fetch clusters');
        if (!metadataRes.ok) throw new Error('Failed to fetch metadata');

        const clustersData = await clustersRes.json();
        const metadataData: MetadataItem[] = await metadataRes.json();
        

        const metadataMap = new Map(metadataData.map((item) => [item.filepath, item]));
        
        

        

        const formattedClusters: ClusterData[] = Object.entries(clustersData).map(([id, imagePaths]) => ({
          id,
          imagePaths: Array.isArray(imagePaths) ? imagePaths as string[] : [],
          firstImageMeta: (imagePaths as string[]).length > 0 ? metadataMap.get((imagePaths as string[])[0]) : undefined,
          newspaperName: (imagePaths as string[]).length > 0 ? metadataMap.get((imagePaths as string[])[0])?.name : undefined,
          publisherName: (imagePaths as string[]).length > 0 ? metadataMap.get((imagePaths as string[])[0])?.publisher : undefined,
        }));

        setAllClusters(formattedClusters);

      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDateRangeChange = (start: number, end: number) => {
    setCurrentStartYear(start);
    setCurrentEndYear(end);
  };

  const handleNewspaperFilterChange = (newspaper: string) => {
    setSelectedNewspapers(prev =>
      prev.includes(newspaper)
        ? prev.filter(n => n !== newspaper)
        : [...prev, newspaper]
    );
  };

  const handlePublisherFilterChange = (publisher: string) => {
    setSelectedPublishers(prev =>
      prev.includes(publisher)
        ? prev.filter(p => p !== publisher)
        : [...prev, publisher]
    );
  };

  const dateFilteredClusters = useMemo(() => {
    return allClusters.filter(cluster => {
      if (!cluster.firstImageMeta?.pub_date) return false;
      const year = new Date(cluster.firstImageMeta.pub_date).getFullYear();
      return year >= currentStartYear && year <= currentEndYear;
    });
  }, [allClusters, currentStartYear, currentEndYear]);

  const combinedFilteredClusters = useMemo(() => {
    const filtered = dateFilteredClusters.filter(cluster => {
      if (!cluster.firstImageMeta) return false;

      const newspaperMatch = selectedNewspapers.length === 0 || selectedNewspapers.includes(cluster.firstImageMeta.name);
      const publisherMatch = selectedPublishers.length === 0 || (cluster.firstImageMeta.publisher && selectedPublishers.includes(cluster.firstImageMeta.publisher));

      return newspaperMatch && publisherMatch;
    });
    return filtered;
  }, [dateFilteredClusters, selectedNewspapers, selectedPublishers]);

  const displayedClusters = useMemo(() => {
    return combinedFilteredClusters.slice(0, currentPage * itemsPerPage);
  }, [combinedFilteredClusters, currentPage, itemsPerPage]);

  const hasMore = displayedClusters.length < combinedFilteredClusters.length;

  const loadMoreClusters = () => {
    setCurrentPage(prevPage => prevPage + 1);
  };


  if (loading) {
    return <div className="px-4 py-4 text-center">Loading application data...</div>;
  }

  if (error) {
    return <div className="px-4 py-4 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex">
      <FacetSidebar
        clusters={allClusters}
        selectedNewspapers={selectedNewspapers}
        onNewspaperFilterChange={handleNewspaperFilterChange}
        selectedPublishers={selectedPublishers}
        onPublisherFilterChange={handlePublisherFilterChange}
      />
      <main className="flex-1 px-4 py-4">
        {/* <h1 className="text-3xl font-bold mb-8 text-center">Viral Images</h1> */}
        <Timeline
          startYear={currentStartYear}
          endYear={currentEndYear}
          onDateRangeChange={handleDateRangeChange}
          clusters={allClusters}
        />
        <ClusterList
          startYear={currentStartYear}
          endYear={currentEndYear}
          clusters={displayedClusters}
          loadMore={loadMoreClusters}
          hasMore={hasMore}
        />
      </main>
    </div>
  );
}