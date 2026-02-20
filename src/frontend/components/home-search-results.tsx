"use client"

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Shape of clusters coming from HomeClient (lightweight view of backend Cluster)
interface ClusterListItem {
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

// Local type for processed clusters used for rendering cards
interface RenderedClusterCard {
  id: string;
  title: string;
  imageCount: number;
  featureImage?: string;
  alt?: string;
  startYear: number;
  endYear: number;
}

interface ClusterListProps {
  clusters: ClusterListItem[];
  loadMore: () => void;
  hasMore: boolean;
  loadingMore?: boolean;
}

export function SearchResults({
  clusters,
  loadMore,
  hasMore,
  loadingMore = false,
}: ClusterListProps) {
  const [processedClusters, setProcessedClusters] = useState<RenderedClusterCard[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (!clusters || clusters.length === 0) {
      setProcessedClusters([]);
      return;
    }

    // Minimal shaping for display: derive title, counts, and years
    const processed: RenderedClusterCard[] = clusters.map((cluster) => {
      const startYear = parseInt(cluster.dates.start_date.split('-')[0]);
      const endYear = parseInt(cluster.dates.end_date.split('-')[0]);
      return {
        id: cluster.id,
        title: `Cluster ${cluster.id}`,
        imageCount: cluster.imagePaths.length,
        featureImage: cluster.thumbnail || '/file.svg',
        alt: cluster.newspapers.length > 0 
          ? `${cluster.newspapers[0]} - ${startYear}` 
          : "Cluster image",
        startYear,
        endYear
      };
    });
    setProcessedClusters(processed);
  }, [clusters]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const calculateLayout = () => {
      const container = containerRef.current;
      if (!container) return;

      const items = Array.from(container.children).filter(child => child.classList.contains('masonry-item')) as HTMLElement[];
      if (items.length === 0) return;

      const getColumnCount = () => {
        if (window.innerWidth >= 1024) return 10; // lg
        if (window.innerWidth >= 768) return 4;  // md
        return 3; // sm
      };

      const columnCount = getColumnCount();
      const columnWidth = container.clientWidth / columnCount;
      const columnHeights = Array(columnCount).fill(0);
      const gap = 16; // Corresponds to Tailwind's gap-4

      items.forEach((item) => {
        const minHeight = Math.min(...columnHeights);
        const minHeightIndex = columnHeights.indexOf(minHeight);

        item.style.position = 'absolute';
        item.style.width = `${columnWidth - gap}px`; // Adjust for gap
        item.style.left = `${minHeightIndex * columnWidth + gap / 2}px`; // Adjust for gap
        item.style.top = `${minHeight + gap}px`; // Adjust for gap

        columnHeights[minHeightIndex] += item.offsetHeight + gap;
      });

      setContainerHeight(Math.max(...columnHeights));
    };

    calculateLayout();
    window.addEventListener('resize', calculateLayout);

    const imageLoadPromises = Array.from(containerRef.current.querySelectorAll('img')).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => { img.onload = resolve; });
    });

    Promise.all(imageLoadPromises).then(() => {
      requestAnimationFrame(() => {
        calculateLayout();
      });
    });

    return () => {
      window.removeEventListener('resize', calculateLayout);
    };
  }, [processedClusters]);

  return (
    <div className="relative w-full">
      <div ref={containerRef} className="relative w-full" style={{ height: containerHeight }}>
        {processedClusters.map((cluster) => (
          <Link
            href={`/cluster?id=${encodeURIComponent(cluster.id)}`}
            key={cluster.id}
            className="absolute block masonry-item"
          >
          <Card className="group relative cursor-pointer overflow-hidden p-0 w-full h-full">
            {cluster.featureImage && (
              <div className="relative w-full h-auto">
                <Image
                  src={cluster.featureImage}
                  alt={cluster.alt || cluster.title}
                  width={500} // Placeholder width
                  height={300} // Placeholder height
                  className="w-full h-auto rounded-none transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <CardTitle className="text-white text-sm">{cluster.imageCount} images</CardTitle>
                  <CardDescription className="text-gray-200 text-xs"> ({cluster.startYear} - {cluster.endYear})</CardDescription>
                </div>
              </div>
            )}
          </Card>
        </Link>
      ))}
      </div>
      {hasMore && (
        <div className="flex justify-center py-6 relative z-10 w-full">
          <Button
            onClick={() => loadMore()}
            disabled={loadingMore}
            variant="outline"
          >
            {loadingMore ? "Loading…" : "Show more results"}
          </Button>
        </div>
      )}
    </div>
  );
}