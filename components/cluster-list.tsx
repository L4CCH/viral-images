"use client"

import { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

interface ImageMeta {
  pub_date?: string;
  prediction_section_iiif_url?: string;
  name?: string;
}

export interface ClusterData {
  id: string;
  imagePaths: string[];
  firstImageMeta?: ImageMeta;
}

interface Cluster {
  id: string;
  title: string;
  imageCount: number;
  featureImage?: string; // Made optional
  alt?: string; // Made optional
  startYear: number;
  endYear: number;
}

export function ClusterList({
  allClusters,
  startYear,
  endYear,
}: {
  allClusters: ClusterData[];
  startYear: number;
  endYear: number;
}) {
  const ITEMS_PER_PAGE = 10;
  const [displayedClusters, setDisplayedClusters] = useState<Cluster[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  const processClusters = useCallback((clustersToProcess: ClusterData[]) => {
    if (!Array.isArray(clustersToProcess)) {
      console.error("processClusters received non-array data:", clustersToProcess);
      return [];
    }
    return clustersToProcess.map((cluster: ClusterData) => {
      const imagePaths = cluster.imagePaths;
      const firstImageMeta = cluster.firstImageMeta;

      const dates = imagePaths
        .map(() => (firstImageMeta?.pub_date ? new Date(firstImageMeta.pub_date).getFullYear() : 0))
        .filter((y: number) => y > 0);

      const clusterStartYear = dates.length > 0 ? Math.min(...dates) : 0;
      const clusterEndYear = dates.length > 0 ? Math.max(...dates) : 0;

      return {
        id: cluster.id,
        title: `Cluster ${cluster.id}`,
        imageCount: imagePaths.length,
        featureImage: firstImageMeta?.prediction_section_iiif_url || '/file.svg',
        alt: firstImageMeta ? `${firstImageMeta.name || 'Unknown'} - ${firstImageMeta.pub_date || 'Unknown'}` : "Cluster image",
        startYear: clusterStartYear,
        endYear: clusterEndYear
      };
    });
  }, []);

  useEffect(() => {
    const initialProcessedClusters = processClusters(allClusters.slice(0, ITEMS_PER_PAGE));
    setDisplayedClusters(initialProcessedClusters);
    setCurrentPage(1);
  }, [allClusters, processClusters]);

  const loadMoreClusters = useCallback(() => {
    setLoading(true);
    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const newClustersData = allClusters.slice(startIndex, endIndex);

    if (newClustersData.length > 0) {
      const processedNewClusters = processClusters(newClustersData);
      setDisplayedClusters((prevClusters) => [...prevClusters, ...processedNewClusters]);
      setCurrentPage(nextPage);
    }
    setLoading(false);
  }, [allClusters, currentPage, processClusters]);

  const hasMore = displayedClusters.length < allClusters.length;

  useEffect(() => {
    if (loading || !hasMore) return;

    const options = {
      root: null,
      rootMargin: "20px",
      threshold: 1.0,
    };

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMoreClusters();
      }
    }, options);

    if (observer.current && document.querySelector("#load-more-trigger")) {
      observer.current.observe(document.querySelector("#load-more-trigger") as Element);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loading, hasMore, loadMoreClusters]);


  const filteredClusters = useMemo(() => {
    return displayedClusters.filter(
      (cluster) => cluster.startYear >= startYear && cluster.endYear <= endYear
    );
  }, [displayedClusters, startYear, endYear]);

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

    // Recalculate layout after images load to get correct heights
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
  }, [filteredClusters]);



  return (
    <div className="relative">
      <div ref={containerRef} className="relative" style={{ height: containerHeight }}>
        {filteredClusters.map((cluster) => (
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
                <div className="absolute inset-0 bg-black/10 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <CardTitle className="text-white text-lg">{cluster.title}</CardTitle>
                  <CardDescription className="text-gray-200 text-sm">{cluster.imageCount} images ({cluster.startYear} - {cluster.endYear})</CardDescription>
                </div>
              </div>
            )}
          </Card>
        </Link>
      ))}
      {loading && <p className="w-full text-center py-4">Loading more clusters...</p>}
      {!loading && hasMore && <div id="load-more-trigger" style={{ height: "1px", position: "absolute", bottom: "-50px", width: "100%" }} />}
      {!hasMore && <p className="text-center w-full py-4">No more clusters to load.</p>}
    </div>
    </div>
  );
}