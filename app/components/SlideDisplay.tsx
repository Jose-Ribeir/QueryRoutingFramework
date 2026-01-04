'use client';

import React, { useState } from 'react';
import { SlideData, emuToPercentage, getImagePath } from '../utils/slideData';

// Component to try loading images with different extensions
function ImageLoader({ paths, alt }: { paths: string[]; alt: string }) {
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError || currentPathIndex >= paths.length) {
    return null;
  }

  return (
    <img
      src={paths[currentPathIndex]}
      alt={alt}
      className={`max-w-full max-h-full object-contain ${isLoaded ? 'block' : 'hidden'}`}
      onError={() => {
        if (currentPathIndex < paths.length - 1) {
          setCurrentPathIndex(currentPathIndex + 1);
        } else {
          setHasError(true);
        }
      }}
      onLoad={() => {
        setIsLoaded(true);
      }}
    />
  );
}

interface SlideDisplayProps {
  slideData: SlideData;
  className?: string;
}

export default function SlideDisplay({ slideData, className = '' }: SlideDisplayProps) {
  // Standard slide aspect ratio (16:9)
  const aspectRatio = 16 / 9;

  // Get available images for this slide
  // We'll try to detect images by checking common patterns
  // For now, we'll try up to 8 images (based on slide_17 having 8 images)
  const maxImages = 8;
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif'];
  
  // Generate image paths with different extensions to try
  const imagePaths: Array<{ index: number; paths: string[] }> = [];
  for (let i = 1; i <= maxImages; i++) {
    imagePaths.push({
      index: i,
      paths: imageExtensions.map(ext => getImagePath(slideData.slide_number, i, ext)),
    });
  }

  // Sort text elements by top position for better natural flow
  const sortedTextElements = [...slideData.text_elements].sort((a, b) => a.top - b.top);

  return (
    <div
      className={`relative bg-white rounded-lg shadow-2xl overflow-hidden ${className}`}
      style={{
        aspectRatio: `${aspectRatio}`,
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Slide content container */}
      <div className="absolute inset-0 p-8 md:p-12">
        {/* Render images first (background layer) */}
        <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-4 p-4">
          {imagePaths.map(({ index, paths }) => (
            <ImageLoader
              key={index}
              paths={paths}
              alt={`Slide ${slideData.slide_number} image ${index}`}
            />
          ))}
        </div>

        {/* Render text elements with hybrid positioning */}
        <div className="relative z-10 h-full">
          {sortedTextElements.map((element, index) => {
            // Convert EMU coordinates to percentages for responsive positioning
            const leftPercent = emuToPercentage(element.left, true);
            const topPercent = emuToPercentage(element.top, false);
            const widthPercent = emuToPercentage(element.width, true);
            const heightPercent = emuToPercentage(element.height, false);

            // Determine text size based on height
            // Approximate: if height is large, it's probably a heading
            const isHeading = element.height > 1000000; // ~100px in EMU
            const isSubheading = element.height > 500000; // ~50px in EMU

            return (
              <div
                key={index}
                className="absolute"
                style={{
                  left: `${Math.max(0, Math.min(100, leftPercent))}%`,
                  top: `${Math.max(0, Math.min(100, topPercent))}%`,
                  width: `${Math.max(5, Math.min(100, widthPercent))}%`,
                  // Don't set height as percentage, let text flow naturally
                }}
              >
                <div
                  className={`text-gray-900 break-words ${
                    isHeading
                      ? 'text-2xl md:text-4xl font-bold'
                      : isSubheading
                      ? 'text-xl md:text-2xl font-semibold'
                      : 'text-base md:text-lg'
                  }`}
                  style={{
                    lineHeight: '1.4',
                  }}
                >
                  {element.text.split('\n').map((line, lineIndex, array) => (
                    <React.Fragment key={lineIndex}>
                      {line}
                      {lineIndex < array.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

