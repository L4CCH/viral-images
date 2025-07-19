"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Calendar, Newspaper, Info, ArrowLeft, ArrowRight, Building, MapPin, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

import { MetadataItem } from "@/lib/types";

interface ImageClustersProps {
  startYear: number
  endYear: number
  clusterId: string
  metadata: MetadataItem[];
}

interface SimilarImage {
  id: string;
  src: string;
  alt: string;
  date: string;
  publication: string;
  publisher: string;
  place_of_publication: string;
  caption: string;
}

interface Cluster {
  id: string;
  title: string;
  description: string;
  similarImages: SimilarImage[];
  alternatePublications: SimilarImage[];
}

export function ImageClusters({ startYear, endYear, clusterId, metadata: metadataProp }: ImageClustersProps) {
  const [imageClusters, setImageClusters] = useState<Cluster[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const chronologicalScrollRef = useRef<HTMLDivElement>(null)
  const alternatePublicationsScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const clustersRes = await fetch('/api/data?type=clusters');

        if (!clustersRes.ok) throw new Error('Failed to fetch clusters');

        const clustersData = await clustersRes.json();

        const metadataMap = new Map(metadataProp.map((item) => [item.filepath, item]));

        const processedClusters: Cluster[] = Object.entries(clustersData).map(([id, imagePaths]) => {
          const similarImages: SimilarImage[] = (imagePaths as string[])
            .map((filepath) => {
              const meta = metadataMap.get(filepath);
              if (!meta) {
                return null;
              }
              return {
                id: filepath,
                src: meta.prediction_section_iiif_url,
                alt: `${meta.name} - ${meta.pub_date}`,
                date: meta.pub_date,
                publication: meta.name,
                publisher: meta.publisher,
                place_of_publication: meta.place_of_publication,
                caption: `Published in ${meta.name} on ${meta.pub_date}.`,
              };
            })
            .filter((image): image is SimilarImage => image !== null);

          return {
            id,
            title: `Cluster ${id}`,
            description: "A cluster of visually similar images from historical newspapers.",
            similarImages,
            alternatePublications: [],
          };
        });
        setImageClusters(processedClusters);

      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [metadataProp]);

  const currentCluster = useMemo(() => {
    if (!imageClusters) return null;
    return imageClusters.find((c) => c.id === clusterId);
  }, [imageClusters, clusterId]);

  const filteredImages = useMemo(() => {
    if (!currentCluster) return [];
    return currentCluster.similarImages
      .filter((image) => {
        const imageYear = new Date(image.date).getFullYear();
        return imageYear >= startYear && imageYear <= endYear;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [currentCluster, startYear, endYear]);

  // Scroll to selected image
  useEffect(() => {
    if (chronologicalScrollRef.current && filteredImages.length > 0) {
      const selectedImageElement = chronologicalScrollRef.current.children[selectedImageIndex] as HTMLElement;
      if (selectedImageElement) {
        selectedImageElement.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  }, [selectedImageIndex, filteredImages, currentCluster]);

  if (loading) {
    return <div className="text-center py-4">Loading images...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  if (!imageClusters || !currentCluster) {
    return <div className="text-center py-4">No image cluster data available or cluster not found.</div>;
  }

  // Ensure selectedImageIndex is within bounds

  const safeSelectedIndex = Math.min(Math.max(0, selectedImageIndex), filteredImages.length - 1)
  const selectedImage = filteredImages[safeSelectedIndex]

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

  const scrollAlternatePublicationsLeft = () => {
    if (alternatePublicationsScrollRef.current) {
      alternatePublicationsScrollRef.current.scrollBy({ left: -200, behavior: "smooth" })
    }
  }

  const scrollAlternatePublicationsRight = () => {
    if (alternatePublicationsScrollRef.current) {
      alternatePublicationsScrollRef.current.scrollBy({ left: 200, behavior: "smooth" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{currentCluster.title}</h2>
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
              {/* Chronological Image Timeline */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Image Reproductions</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrevious} disabled={safeSelectedIndex === 0}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Earlier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNext}
                      disabled={safeSelectedIndex >= filteredImages.length - 1}
                    >
                      Later
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-nowrap gap-4 overflow-x-auto overflow-y-hidden max-h-[250px] pb-4 hide-scrollbar" ref={chronologicalScrollRef}>
                  {filteredImages.map((image, index) => {
                    const isSelected = index === safeSelectedIndex
                    return (
                      <div key={image.id} className="flex-none w-[150px] space-y-2">
                        <div
                          className={`relative overflow-hidden cursor-pointer h-[150px] ${
                            isSelected
                              ? "shadow-lg scale-105 transition-all"
                              : "group"
                          }`}
                          onClick={() => handleImageSelect(index)}
                        >
                          <Image
                            src={image.src || "/placeholder.svg"}
                            alt={image.alt}
                            width={500} // Placeholder width
                            height={300} // Placeholder height
                            className={`w-full h-full object-contain ${!isSelected ? "group-hover:scale-105 group-hover:shadow-md transition-transform duration-200" : ""}`}
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                              <div className="bg-primary text-primary-foreground rounded-full p-1">
                                <Eye className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-center space-y-1 mt-2">
                          <p className="text-xs font-medium">{formatDate(image.date)}</p>
                          <p className="text-[0.65rem] text-muted-foreground truncate">{image.publication}</p>
                        </div>
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
                      <div className="relative overflow-hidden rounded-lg border flex items-center justify-center max-h-[400px]">
                        <Image
                          src={selectedImage.src || "/placeholder.svg"}
                          alt={selectedImage.alt}
                          width={800} // Placeholder width
                          height={600} // Placeholder height
                          className="w-full h-full object-contain"
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
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{selectedImage.publisher}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{selectedImage.place_of_publication}</span>
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
              {currentCluster.alternatePublications.length > 0 && (
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
                      onClick={scrollAlternatePublicationsLeft}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <ScrollArea className="pb-4 max-h-[200px]">
                      <div className="flex space-x-4 px-8" ref={alternatePublicationsScrollRef}>
                        {currentCluster.alternatePublications.map((pub) => (
                          <div key={pub.id} className="flex-none w-[200px]">
                            <div className="relative overflow-hidden rounded-lg border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                              <Image src={pub.src || "/placeholder.svg"} alt={pub.alt} width={200} height={150} className="w-full h-auto object-cover" />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                                <p className="text-xs text-white truncate font-medium">{pub.publication}</p>
                                <p className="text-xs text-white/80 truncate">{pub.date}</p>
                              </div>
                            </div>
                            <p className="text-xs mt-1 line-clamp-2 text-muted-foreground">{pub.caption}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur-sm"
                      onClick={scrollAlternatePublicationsRight}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
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