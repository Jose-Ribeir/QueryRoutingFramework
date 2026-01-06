'use client';

import React, { useState, useEffect, useCallback } from 'react';
import SlideDisplayPPTX from './SlideDisplayPPTX';
import { PPTXSlide } from '../utils/pptxParser';

interface SlideViewerPPTXProps {
  initialSlide?: number;
}

export default function SlideViewerPPTX({ initialSlide = 1 }: SlideViewerPPTXProps) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [slides, setSlides] = useState<PPTXSlide[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all slides from PPTX on mount
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    fetch('/api/parse-pptx')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to parse PPTX file');
        }
        return res.json();
      })
      .then((data) => {
        console.log('Received slides data:', data);
        const slidesData = data.slides || [];
        console.log(`Loaded ${slidesData.length} slides`);
        if (slidesData.length > 0) {
          console.log('First slide:', slidesData[0]);
          console.log(`First slide has ${slidesData[0].textElements?.length || 0} text elements and ${slidesData[0].images?.length || 0} images`);
        }
        setSlides(slidesData);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load PPTX:', err);
        setError(err.message || 'Failed to load presentation');
        setIsLoading(false);
      });
  }, []);

  // Navigation functions
  const goToPrevious = useCallback(() => {
    setCurrentSlide((prev) => Math.max(1, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentSlide((prev) => Math.min(slides.length, prev + 1));
  }, [slides.length]);

  const goToSlide = useCallback((slideNumber: number) => {
    if (slideNumber >= 1 && slideNumber <= slides.length) {
      setCurrentSlide(slideNumber);
    }
  }, [slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isFullscreen && e.key === 'Escape') {
        setIsFullscreen(false);
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Home':
          e.preventDefault();
          goToSlide(1);
          break;
        case 'End':
          e.preventDefault();
          goToSlide(slides.length);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToPrevious, goToNext, goToSlide, slides.length, isFullscreen]);

  // Fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const currentSlideData = slides[currentSlide - 1];
  const totalSlides = slides.length;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ppt-light2">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-ppt-accent1 text-white rounded hover:bg-ppt-accent4"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-ppt-dark2' : 'min-h-screen bg-ppt-light2 py-8'}`}>
      {/* Navigation Bar */}
      <div
        className={`${
          isFullscreen ? 'fixed top-0 left-0 right-0 z-10' : 'sticky top-0'
        } bg-ppt-light1/95 backdrop-blur-sm shadow-md border-b border-ppt-light2`}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPrevious}
              disabled={currentSlide === 1 || isLoading}
              className="px-4 py-2 bg-ppt-accent1 text-white rounded hover:bg-ppt-accent4 disabled:bg-ppt-light2 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={goToNext}
              disabled={currentSlide === totalSlides || isLoading}
              className="px-4 py-2 bg-ppt-accent1 text-white rounded hover:bg-ppt-accent4 disabled:bg-ppt-light2 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
            <div className="text-ppt-dark2 font-medium">
              Slide {currentSlide} of {totalSlides || '...'}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min={1}
              max={totalSlides}
              value={currentSlide}
              onChange={(e) => {
                const num = parseInt(e.target.value);
                if (!isNaN(num)) {
                  goToSlide(num);
                }
              }}
              className="w-20 px-2 py-1 border border-ppt-light2 rounded text-center"
              disabled={isLoading}
            />
            <button
              onClick={toggleFullscreen}
              className="px-4 py-2 bg-ppt-dark2 text-white rounded hover:bg-ppt-dark2/80 transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? '⤓ Exit' : '⤢ Fullscreen'}
            </button>
          </div>
        </div>
      </div>

      {/* Slide Display Area */}
      <div className={`container mx-auto px-4 ${isFullscreen ? 'pt-20 pb-4' : 'pt-8'}`}>
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ppt-accent1 mx-auto mb-4"></div>
              <p className="text-ppt-dark2/70">Loading presentation...</p>
            </div>
          </div>
        ) : currentSlideData ? (
          <SlideDisplayPPTX slideData={currentSlideData} />
        ) : (
          <div className="flex items-center justify-center min-h-[600px]">
            <p className="text-ppt-dark2/70">No slide data available</p>
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint (only show in embedded mode) */}
      {!isFullscreen && (
        <div className="container mx-auto px-4 mt-4 text-center text-sm text-ppt-dark2/60">
          Use arrow keys to navigate • Press F11 or click Fullscreen for presentation mode
        </div>
      )}
    </div>
  );
}

