'use client';

import { useState } from 'react';
import { Timeline } from "@/components/timeline";
import { ClusterList } from "@/components/cluster-list";
import { ClusterData } from "@/components/cluster-list";

interface HomeClientProps {
  allClusters: ClusterData[];
}

export default function HomeClient({ allClusters }: HomeClientProps) {
  const [currentStartYear, setCurrentStartYear] = useState(1756);
  const [currentEndYear, setCurrentEndYear] = useState(1963);

  const handleDateRangeChange = (start: number, end: number) => {
    setCurrentStartYear(start);
    setCurrentEndYear(end);
  };

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
        allClusters={allClusters}
        startYear={currentStartYear}
        endYear={currentEndYear}
      />
    </div>
  );
}