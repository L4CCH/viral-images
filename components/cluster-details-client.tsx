"use client"

import { useState } from "react"
import { Timeline } from "@/components/timeline"
import { ImageClusters } from "@/components/image-clusters"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import { MetadataItem } from "@/lib/types";

interface ClusterData {
  id: string;
  imagePaths: string[];
  firstImageMeta?: { pub_date?: string };
}

interface ClusterDetailsClientProps {
  clusterKey: string;
  initialStartYear: number;
  initialEndYear: number;
  clusters: ClusterData[];
  metadata: MetadataItem[];
}

export function ClusterDetailsClient({ clusterKey, initialStartYear, initialEndYear, clusters, metadata }: ClusterDetailsClientProps) {
  const [startYear, setStartYear] = useState(initialStartYear);
  const [endYear, setEndYear] = useState(initialEndYear);

  const handleDateRangeChange = (newStartYear: number, newEndYear: number) => {
    setStartYear(newStartYear);
    setEndYear(newEndYear);
  };

  return (
    <div className="container mx-auto py-8">
      <Timeline
        onDateRangeChange={handleDateRangeChange}
        startYear={startYear}
        endYear={endYear}
        activeStartYear={initialStartYear}
        activeEndYear={initialEndYear}
        clusters={clusters}
      />
      <Link href="/">
        <Button className="mb-4">
          &larr; Back to Gallery
        </Button>
      </Link>
      <ImageClusters startYear={startYear} endYear={endYear} clusterId={clusterKey} metadata={metadata} />
    </div>
  );
}