"use client"

import { useState } from "react"
import NextImage, { type ImageProps } from "next/image"
import { ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"

type ImageWithFallbackProps = Omit<ImageProps, "src"> & {
  src?: string | null
  /** Classes for the placeholder shown when the image is missing or fails to load. */
  fallbackClassName?: string
  /** Hide the "Image unavailable" text (e.g. for small thumbnails). */
  compact?: boolean
}

/**
 * next/image that swaps in a styled placeholder instead of the browser's
 * broken-image icon when `src` is empty or fails to load.
 */
export function ImageWithFallback({
  src,
  alt,
  fallbackClassName,
  compact = false,
  onError,
  ...props
}: ImageWithFallbackProps) {
  // Track which src failed so a new src is retried without an effect.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (!src || failedSrc === src) {
    return (
      <div
        role="img"
        aria-label={alt ? `${alt} (image unavailable)` : "Image unavailable"}
        className={cn(
          "flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 bg-muted text-muted-foreground",
          fallbackClassName,
        )}
      >
        <ImageOff aria-hidden className="size-6 opacity-60" />
        {!compact && <span className="text-xs">Image unavailable</span>}
      </div>
    )
  }

  return (
    <NextImage
      {...props}
      src={src}
      alt={alt}
      onError={(e) => {
        setFailedSrc(src)
        onError?.(e)
      }}
    />
  )
}
