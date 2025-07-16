"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Calendar, Newspaper, Info, ArrowLeft, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

// Sample data structure for image clusters
const imageClusters = [
  {
    id: 3,
    title: "Presidential Debate Coverage",
    description: "Visual coverage of the presidential debates across different newspapers spanning multiple decades",
    similarImages: [
      {
        id: 2,
        src: "https://tile.loc.gov/image-services/iiif/service:ndnp:ohi:batch_ohi_ingstad_ver01:data:sn85026051:00296027029:1850082401:0053/pct:43.34,61.78,13.23,11.25/pct:100/0/default.jpg",
        alt: "Early Presidential Debate",
        date: "October 21, 1960",
        publication: "The Morning Post",
        caption: "Kennedy and Nixon face off in the first televised presidential debate",
      },
      {
        id: 3,
        src: "/placeholder.svg?height=300&width=400",
        alt: "Reagan-Carter Debate",
        date: "October 28, 1980",
        publication: "The Evening Standard",
        caption: "Reagan asks viewers if they are better off than four years ago",
      },
      {
        id: 4,
        src: "/placeholder.svg?height=300&width=400",
        alt: "Bush-Clinton Debate",
        date: "October 11, 1992",
        publication: "The Truth Gazette",
        caption: "Town hall format introduces new dynamic to presidential debates",
      },
      {
        id: 5,
        src: "/placeholder.svg?height=300&width=400",
        alt: "Obama-Romney Debate",
        date: "October 3, 2012",
        publication: "Public Opinion Daily",
        caption: "Economic policy dominates the presidential debate discussion",
      },
      {
        id: 1,
        src: "/placeholder.svg?height=300&width=400",
        alt: "Presidential Debate Main Image",
        date: "October 15, 2020",
        publication: "The Daily Chronicle",
        caption: "Candidates face off in the final presidential debate",
      },
    ],
    // Additional publications of similar images
    alternatePublications: [
      {
        id: 101,
        src: "/placeholder.svg?height=180&width=240",
        alt: "Debate Coverage in Washington Post",
        date: "October 15, 2020",
        publication: "Washington Post",
        caption: "Presidential candidates clash on healthcare policy",
      },
      {
        id: 102,
        src: "/placeholder.svg?height=180&width=240",
        alt: "Debate Coverage in New York Times",
        date: "October 15, 2020",
        publication: "New York Times",
        caption: "Fact checking the final presidential debate",
      },
      {
        id: 103,
        src: "/placeholder.svg?height=180&width=240",
        alt: "Debate Coverage in Chicago Tribune",
        date: "October 16, 2020",
        publication: "Chicago Tribune",
        caption: "Analysis of debate performance and voter reactions",
      },
      {
        id: 104,
        src: "/placeholder.svg?height=180&width=240",
        alt: "Debate Coverage in Los Angeles Times",
        date: "October 16, 2020",
        publication: "Los Angeles Times",
        caption: "Presidential candidates outline their economic plans",
      },
      {
        id: 105,
        src: "/placeholder.svg?height=180&width=240",
        alt: "Debate Coverage in Boston Globe",
        date: "October 15, 2020",
        publication: "Boston Globe",
        caption: "Key moments from the final presidential debate",
      },
      {
        id: 106,
        src: "/placeholder.svg?height=180&width=240",
        alt: "Debate Coverage in Miami Herald",
        date: "October 16, 2020",
        publication: "Miami Herald",
        caption: "Presidential candidates address immigration policy",
      },
      {
        id: 107,
        src: "/placeholder.svg?height=180&width=240",
        alt: "Debate Coverage in Dallas Morning News",
        date: "October 15, 2020",
        publication: "Dallas Morning News",
        caption: "Energy policy takes center stage in presidential debate",
      },
    ],
  },
]

interface ImageClustersProps {
  startYear: number
  endYear: number
}

export function ImageClusters({ startYear, endYear }: ImageClustersProps) {
  const [currentCluster, setCurrentCluster] = useState(imageClusters[0])
  const [selectedImageIndex, setSelectedImageIndex] = useState(2) // Start with middle image
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Filter and sort images based on date range
  const getFilteredAndSortedImages = () => {
    return currentCluster.similarImages
      .filter((image) => {
        const imageYear = new Date(image.date).getFullYear()
        return imageYear >= startYear && imageYear <= endYear
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const filteredImages = getFilteredAndSortedImages()

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index)
  }

  const handlePrevious = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1)
    }
  }

  const handleNext = () => {
    if (selectedImageIndex < filteredImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1)
    }
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" })
    }
  }

  // Ensure selectedImageIndex is within bounds
  const safeSelectedIndex = Math.min(selectedImageIndex, filteredImages.length - 1)
  const selectedImage = filteredImages[safeSelectedIndex]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Image Cluster: {currentCluster.title}</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {filteredImages.length} images ({startYear}-{endYear})
          </Badge>
        </div>
      </div>

      {filteredImages.length === 0 && (
        <div className="p-6 text-center border rounded-lg bg-muted/50">
          <p className="text-muted-foreground">
            No images found in the selected time range ({startYear} - {endYear}). Try adjusting the timeline controls
            above.
          </p>
        </div>
      )}

      {filteredImages.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Chronological Image Timeline - 5 images horizontally */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Chronological Timeline</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrevious} disabled={safeSelectedIndex === 0}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Earlier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNext}
                      disabled={safeSelectedIndex === filteredImages.length - 1}
                    >
                      Later
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-4">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const imageIndex = Math.max(0, safeSelectedIndex - 2 + index)
                    const image = filteredImages[imageIndex]
                    const isSelected = imageIndex === safeSelectedIndex
                    const isAvailable = imageIndex < filteredImages.length

                    return (
                      <div key={index} className="space-y-2">
                        <div
                          className={`relative aspect-[4/3] overflow-hidden rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? "ring-2 ring-primary shadow-lg scale-105"
                              : isAvailable
                                ? "hover:ring-2 hover:ring-primary/50 hover:scale-102"
                                : "opacity-30"
                          }`}
                          onClick={() => isAvailable && handleImageSelect(imageIndex)}
                        >
                          {isAvailable ? (
                            <>
                              <Image
                                src={image.src || "/placeholder.svg"}
                                alt={image.alt}
                                fill
                                className="object-cover"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                  <div className="bg-primary text-primary-foreground rounded-full p-1">
                                    <Calendar className="h-4 w-4" />
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="absolute inset-0 bg-muted flex items-center justify-center">
                              <div className="text-muted-foreground text-xs">No image</div>
                            </div>
                          )}
                        </div>

                        {isAvailable && (
                          <div className="text-center space-y-1">
                            <p className="text-xs font-medium">{new Date(image.date).getFullYear()}</p>
                            <p className="text-xs text-muted-foreground truncate">{image.publication}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Timeline position indicator */}
                <div className="relative h-2 bg-muted rounded-full">
                  <div
                    className="absolute top-0 h-full w-1 bg-primary rounded-full transition-all duration-300"
                    style={{
                      left: `${(safeSelectedIndex / Math.max(1, filteredImages.length - 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Selected Image Details */}
              {selectedImage && (
                <div className="space-y-4 border-t pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border">
                        <Image
                          src={selectedImage.src || "/placeholder.svg"}
                          alt={selectedImage.alt}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Image Details</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{selectedImage.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Newspaper className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{selectedImage.publication}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Caption</h4>
                        <p className="text-sm text-muted-foreground">{selectedImage.caption}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Position in Timeline</h4>
                        <p className="text-sm text-muted-foreground">
                          Image {safeSelectedIndex + 1} of {filteredImages.length} in selected range
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Horizontal Scroll Gallery of Other Publications */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Similar Images in Other Publications</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">
                          How different newspapers covered the same event on similar dates.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="relative">
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur-sm"
                    onClick={scrollLeft}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  <ScrollArea className="pb-4">
                    <div className="flex space-x-4 px-8" ref={scrollContainerRef}>
                      {currentCluster.alternatePublications.map((pub) => (
                        <div key={pub.id} className="flex-none w-[200px]">
                          <div className="relative aspect-video overflow-hidden rounded-lg border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                            <Image src={pub.src || "/placeholder.svg"} alt={pub.alt} fill className="object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                              <p className="text-xs text-white truncate font-medium">{pub.publication}</p>
                              <p className="text-xs text-white/80 truncate">{pub.date}</p>
                            </div>
                          </div>
                          <p className="text-xs mt-1 line-clamp-2 text-muted-foreground">{pub.caption}</p>
                        </div>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>

                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur-sm"
                    onClick={scrollRight}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="p-4 border rounded-lg bg-muted/50">
        <h3 className="font-medium mb-2">About This Cluster</h3>
        <p className="text-sm text-muted-foreground">{currentCluster.description}</p>
      </div>
    </div>
  )
}
