"use client"

import { useState } from "react"
import { Timeline } from "@/components/timeline"
import { ImageClusters } from "@/components/image-clusters"


export default function Home() {
  const [startYear, setStartYear] = useState(1756)
  const [endYear, setEndYear] = useState(1963)

  const handleDateRangeChange = (newStartYear: number, newEndYear: number) => {
    setStartYear(newStartYear)
    setEndYear(newEndYear)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Newspaper Image Clusters Timeline</h1>
      <Timeline onDateRangeChange={handleDateRangeChange} startYear={startYear} endYear={endYear} />
      <ImageClusters startYear={startYear} endYear={endYear} />
    </div>
  )
}
