"use client"

import { useState, useEffect, useRef, useMemo, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";



interface ClusterData {
  id: string;
  imagePaths: string[];
  firstImageMeta?: { pub_date?: string; prediction_section_iiif_url?: string; name?: string; };
}

interface Cluster {
  id: string;
  title: string;
  imageCount: number;
  featureImage?: string;
  alt?: string;
  startYear: number;
  endYear: number;
}

export function ClusterList({
  startYear,
  endYear,
  clusters,
  loadMore,
  hasMore,
}: {
  startYear: number;
  endYear: number;
  clusters: ClusterData[];
  loadMore: () => void;
  hasMore: boolean;
}) {
  const [processedClusters, setProcessedClusters] = useState<Cluster[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (!clusters) {
      setProcessedClusters([]);
      return;
    }

    const processed = clusters.map((cluster: ClusterData) => {
      const dates = cluster.imagePaths
            .map(() => (cluster.firstImageMeta?.pub_date ? new Date(cluster.firstImageMeta.pub_date).getFullYear() : 0))
            .filter((y: number) => y > 0);

      const clusterStartYear = dates.length > 0 ? Math.min(...dates) : 0;
      const clusterEndYear = dates.length > 0 ? Math.max(...dates) : 0;

      return {
        id: cluster.id,
        title: `Cluster ${cluster.id}`,
        imageCount: cluster.imagePaths.length,
        featureImage: cluster.firstImageMeta?.prediction_section_iiif_url || '/file.svg',
        alt: cluster.firstImageMeta ? `${cluster.firstImageMeta.name || 'Unknown'} - ${cluster.firstImageMeta.pub_date || 'Unknown'}` : "Cluster image",
        startYear: clusterStartYear,
        endYear: clusterEndYear
      };
    });
    setProcessedClusters(processed);
  }, [clusters]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      {
        rootMargin: '200px',
      }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadMore]);

  

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
    <div className="relative">
      <div ref={containerRef} className="relative" style={{ height: containerHeight }}>
        {processedClusters.map((cluster) => (
          <Link href={`/cluster/${cluster.id}`} key={cluster.id} className="absolute block masonry-item">
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
      <div ref={observerTarget} className="h-1"></div>
    </div>
    </div>
  );
}