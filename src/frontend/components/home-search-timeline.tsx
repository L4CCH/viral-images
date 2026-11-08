"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getTimelineHistogram } from "@/lib/api"
import { useFilters } from "@/contexts/filter-context"

export interface TimelineHistogram {
  year_counts: TimelineYearCount[];
  total_clusters: number;
  min_year: number;
  max_year: number;
}

interface TimelineYearCount {
  year: number;
  count: number;
}

interface TimelineProps {
  activeStartYear?: number;
  activeEndYear?: number;
}

type DragHandle = "start" | "end"

export function Timeline({ activeStartYear, activeEndYear }: TimelineProps) {
  // Get canonical date filters and handler from context
  const { startDate, endDate, handleDateRangeChange } = useFilters();
  const [zoomLevel] = useState(1)
  const [histogram, setHistogram] = useState<TimelineHistogram | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Range shown while a handle is being dragged; null when not dragging, in
  // which case the range comes from the filter context.
  const [dragRange, setDragRange] = useState<[number, number] | null>(null)
  const timelineContainerRef = useRef<HTMLDivElement>(null)
  // Latest range during a drag, readable from document-level listeners
  const currentRangeRef = useRef<[number, number] | null>(null)

  // Fetch histogram from backend once on initial mount (static year counts)
  useEffect(() => {
    const fetchHistogram = async () => {
      try {
        const fetchedHistogram = await getTimelineHistogram();
        setHistogram(fetchedHistogram);
      } catch (err) {
        console.error("Error fetching timeline histogram:", err);
        setError(err instanceof Error ? err.message : "Failed to load timeline histogram");
      } finally {
        setLoading(false);
      }
    };

    fetchHistogram();
  }, []);

  // Derive numeric years for visualization from canonical dates and histogram bounds
  const minYear = histogram?.min_year ?? 1900
  const maxYear = histogram?.max_year ?? 1950

  const startYear = useMemo(
    () => (startDate ? parseInt(startDate.split("-")[0], 10) : minYear),
    [startDate, minYear],
  )
  const endYear = useMemo(
    () => (endDate ? parseInt(endDate.split("-")[0], 10) : maxYear),
    [endDate, maxYear],
  )

  const displayStartYear = dragRange ? dragRange[0] : startYear
  const displayEndYear = dragRange ? dragRange[1] : endYear

  const maxCount = histogram ? Math.max(...histogram.year_counts.map(item => item.count), 0) : 0

  // Generate year markers based on zoom level
  const getYearMarkers = () => {
    const interval = zoomLevel >= 2 ? 10 : zoomLevel >= 1.5 ? 25 : 50
    const markers = []
    for (let year = minYear; year <= maxYear; year += interval) {
      markers.push(year)
    }
    return markers
  }

  const yearMarkers = getYearMarkers()

  // Convert pointer X position to year value
  const getYearFromPosition = (clientX: number): number => {
    if (!timelineContainerRef.current) return displayStartYear

    const rect = timelineContainerRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    const yearCount = maxYear - minYear + 1
    const index = Math.round((percent / 100) * (yearCount - 1))
    return Math.max(minYear, Math.min(maxYear, minYear + index))
  }

  // Drag a handle: update the highlight on every move, but only update the
  // search filters (and so trigger the API request) when the drag ends.
  const handleBarPointerDown = (type: DragHandle, e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    currentRangeRef.current = [displayStartYear, displayEndYear]
    setDragRange(currentRangeRef.current)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const range = currentRangeRef.current
      if (!range) return
      const year = getYearFromPosition(moveEvent.clientX)
      const next: [number, number] =
        type === "start"
          ? [Math.min(year, range[1]), range[1]]
          : [range[0], Math.max(year, range[0])]
      if (next[0] === range[0] && next[1] === range[1]) return
      currentRangeRef.current = next
      setDragRange(next)
    }

    const handlePointerUp = () => {
      document.removeEventListener("pointermove", handlePointerMove)
      document.removeEventListener("pointerup", handlePointerUp)
      document.removeEventListener("pointercancel", handlePointerUp)

      const finalRange = currentRangeRef.current
      currentRangeRef.current = null
      setDragRange(null)
      if (finalRange && (finalRange[0] !== startYear || finalRange[1] !== endYear)) {
        handleDateRangeChange(`${finalRange[0]}-01-01`, `${finalRange[1]}-12-31`)
      }
    }

    document.addEventListener("pointermove", handlePointerMove)
    document.addEventListener("pointerup", handlePointerUp)
    document.addEventListener("pointercancel", handlePointerUp)
  }

  // Bar geometry: tile bars across the full width with no gaps and no bleed.
  // Each year gets an equal-width segment [k / N, (k + 1) / N] where N = number of years.
  const barGeometry = useMemo(() => {
    const yearCount = Math.max(1, maxYear - minYear + 1)
    const width = 100 / yearCount
    const getLeft = (year: number) => {
      const index = Math.min(
        yearCount - 1,
        Math.max(0, year - minYear)
      )
      return (index / yearCount) * 100
    }
    const getRight = (year: number) => {
      return getLeft(year) + width
    }
    return { width, getLeft, getRight }
  }, [minYear, maxYear])

  const getBarHeight = (count: number) => {
    return (count / maxCount) * 40 // Max height of 40px
  }

  // Wide invisible hit area centered on a thin visible line. No transition on
  // `left`, so the handle moves in lockstep with the selection highlight.
  const handleClassName =
    "group/handle absolute -top-1 -bottom-1 z-20 flex w-3 -translate-x-1/2 cursor-grab touch-none justify-center active:cursor-grabbing"
  const handleLineClassName =
    "h-full w-[3px] bg-primary transition-[width] group-hover/handle:w-[4px] group-active/handle:w-[4px]"

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-lg">
              From {displayStartYear} to {displayEndYear}
            </Badge>
          </div>
        </div>
      </div>

      <div className="relative border p-4 bg-background">
        {/* Year markers */}
        <div className="flex justify-between mb-2 text-xs text-muted-foreground" style={{ width: `${100 * zoomLevel}%` }}>
          {yearMarkers.map((year) => (
            <div key={year} className="text-center">
              <span>{year}</span>
            </div>
          ))}
        </div>

        {/* Timeline visualization with histogram and drag handles */}
        <div ref={timelineContainerRef} className="relative select-none" style={{ width: `${100 * zoomLevel}%` }}>
          {/* Histogram container */}
          <div className="relative h-16 bg-muted/20 rounded mb-2">
            {/* Selected range highlight */}
            <div
              className="absolute top-0 bottom-0 bg-primary/20"
              style={{
                left: `${barGeometry.getLeft(displayStartYear)}%`,
                width: `${barGeometry.getRight(displayEndYear) - barGeometry.getLeft(displayStartYear)}%`,
              }}
            />

            {/* Active cluster range highlight */}
            {activeStartYear && activeEndYear && (
              <div
                className="absolute top-0 bottom-0 bg-green-500/30 rounded border-x-2 border-green-500"
                style={{
                  left: `${barGeometry.getLeft(activeStartYear)}%`,
                  width: `${barGeometry.getRight(activeEndYear) - barGeometry.getLeft(activeStartYear)}%`,
                }}
              />
            )}

            {/* Histogram bars */}
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                Loading histogram...
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-destructive">
                Error: {error}
              </div>
            ) : (
              histogram?.year_counts.map((item) => {
                const yearNum = item.year
                const count = item.count
                const isInRange = yearNum >= displayStartYear && yearNum <= displayEndYear
                return (
                  <div
                    key={yearNum}
                    className={`absolute bottom-0 bg-primary/70 hover:bg-primary transition-colors cursor-pointer ${
                      isInRange ? "opacity-100" : "opacity-40"
                    }`}
                    style={{
                      left: `${barGeometry.getLeft(yearNum)}%`,
                      width: `${barGeometry.width}%`,
                      height: `${getBarHeight(count)}px`,
                    }}
                    title={`${yearNum}: ${count} clusters`}
                  />
                )
              })
            )}
          </div>

          {/* Draggable handles at the outer edges of the selected year bars */}
          <div
            className={handleClassName}
            style={{ left: `${barGeometry.getLeft(displayStartYear)}%` }}
            onPointerDown={(e) => handleBarPointerDown("start", e)}
            aria-label="Drag to change start year"
          >
            <div className={handleLineClassName} />
          </div>
          <div
            className={handleClassName}
            style={{ left: `${barGeometry.getRight(displayEndYear)}%` }}
            onPointerDown={(e) => handleBarPointerDown("end", e)}
            aria-label="Drag to change end year"
          >
            <div className={handleLineClassName} />
          </div>
        </div>
      </div>
    </div>
  )
}
