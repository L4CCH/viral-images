"use client"

import { useState, useRef, useLayoutEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/image-with-fallback";

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
  loadMoreError?: string | null;
}

const GAP = 16; // Corresponds to Tailwind's gap-4

const getColumnCount = () => {
  if (window.innerWidth >= 1024) return 10; // lg
  if (window.innerWidth >= 768) return 4; // md
  return 3; // sm
};

export function SearchResults({
  clusters,
  loadMore,
  hasMore,
  loadingMore = false,
  loadMoreError = null,
}: ClusterListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // Minimal shaping for display: derive title, counts, and years
  const processedClusters = useMemo<RenderedClusterCard[]>(
    () =>
      (clusters ?? []).map((cluster) => {
        const startYear = parseInt(cluster.dates.start_date.split("-")[0]);
        const endYear = parseInt(cluster.dates.end_date.split("-")[0]);
        return {
          id: cluster.id,
          title: `Cluster ${cluster.id}`,
          imageCount: cluster.imagePaths.length,
          featureImage: cluster.thumbnail || undefined,
          alt:
            cluster.newspapers.length > 0
              ? `${cluster.newspapers[0]} - ${startYear}`
              : "Cluster image",
          startYear,
          endYear,
        };
      }),
    [clusters],
  );

  // Shortest-column masonry. Tiles are absolutely positioned, so the layout is
  // recomputed whenever the container or any tile changes size (an image
  // loads, fails, or arrives lazily; the window is resized).
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const calculateLayout = () => {
      const items = Array.from(
        container.querySelectorAll<HTMLElement>(":scope > .masonry-item"),
      );
      if (items.length === 0) {
        setContainerHeight(0);
        return;
      }

      const columnCount = getColumnCount();
      const columnWidth = container.clientWidth / columnCount;
      const columnHeights: number[] = Array(columnCount).fill(0);

      items.forEach((item) => {
        const minHeight = Math.min(...columnHeights);
        const column = columnHeights.indexOf(minHeight);

        item.style.width = `${columnWidth - GAP}px`;
        item.style.left = `${column * columnWidth + GAP / 2}px`;
        item.style.top = `${minHeight + GAP}px`;

        columnHeights[column] += item.offsetHeight + GAP;
      });

      setContainerHeight(Math.max(...columnHeights));
    };

    calculateLayout();

    // Batch bursts of resize notifications into one layout per frame.
    let frame: number | null = null;
    const observer = new ResizeObserver(() => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        calculateLayout();
      });
    });
    observer.observe(container);
    container
      .querySelectorAll(":scope > .masonry-item")
      .forEach((item) => observer.observe(item));

    return () => {
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
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
              <div className="relative w-full h-auto">
                <ImageWithFallback
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
            </Card>
          </Link>
        ))}
      </div>
      {hasMore && (
        <div className="flex flex-col items-center gap-2 py-6 relative z-10 w-full">
          {loadMoreError && (
            <p role="alert" className="text-sm text-destructive">
              Couldn&apos;t load more results: {loadMoreError}
            </p>
          )}
          <Button
            onClick={() => loadMore()}
            disabled={loadingMore}
            variant="outline"
          >
            {loadingMore ? "Loading…" : loadMoreError ? "Try again" : "Show more results"}
          </Button>
        </div>
      )}
    </div>
  );
}
