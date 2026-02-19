"use client"

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ClusterImages } from "@/components/cluster-images";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { Cluster, Image } from "@/lib/types";
import { getCluster, getImages } from "@/lib/api";


export function ClusterClient() {
  const searchParams = useSearchParams();
  const clusterKey = searchParams.get("id");

  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!clusterKey) {
          setError("Missing cluster id");
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        
        // Fetch the cluster from backend
        const clusterData = await getCluster(clusterKey);
        setCluster(clusterData);

        // Fetch all images for this cluster using backend image IDs
        const imageData = await getImages(clusterData.images);
        setImages(imageData);

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

  if (!cluster || images.length === 0) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Image not available.</h1>
        <Link href="/">
          <Button>Back to Gallery</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/">
        <Button className="mb-4 text-lg">
          &larr; Back to Gallery
        </Button>
      </Link>

      <ClusterImages cluster={cluster} images={images} />
    </div>
  );
}