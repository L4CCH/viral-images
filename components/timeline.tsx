"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TimelineProps {
  onDateRangeChange: (startYear: number, endYear: number) => void
  startYear: number
  endYear: number
  activeStartYear?: number
  activeEndYear?: number
  clusters: { [key: string]: string[] }
}

export function Timeline({ onDateRangeChange, startYear, endYear, activeStartYear, activeEndYear, clusters }: TimelineProps) {
  const [zoomLevel, setZoomLevel] = useState(1)

  const minYear = 1700
  const maxYear = 2024

  const getImageCountsPerYear = () => {
    const counts: { [year: number]: number } = {}

    const validClusters = clusters || {};

    Object.values(validClusters).forEach((imagePaths) => {
      if (imagePaths.length === 0) return

      let minClusterYear = Infinity
      let maxClusterYear = -Infinity

      imagePaths.forEach((path) => {
        const parts = path.split('/')
        const datePart = parts[parts.length - 3] // e.g., '1855083001'
        const year = parseInt(datePart.substring(0, 4), 10)

        if (!isNaN(year)) {
          minClusterYear = Math.min(minClusterYear, year)
          maxClusterYear = Math.max(maxClusterYear, year)
        }
      })

      if (minClusterYear !== Infinity && maxClusterYear !== -Infinity) {
        for (let year = minClusterYear; year <= maxClusterYear; year++) {
          counts[year] = (counts[year] || 0) + 1
        }
      }
    })

    return counts
  }

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

  

  const filteredCounts = Object.entries(imageCountsPerYear).filter(
    ([year]) => Number.parseInt(year) >= startYear && Number.parseInt(year) <= endYear,
  )

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
        <div className="flex justify-between mb-4 text-xs text-muted-foreground">
          {yearMarkers.map((year) => (
            <div key={year} className="text-center">
              <div className="h-2 border-l border-muted-foreground"></div>
              <span>{year}</span>
            </div>
          ))}
        </div>

        {/* Timeline visualization with histogram */}
        <div className="relative h-16 mb-6 bg-muted/20 rounded">
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

        {/* Quick preset buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => onDateRangeChange(1700, 1800)}>
            18th Century
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDateRangeChange(1800, 1900)}>
            19th Century
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDateRangeChange(1900, 2000)}>
            20th Century
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDateRangeChange(2000, 2024)}>
            21st Century
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDateRangeChange(1861, 1865)}>
            U.S. Civil War
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDateRangeChange(1914, 1918)}>
            WW I
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDateRangeChange(1939, 1945)}>
            WW II
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDateRangeChange(1960, 1970)}>
            1960s
          </Button>
        </div>

        {/* Statistics for selected range */}
        {filteredCounts.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Selected Range Statistics</h4>
              <Badge variant="outline">{filteredCounts.reduce((sum, [, count]) => sum + count, 0)} total images</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Years with data: </span>
                <span className="font-medium">{filteredCounts.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Peak year: </span>
                <span className="font-medium">
                  {
                    filteredCounts.reduce((max, [year, count]) => (count > max.count ? { year, count } : max), {
                      year: "",
                      count: 0,
                    }).year
                  }{" "}
                  ({filteredCounts.reduce((max, [, count]) => Math.max(max, count), 0)} images)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
