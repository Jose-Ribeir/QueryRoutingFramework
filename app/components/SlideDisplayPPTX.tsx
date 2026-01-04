'use client';

import React, { useMemo } from 'react';
import { PPTXSlide, PPTXTextElement } from '../utils/pptxParser';

interface SlideDisplayPPTXProps {
  slideData: PPTXSlide;
  className?: string;
}

// Standard PowerPoint slide dimensions in EMU (16:9 aspect ratio)
const SLIDE_WIDTH_EMU = 9144000; // 10 inches
const SLIDE_HEIGHT_EMU = 5143500; // 5.625 inches

function emuToPercentage(emu: number, isWidth: boolean): number {
  const dimension = isWidth ? SLIDE_WIDTH_EMU : SLIDE_HEIGHT_EMU;
  return (emu / dimension) * 100;
}

function emuToPixels(emu: number): number {
  // 1 inch = 914400 EMU, at 96 DPI: 1 inch = 96px
  return (emu / 914400) * 96;
}

export default function SlideDisplayPPTX({ slideData, className = '' }: SlideDisplayPPTXProps) {
  // Standard slide aspect ratio (16:9)
  const aspectRatio = 16 / 9;

  // Convert image data to blob URLs
  const imageUrls = useMemo(() => {
    return slideData.images.map((image) => {
      // Determine MIME type from file extension
      const ext = image.name.split('.').pop()?.toLowerCase();
      let mimeType = 'image/png';
      if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
      else if (ext === 'gif') mimeType = 'image/gif';
      else if (ext === 'png') mimeType = 'image/png';
      
      const blob = new Blob([image.data], { type: mimeType });
      return URL.createObjectURL(blob);
    });
  }, [slideData.images]);

  // Cleanup blob URLs on unmount
  React.useEffect(() => {
    return () => {
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);

  // Sort text elements by Y position (top to bottom)
  const sortedTextElements = useMemo(() => {
    return [...slideData.textElements].sort((a, b) => a.y - b.y);
  }, [slideData.textElements]);

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
      <div className="absolute inset-0">
        {/* Render images */}
        <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-4 p-4">
          {imageUrls.map((imageUrl, index) => (
            <img
              key={index}
              src={imageUrl}
              alt={`Slide ${slideData.slideNumber} image ${index + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          ))}
        </div>

        {/* Render text elements with accurate positioning */}
        <div className="relative z-10 h-full">
          {sortedTextElements.length === 0 && imageUrls.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>No content found on this slide</p>
            </div>
          )}
          {sortedTextElements.map((element, index) => {
            // Convert EMU coordinates to percentages for responsive positioning
            const leftPercent = emuToPercentage(element.x, true);
            const topPercent = emuToPercentage(element.y, false);
            const widthPercent = emuToPercentage(element.width, true);
            const fontSize = element.fontSize ? `${element.fontSize / 100}pt` : undefined;

            // Determine text size based on height or fontSize
            const heightPx = emuToPixels(element.height);
            const isHeading = heightPx > 40 || (element.fontSize && element.fontSize > 2000);
            const isSubheading = heightPx > 25 || (element.fontSize && element.fontSize > 1400);

            return (
              <div
                key={index}
                className="absolute"
                style={{
                  left: `${Math.max(0, Math.min(100, leftPercent))}%`,
                  top: `${Math.max(0, Math.min(100, topPercent))}%`,
                  width: `${Math.max(5, Math.min(100, widthPercent))}%`,
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
                    fontSize: fontSize,
                    fontFamily: element.fontName || 'inherit',
                    color: element.color || undefined,
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

