"use client"

import { useState } from "react"
import { Timeline } from "@/components/timeline"
import { ImageClusters } from "@/components/image-clusters"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ClusterDetailsClientProps {
  clusterKey: string;
  initialStartYear: number;
  initialEndYear: number;
}

export function ClusterDetailsClient({ clusterKey, initialStartYear, initialEndYear }: ClusterDetailsClientProps) {
  const [startYear, setStartYear] = useState(initialStartYear);
  const [endYear, setEndYear] = useState(initialEndYear);

  const handleDateRangeChange = (newStartYear: number, newEndYear: number) => {
    setStartYear(newStartYear);
    setEndYear(newEndYear);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Newspaper Image Clusters Timeline</h1>
      <Timeline
        onDateRangeChange={handleDateRangeChange}
        startYear={startYear}
        endYear={endYear}
        activeStartYear={initialStartYear}
        activeEndYear={initialEndYear}
      />
      <Link href="/">
        <Button className="mb-4">
          &larr; Back to Cluster List
        </Button>
      </Link>
      <ImageClusters startYear={startYear} endYear={endYear} clusterId={clusterKey} />
    </div>
  );
}