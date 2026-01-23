"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getTimelineHistogram, type TimelineHistogram } from "@/lib/api"
import { useFilters } from "@/contexts/filter-context"

interface TimelineProps {
  activeStartYear?: number;
  activeEndYear?: number;
}

export function Timeline({ activeStartYear, activeEndYear }: TimelineProps) {
  // Get filter state and handlers from context
  const { startYear, endYear, handleDateRangeChange } = useFilters();
  const [zoomLevel] = useState(1)
  const [histogram, setHistogram] = useState<TimelineHistogram | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch histogram from backend
  useEffect(() => {
    const fetchHistogram = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params: { start_date?: string; end_date?: string } = {};
        if (startYear) {
          params.start_date = `${startYear}-01-01`;
        }
        if (endYear) {
          params.end_date = `${endYear}-12-31`;
        }
        
        const fetchedHistogram = await getTimelineHistogram(params);
        setHistogram(fetchedHistogram);
      } catch (err) {
        console.error('Error fetching timeline histogram:', err);
        setError(err instanceof Error ? err.message : 'Failed to load timeline histogram');
      } finally {
        setLoading(false);
      }
    };

    fetchHistogram();
  }, [startYear, endYear]);

  // Convert histogram year_counts to a map for easier lookup
  const yearCountsMap: { [year: number]: number } = {};
  if (histogram) {
    histogram.year_counts.forEach(item => {
      yearCountsMap[item.year] = item.count;
    });
  }

  const minYear = histogram?.min_year ?? 1700
  const maxYear = histogram?.max_year ?? 2024
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

  

  const handleRangeChange = (value: number[]) => {
    const [newStartYear, newEndYear] = value
    handleDateRangeChange(newStartYear, newEndYear)
  }

  const getMarkerPosition = (year: number) => {
    return ((year - minYear) / (maxYear - minYear)) * 100
  }

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
            <Badge variant="secondary" className="text-sm">
              From {startYear} to {endYear}
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

        {/* Timeline visualization with histogram */}
        <div className="relative h-16 bg-muted/20 rounded" style={{ width: `${100 * zoomLevel}%` }}>
          {/* Selected range highlight */}
          <div
            className="absolute top-0 bottom-0 bg-primary/20"
            style={{
              left: `${getMarkerPosition(startYear)}%`,
              width: `${getMarkerPosition(endYear) - getMarkerPosition(startYear)}%`,
            }}
          />

          {/* Active cluster range highlight */}
          {activeStartYear && activeEndYear && (
            <div
              className="absolute top-0 bottom-0 bg-green-500/30 rounded border-x-2 border-green-500"
              style={{
                left: `${getMarkerPosition(activeStartYear)}%`,
                width: `${getMarkerPosition(activeEndYear) - getMarkerPosition(activeStartYear)}%`,
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
              const isInRange = yearNum >= startYear && yearNum <= endYear
              return (
                <div
                  key={yearNum}
                  className={`absolute bottom-0 bg-primary/70 hover:bg-primary transition-colors cursor-pointer ${
                    isInRange ? "opacity-100" : "opacity-40"
                  }`}
                  style={{
                    left: `${getMarkerPosition(yearNum)}%`,
                    width: `${Math.max(0.5, (1 / (maxYear - minYear)) * 100 * (zoomLevel >= 2 ? 3 : zoomLevel >= 1.5 ? 2 : 1))}%`,
                    height: `${getBarHeight(count)}px`,
                  }}
                  title={`${yearNum}: ${count} clusters`}
                />
              )
            })
          )}

          {/* Range slider handles indicators */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary border-l-2 border-primary"
            style={{ left: `${getMarkerPosition(startYear)}%` }}
          />
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary border-l-2 border-primary"
            style={{ left: `${getMarkerPosition(endYear)}%` }}
          />
        </div>

        {/* Range slider control */}
        <div className="space-y-2">
            
            <Slider
              value={[startYear, endYear]}
              min={minYear}
              max={maxYear}
              step={1}
              onValueChange={handleRangeChange}
              className="w-full"
            />
        </div>
      </div>
    </div>
  )
}
