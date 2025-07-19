"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ClusterData {
  id: string;
  imagePaths: string[];
  firstImageMeta?: { pub_date?: string };
}

interface TimelineProps {
  onDateRangeChange: (startYear: number, endYear: number) => void;
  startYear: number;
  endYear: number;
  activeStartYear?: number;
  activeEndYear?: number;
  clusters: ClusterData[];
}

export function Timeline({ onDateRangeChange, startYear, endYear, activeStartYear, activeEndYear, clusters }: TimelineProps) {
  const [zoomLevel, setZoomLevel] = useState(1)

  const minYear = 1700
  const maxYear = 2024

  const getImageCountsPerYear = () => {
    const counts: { [year: number]: number } = {};

    (clusters || []).forEach((cluster) => {
      if (!cluster.firstImageMeta?.pub_date) return;

      const year = new Date(cluster.firstImageMeta.pub_date).getFullYear();

      if (!isNaN(year)) {
        counts[year] = (counts[year] || 0) + cluster.imagePaths.length;
      }
    });

    return counts;
  };

  const imageCountsPerYear = getImageCountsPerYear()
  const maxCount = Math.max(...Object.values(imageCountsPerYear))

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

  const handleZoomIn = () => {
    if (zoomLevel < 3) setZoomLevel(zoomLevel + 0.5)
  }

  const handleZoomOut = () => {
    if (zoomLevel > 0.5) setZoomLevel(zoomLevel - 0.5)
  }

  const handleRangeChange = (value: number[]) => {
    const [newStartYear, newEndYear] = value
    onDateRangeChange(newStartYear, newEndYear)
  }

  const getMarkerPosition = (year: number) => {
    return ((year - minYear) / (maxYear - minYear)) * 100
  }

  const getBarHeight = (count: number) => {
    return (count / maxCount) * 40 // Max height of 40px
  }

  

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Timeline</h2>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-sm">
              From {startYear} to {endYear}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative border rounded-lg p-6 bg-background">
        {/* Year markers */}
        <div className="flex justify-between mb-4 text-xs text-muted-foreground" style={{ width: `${100 * zoomLevel}%` }}>
          {yearMarkers.map((year) => (
            <div key={year} className="text-center">
              <div className="h-2 border-l border-muted-foreground"></div>
              <span>{year}</span>
            </div>
          ))}
        </div>

        {/* Timeline visualization with histogram */}
        <div className="relative h-16 mb-6 bg-muted/20 rounded" style={{ width: `${100 * zoomLevel}%` }}>
          {/* Selected range highlight */}
          <div
            className="absolute top-0 bottom-0 bg-primary/20 rounded"
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
          {Object.entries(imageCountsPerYear).map(([year, count]) => {
            const yearNum = Number.parseInt(year)
            const isInRange = yearNum >= startYear && yearNum <= endYear
            return (
              <div
                key={year}
                className={`absolute bottom-0 bg-primary/70 hover:bg-primary transition-colors cursor-pointer ${
                  isInRange ? "opacity-100" : "opacity-40"
                }`}
                style={{
                  left: `${getMarkerPosition(yearNum)}%`,
                  width: `${Math.max(0.5, (1 / (maxYear - minYear)) * 100 * (zoomLevel >= 2 ? 3 : zoomLevel >= 1.5 ? 2 : 1))}%`,
                  height: `${getBarHeight(count)}px`,
                }}
                title={`${year}: ${count} images`}
              />
            )
          })}

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
