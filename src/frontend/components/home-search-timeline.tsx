"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { Slider } from "@/components/ui/slider"
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


export function Timeline({ activeStartYear, activeEndYear }: TimelineProps) {
  // Get canonical date filters and handler from context
  const { startDate, endDate, handleDateRangeChange } = useFilters();
  const [zoomLevel] = useState(1)
  const [histogram, setHistogram] = useState<TimelineHistogram | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sliderRange, setSliderRange] = useState<[number, number] | null>(null)
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timelineContainerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef<'start' | 'end' | 'slider' | null>(null)
  const currentRangeRef = useRef<[number, number] | null>(null)

  // Fetch histogram from backend once on initial mount (static year counts)
  useEffect(() => {
    const fetchHistogram = async () => {
      try {
        setLoading(true)
        setError(null)

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

  const displayStartYear = sliderRange ? sliderRange[0] : startYear
  const displayEndYear = sliderRange ? sliderRange[1] : endYear

  // Keep local slider range in sync with context-driven years
  useEffect(() => {
    currentRangeRef.current = [startYear, endYear]
    setSliderRange([startYear, endYear])
  }, [startYear, endYear])

  // Convert histogram year_counts to a map for easier lookup
  const yearCountsMap: { [year: number]: number } = {};
  if (histogram) {
    histogram.year_counts.forEach(item => {
      yearCountsMap[item.year] = item.count;
    });
  }

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

  // Update visual state immediately without triggering search
  const updateVisualRange = (value: number[]) => {
    const [newStartYear, newEndYear] = value
    currentRangeRef.current = [newStartYear, newEndYear]
    setSliderRange([newStartYear, newEndYear])
  }

  // Update search context (debounced, only called when drag ends)
  const updateSearchContext = (value: number[]) => {
    const [newStartYear, newEndYear] = value
    const newStartDate = `${newStartYear}-01-01`
    const newEndDate = `${newEndYear}-12-31`
    handleDateRangeChange(newStartDate, newEndDate)
  }

  // Handle slider value changes - only update visual during drag, search on release
  const handleRangeChange = (value: number[]) => {
    // If currently dragging (bars or slider), only update visual
    if (isDraggingRef.current) {
      updateVisualRange(value)
      return
    }

    // For non-drag interactions (e.g., click), update visual immediately
    updateVisualRange(value)

    // Debounce search update for non-drag interactions
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      updateSearchContext(value)
    }, 300)
  }

  // Handle slider drag start/end for regular slider component
  const handleSliderMouseDown = () => {
    // Clear any pending debounce when starting drag
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }
    isDraggingRef.current = 'slider'
  }

  const handleSliderMouseUp = () => {
    if (isDraggingRef.current === 'slider') {
      // Update search context with final values from ref (always has latest values)
      const finalRange = currentRangeRef.current || [displayStartYear, displayEndYear]
      const [finalStart, finalEnd] = finalRange
      updateSearchContext([finalStart, finalEnd])
      isDraggingRef.current = null
    }
  }

  // Convert mouse X position to year value
  const getYearFromPosition = (clientX: number): number => {
    if (!timelineContainerRef.current) return displayStartYear
    
    const rect = timelineContainerRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    const yearCount = maxYear - minYear + 1
    const index = Math.round((percent / 100) * (yearCount - 1))
    return Math.max(minYear, Math.min(maxYear, minYear + index))
  }

  // Handle drag start on vertical bars
  const handleBarMouseDown = (type: 'start' | 'end', e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Clear any pending debounce when starting a new drag
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }
    
    isDraggingRef.current = type

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return
      
      const newYear = getYearFromPosition(moveEvent.clientX)
      const clampedYear = Math.max(minYear, Math.min(maxYear, newYear))
      
      // Update visual state immediately during drag, but don't trigger search
      if (isDraggingRef.current === 'start') {
        const newStart = Math.min(clampedYear, displayEndYear)
        updateVisualRange([newStart, displayEndYear])
      } else {
        const newEnd = Math.max(clampedYear, displayStartYear)
        updateVisualRange([displayStartYear, newEnd])
      }
    }

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return
      
      // Get final values from ref (always has latest values)
      const finalRange = currentRangeRef.current || [displayStartYear, displayEndYear]
      const [finalStart, finalEnd] = finalRange
      
      // Update search context only when drag ends
      updateSearchContext([finalStart, finalEnd])
      
      isDraggingRef.current = null
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Slider/marker position: match Radix Slider math so thumbs and vertical markers align.
  // Slider uses value normalization: (value - min) / (max - min).
  const getSliderPercent = useMemo(() => {
    const range = Math.max(1, maxYear - minYear)
    return (year: number) => {
      const percent = ((year - minYear) / range) * 100
      return Math.max(0, Math.min(100, percent))
    }
  }, [minYear, maxYear])

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

  

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* <h2 className="text-xl font-semibold">Timeline</h2> */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-lg">
              From {displayStartYear} to {displayEndYear}
            </Badge>
          </div>
        </div>
        {/* <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div> */}
      </div>

      <div className="relative border p-4 bg-background">
        {/* Year markers */}
        <div className="flex justify-between mb-2 text-xs text-muted-foreground" style={{ width: `${100 * zoomLevel}%` }}>
          {yearMarkers.map((year) => (
            <div key={year} className="text-center">
              {/* <div className="h-2 border-l border-muted-foreground"></div> */}
              <span>{year}</span>
            </div>
          ))}
        </div>

        {/* Timeline visualization with histogram and slider combined */}
        <div ref={timelineContainerRef} className="relative" style={{ width: `${100 * zoomLevel}%` }}>
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

          {/* Range slider control - thumbs invisible but functional */}
          <div 
            className="relative"
            onMouseDown={handleSliderMouseDown}
            onMouseUp={handleSliderMouseUp}
            onMouseLeave={handleSliderMouseUp}
          >
            <Slider
              value={[displayStartYear, displayEndYear]}
              min={minYear}
              max={maxYear}
              step={1}
              onValueChange={handleRangeChange}
              className="w-full [&_[data-slot=slider-thumb]]:opacity-0 [&_[data-slot=slider-thumb]]:pointer-events-auto [&_[data-slot=slider-thumb]]:size-4"
            />
          </div>

          {/* Draggable vertical bars - aligned with outer edges of selected year bars */}
          {/* These bars extend through both histogram and slider areas and handle dragging directly */}
          <div
            className="absolute top-0 bottom-0 w-[3px] bg-primary cursor-grab active:cursor-grabbing hover:w-[4px] transition-all z-20"
            style={{
              left: `${barGeometry.getLeft(displayStartYear)}%`,
            }}
            onMouseDown={(e) => handleBarMouseDown('start', e)}
          />
          <div
            className="absolute top-0 bottom-0 w-[3px] bg-primary cursor-grab active:cursor-grabbing hover:w-[4px] transition-all z-20"
            style={{
              left: `${barGeometry.getRight(displayEndYear)}%`,
              transform: "translateX(-100%)",
            }}
            onMouseDown={(e) => handleBarMouseDown('end', e)}
          />
        </div>
      </div>
    </div>
  )
}
