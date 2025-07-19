"use client"

import { useState, useEffect } from "react"
import { Timeline } from "@/components/timeline"
import { ImageClusters } from "@/components/image-clusters"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import { MetadataItem } from "@/lib/types";

interface ClusterDetailsClientProps {
  clusterKey: string;
}

export function ClusterDetailsClient({ clusterKey }: ClusterDetailsClientProps) {
  const [clusters, setClusters] = useState<Record<string, string[]> | null>(null);
  const [metadata, setMetadata] = useState<MetadataItem[] | null>(null);
  const [startYear, setStartYear] = useState<number | null>(null);
  const [endYear, setEndYear] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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

        setClusters(clustersData);
        setMetadata(metadataData);

        const metadataMap = new Map(metadataData.map((item: MetadataItem) => [item.filepath, item]));
        const imagePaths = clustersData[clusterKey];

        if (imagePaths) {
          const dates = imagePaths.map((p: string) => {
            const metadataItem = metadataMap.get(p);
            if (metadataItem) {
              return new Date(metadataItem.pub_date).getFullYear();
            }
            return undefined;
          }).filter((y: number | undefined): y is number => y !== undefined && y > 0);
          if (dates.length > 0) {
            setStartYear(Math.min(...dates));
            setEndYear(Math.max(...dates));
          }
        }
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
  }, [clusterKey]);

  const handleDateRangeChange = (newStartYear: number, newEndYear: number) => {
    setStartYear(newStartYear);
    setEndYear(newEndYear);
  };

  if (loading) {
    return <div className="container mx-auto py-8 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-8 text-center text-red-500">Error: {error}</div>;
  }

  if (!clusters || !metadata || startYear === null || endYear === null) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Cluster data not available.</h1>
        <Link href="/">
          <Button>Back to Cluster List</Button>
        </Link>
      </div>
    );
  }

  const currentClusterImagePaths = clusters[clusterKey];
  if (!currentClusterImagePaths) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Cluster not found</h1>
        <Link href="/">
          <Button>Back to Cluster List</Button>
        </Link>
      </div>
    );
  }

  

  const formattedClusters = Object.entries(clusters).map(([id, imagePaths]) => {
    const firstImageMeta = imagePaths[0]
      ? metadata.find((item) => item.filepath === imagePaths[0])
      : undefined;
    return {
      id,
      imagePaths,
      firstImageMeta: firstImageMeta ? { pub_date: firstImageMeta.pub_date } : undefined,
    };
  });

  return (
    <div className="container mx-auto py-8">
      <Timeline
        onDateRangeChange={handleDateRangeChange}
        startYear={startYear}
        endYear={endYear}
        activeStartYear={startYear}
        activeEndYear={endYear}
        clusters={formattedClusters}
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