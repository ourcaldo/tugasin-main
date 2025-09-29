"use client";

import React, { useState } from 'react'
import Image from 'next/image'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

interface ImageWithFallbackProps {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  loading?: 'lazy' | 'eager'
  fill?: boolean
  unoptimized?: boolean
}

export function ImageWithFallback({
  src,
  alt,
  className,
  style,
  width,
  height,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
  loading = 'lazy',
  fill = false,
  unoptimized = false,
  ...rest
}: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    setDidError(true)
  }

  if (didError) {
    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle relative ${className ?? ''}`}
        style={style}
      >
        <div className="flex items-center justify-center w-full h-full">
          <img 
            src={ERROR_IMG_SRC} 
            alt="Error loading image" 
            data-original-url={src} 
            className="opacity-30"
          />
        </div>
      </div>
    )
  }

  // If fill prop is true, use fill mode for responsive containers
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        style={style}
        sizes={sizes}
        priority={priority}
        onError={handleError}
        unoptimized={unoptimized}
        {...rest}
      />
    )
  }

  // Use explicit width/height when provided
  if (width && height) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        sizes={sizes}
        priority={priority}
        loading={loading}
        onError={handleError}
        unoptimized={unoptimized}
        {...rest}
      />
    )
  }

  // Check if the container expects fill behavior (has aspect ratio classes or explicit dimensions)
  // Only use fill if explicitly requested through className or style, not just because of object-cover
  const shouldUseFill = className?.includes('aspect-') || 
                        (className?.includes('h-') && !className?.includes('h-auto')) ||
                        (style?.height && style.height !== 'auto' && style.height !== '0');

  if (shouldUseFill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        style={style}
        sizes={sizes}
        priority={priority}
        onError={handleError}
        unoptimized={unoptimized}
        {...rest}
      />
    )
  }

  // Default to regular image behavior for cases like w-full h-auto
  return (
    <Image
      src={src}
      alt={alt}
      width={0}
      height={0}
      className={className}
      style={{ width: '100%', height: 'auto', ...style }}
      sizes={sizes}
      priority={priority}
      onError={handleError}
      unoptimized={unoptimized}
      {...rest}
    />
  )
}
