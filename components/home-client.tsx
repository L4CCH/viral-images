'use client';

import { useState, useEffect } from 'react';
import { Timeline } from "@/components/timeline";
import { ClusterList } from "@/components/cluster-list";
import { MetadataItem } from "@/lib/types";

interface ClusterData {
  id: string;
  imagePaths: string[];
  firstImageMeta?: MetadataItem;
}

export default function HomeClient() {
  const [currentStartYear, setCurrentStartYear] = useState(1756);
  const [currentEndYear, setCurrentEndYear] = useState(1963);
  const [allClusters, setAllClusters] = useState<ClusterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return <div className="px-4 py-4 text-center">Loading application data...</div>;
  }

  if (error) {
    return <div className="px-4 py-4 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="px-4 py-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Viral Images</h1>
      <Timeline
        startYear={currentStartYear}
        endYear={currentEndYear}
        onDateRangeChange={handleDateRangeChange}
        clusters={allClusters}
      />
      <ClusterList
        startYear={currentStartYear}
        endYear={currentEndYear}
      />
    </div>
  );
}