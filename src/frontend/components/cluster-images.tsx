"use client"

import type React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Newspaper,
  Eye,
  Building,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Cluster, Image } from "@/lib/types";

const parseDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  // Plain year (e.g. "1910") → assume Jan 1st of that year
  if (/^\d{4}$/.test(trimmed)) {
    const d = new Date(`${trimmed}-01-01T00:00:00Z`);
    return isNaN(d.getTime()) ? null : d;
  }

  // YYYY-MM-DD (backend documented format) – normalize to full ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(`${trimmed}T00:00:00Z`);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (value: string | Date | null | undefined) => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const date = parseDate(value);
  if (!date) return "Unknown date";

  return date.toLocaleDateString(undefined, options);
};

interface ClusterImagesProps {
  cluster: Cluster | null;
  images: Image[];
}

export function ClusterImages({ cluster, images }: ClusterImagesProps) {
  const INITIAL_VISIBLE = 10;
  const LOAD_MORE_STEP = 10;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const chronologicalScrollRef = useRef<HTMLDivElement>(null);

  const filteredImages = useMemo(() => {
    if (!images || images.length === 0) return [];

    return [...images].sort((a, b) => {
      const da = parseDate(a.date);
      const db = parseDate(b.date);

      if (!da && !db) return 0;
      if (!da) return 1; // push invalid/missing dates to the end
      if (!db) return -1;

      return da.getTime() - db.getTime();
    });
  }, [images]);

  // Reset selection and visible images when cluster/images change
  useEffect(() => {
    if (!filteredImages.length) {
      setSelectedImageIndex(0);
      setVisibleCount(INITIAL_VISIBLE);
      return;
    }

    setSelectedImageIndex(0);
    setVisibleCount(Math.min(INITIAL_VISIBLE, filteredImages.length));
  }, [cluster?.id, filteredImages.length]);

  // Scroll to selected image (within rendered thumbnails)
  useEffect(() => {
    const container = chronologicalScrollRef.current;
    if (!container || !filteredImages.length) return;

    const childCount = container.children.length;
    if (!childCount) return;

    const clampedIndex = Math.min(
      Math.max(0, selectedImageIndex),
      childCount - 1
    );

    const selectedImageElement = container.children[
      clampedIndex
    ] as HTMLElement | undefined;

    if (selectedImageElement) {
      selectedImageElement.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [selectedImageIndex, filteredImages.length, visibleCount]);

  if (!cluster || filteredImages.length === 0) {
    return (
      <div className="text-center py-4">
        No data available or images not found for this cluster.
      </div>
    );
  }

  const safeSelectedIndex = Math.min(
    Math.max(0, selectedImageIndex),
    filteredImages.length - 1
  );
  const selectedImage = filteredImages[safeSelectedIndex];

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handlePrevious = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedImageIndex < filteredImages.length - 1) {
      const nextIndex = selectedImageIndex + 1;
      setSelectedImageIndex(nextIndex);
      // Ensure the newly selected image is within the visible thumbnails
      setVisibleCount((current: number) =>
        Math.min(filteredImages.length, Math.max(current, nextIndex + 1))
      );
    }
  };

  const years = filteredImages
    .map((img: Image) => parseDate(img.date))
    .filter((d: Date | null): d is Date => !!d)
    .map((d: Date) => d.getFullYear());

  const startYear = years.length ? Math.min(...years) : undefined;
  const endYear = years.length ? Math.max(...years) : undefined;

  const visibleImages = useMemo(
    () => filteredImages.slice(0, Math.min(visibleCount, filteredImages.length)),
    [filteredImages, visibleCount]
  );

  const handleScroll: React.UIEventHandler<HTMLDivElement> = (event) => {
    const target = event.currentTarget;
    const { scrollLeft, clientWidth, scrollWidth } = target;
    const threshold = 200;

    if (scrollLeft + clientWidth >= scrollWidth - threshold) {
      setVisibleCount((current: number) => {
        if (current >= filteredImages.length) return current;
        return Math.min(filteredImages.length, current + LOAD_MORE_STEP);
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg bg-muted/50 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {cluster.thumbnail && (
          <img
            src={cluster.thumbnail}
            alt={`Cluster ${cluster.id} thumbnail`}
            className="w-24 max-w-[6rem] h-auto aspect-auto rounded border object-cover mb-4 sm:mb-0 sm:mr-4 shrink-0"
            style={{ maxHeight: "10rem" }}
          />
        )}
        <div className="w-full">
          <h1 className="font-semibold mb-2 text-2xl text-center sm:text-left">
            About Cluster {cluster.id}
          </h1>
          <p className="text-base text-muted-foreground text-center sm:text-left">
            {cluster.newspapers.length > 0
              ? `${images.length} images from ${cluster.newspapers.join(", ")} published between `
              : `${images.length} images published between `}
            {`${formatDate(cluster.dates.start_date)} and ${formatDate(cluster.dates.end_date)}.`}
          </p>
        </div>
      </div>


      {filteredImages.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-4 border rounded-lg">
            <div className="space-y-6">
              {/* Chronological Image Timeline */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-base">
                    {filteredImages.length} reprints
                    {` (${cluster.dates.start_date.slice(0, 4)}-${cluster.dates.end_date.slice(0, 4)})`}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
                      disabled={safeSelectedIndex === 0}
                    >
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

                <div
                  className="flex flex-nowrap gap-4 overflow-x-auto overflow-y-hidden max-h-[250px] pb-2 hide-scrollbar"
                  ref={chronologicalScrollRef}
                  onScroll={handleScroll}
                >
                  {visibleImages.map((image: Image, index: number) => {
                    const isSelected = index === safeSelectedIndex;
                    const alt = `${image.newspaper} - ${formatDate(
                      image.date
                    )}`;
                    return (
                      <div
                        key={image.id}
                        className="flex-none w-[150px] space-y-2"
                      >
                        <div
                          className={`relative overflow-hidden cursor-pointer h-[150px] ${
                            isSelected
                              ? "shadow-lg scale-105 transition-all"
                              : "group"
                          }`}
                          onClick={() => handleImageSelect(index)}
                        >
                          <NextImage
                            src={
                              image.url ||
                              "/placeholder.svg"
                            }
                            alt={alt}
                            width={500}
                            height={300}
                            loading="lazy"
                            className={`w-full h-full object-contain ${
                              !isSelected
                                ? "group-hover:scale-105 group-hover:shadow-md transition-transform duration-200"
                                : ""
                            }`}
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
                          <p className="text-base font-medium">
                            {formatDate(image.date)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {image.newspaper}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Timeline position indicator */}
                <div className="relative h-2 bg-muted rounded-full">
                  <div
                    className="absolute top-0 h-full w-1 bg-primary rounded-full transition-all duration-300"
                    style={{
                      left: `${
                        (safeSelectedIndex /
                          Math.max(1, filteredImages.length - 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Selected Image Details */}
              {selectedImage && (
                <div className="space-y-4 pt-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="relative overflow-hidden rounded-lg border flex items-center justify-center">
                        <NextImage
                          src={
                            selectedImage.url ||
                            "/placeholder.svg"
                          }
                          alt={`${selectedImage.newspaper} - ${formatDate(
                            selectedImage.date
                          )}`}
                          width={300}
                          height={300}
                          priority
                          className="object-contain"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-2xl">Image Details</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-lg">
                              {formatDate(selectedImage.date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Newspaper className="h-4 w-4 text-muted-foreground" />
                            <span className="text-lg">
                              {selectedImage.newspaper || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-lg">
                              {selectedImage.publisher || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-lg">
                              {selectedImage.place || "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2 text-base">Position in Timeline</h4>
                        <p className="text-base text-muted-foreground">
                          Image {safeSelectedIndex + 1} of{" "}
                          {filteredImages.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}