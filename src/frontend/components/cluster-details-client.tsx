"use client"

import { useState, useEffect } from "react"
import { Timeline } from "@/components/timeline"
import { ImageClusters } from "@/components/image-clusters"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import { MetadataItem, Cluster, SimilarImage } from "@/lib/types";
import { getCluster, getImages, type BackendImage } from "@/lib/api";

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
        
        // Fetch the cluster from backend
        const clusterData = await getCluster(clusterKey);
        
        // Fetch all images for this cluster
        const imageData: BackendImage[] = await getImages(clusterData.images);
        
        // Convert backend images to SimilarImage format
        const similarImages: SimilarImage[] = imageData.map((img) => ({
          id: img.id,
          src: img.url,
          alt: `${img.newspaper || 'Unknown'} - ${img.date}`,
          date: img.date,
          publication: img.newspaper || '',
          publisher: img.publisher || '',
          place_of_publication: img.place || '',
          caption: `Published in ${img.newspaper || 'Unknown'} on ${img.date}.`,
        }));

        // Convert to MetadataItem format for compatibility
        const metadataData: MetadataItem[] = imageData.map((img) => ({
          filepath: img.id,
          pub_date: img.date,
          name: img.newspaper || '',
          publisher: img.publisher || '',
          place_of_publication: img.place || '',
          prediction_section_iiif_url: img.url,
        }));

        // Create Cluster object
        const processedCluster: Cluster = {
          id: clusterData.id,
          title: `Cluster ${clusterData.id}`,
          description: "A cluster of visually similar images from historical newspapers.",
          similarImages,
          alternatePublications: [],
        };

        setImageClusters([processedCluster]);
        setMetadata(metadataData);

        // Set date range from cluster dates - parse YYYY-MM-DD format
        const startYear = parseInt(clusterData.dates.start_date.split('-')[0]);
        const endYear = parseInt(clusterData.dates.end_date.split('-')[0]);
        setStartYear(startYear);
        setEndYear(endYear);
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

  return (
    <div className="container mx-auto py-8">
            <Link href="/">
        <Button className="mb-4">
          &larr; Back to Gallery
        </Button>
      </Link>
      <Timeline
        activeStartYear={startYear}
        activeEndYear={endYear}
      />

      <ImageClusters startYear={startYear} endYear={endYear} imageClusters={imageClusters} currentCluster={currentCluster} />
    </div>
  );
}