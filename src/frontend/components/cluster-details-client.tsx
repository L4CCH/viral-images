"use client"

import { useState, useEffect } from "react"
import { Timeline } from "@/components/timeline"
import { ImageClusters } from "@/components/image-clusters"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import { MetadataItem, Cluster, SimilarImage } from "@/lib/types";

interface ClusterDetailsClientProps {
  clusterKey: string;
}

export function ClusterDetailsClient({ clusterKey }: ClusterDetailsClientProps) {
  const [imageClusters, setImageClusters] = useState<Cluster[] | null>(null);
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

        const metadataMap = new Map(metadataData.map((item) => [item.filepath, item]));

        const processedClusters: Cluster[] = Object.entries(clustersData).map(([id, imagePaths]) => {
          const similarImages: SimilarImage[] = (imagePaths as string[])
            .map((filepath) => {
              const meta = metadataMap.get(filepath);
              if (!meta) {
                return null;
              }
              return {
                id: filepath,
                src: meta.prediction_section_iiif_url,
                alt: `${meta.name} - ${meta.pub_date}`,
                date: meta.pub_date,
                publication: meta.name,
                publisher: meta.publisher,
                place_of_publication: meta.place_of_publication,
                caption: `Published in ${meta.name} on ${meta.pub_date}.`,
              };
            })
            .filter((image): image is SimilarImage => image !== null);

          return {
            id,
            title: `Cluster ${id}`,
            description: "A cluster of visually similar images from historical newspapers.",
            similarImages,
            alternatePublications: [],
          };
        });
        setImageClusters(processedClusters);

        const currentCluster = processedClusters.find((c) => c.id === clusterKey);
        if (currentCluster) {
          const dates = currentCluster.similarImages.map((image) => new Date(image.date).getFullYear());
          if (dates.length > 0) {
            setStartYear(Math.min(...dates));
            setEndYear(Math.max(...dates));
          }
        }
        setMetadata(metadataData); // Keep metadata for potential future use or other components
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

  if (!imageClusters || !metadata || startYear === null || endYear === null) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Image not available.</h1>
        <Link href="/">
          <Button>Back to Gallery</Button>
        </Link>
      </div>
    );
  }

  const currentCluster = imageClusters.find((c) => c.id === clusterKey);

  if (!currentCluster) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Image not found</h1>
        <Link href="/">
          <Button>Back to Gallery</Button>
        </Link>
      </div>
    );
  }

  const formattedClusters = imageClusters.map((cluster) => {
    const firstImageMeta = cluster.similarImages[0];
    return {
      id: cluster.id,
      imagePaths: cluster.similarImages.map(img => img.id),
      firstImageMeta: firstImageMeta ? { pub_date: firstImageMeta.date } : undefined,
    };
  });

  return (
    <div className="container mx-auto py-8">
            <Link href="/">
        <Button className="mb-4">
          &larr; Back to Gallery
        </Button>
      </Link>
      <Timeline
        onDateRangeChange={handleDateRangeChange}
        startYear={startYear}
        endYear={endYear}
        activeStartYear={startYear}
        activeEndYear={endYear}
        clusters={formattedClusters}
      />

      <ImageClusters startYear={startYear} endYear={endYear} imageClusters={imageClusters} currentCluster={currentCluster} />
    </div>
  );
}