'use client';

import React, { useState, useEffect, useCallback } from 'react';
import SlideDisplay from './SlideDisplay';
import { SlideData, loadSlideData, loadPresentationSummary } from '../utils/slideData';

interface SlideViewerProps {
  initialSlide?: number;
}

export default function SlideViewer({ initialSlide = 1 }: SlideViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [slideData, setSlideData] = useState<SlideData | null>(null);
  const [totalSlides, setTotalSlides] = useState(26);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load presentation summary on mount
  useEffect(() => {
    loadPresentationSummary()
      .then((summary) => {
        setTotalSlides(summary.total_slides);
      })
      .catch((err) => {
        console.error('Failed to load presentation summary:', err);
        setError('Failed to load presentation data');
      });
  }, []);

  // Load slide data when current slide changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    loadSlideData(currentSlide)
      .then((data) => {
        setSlideData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(`Failed to load slide ${currentSlide}:`, err);
        setError(`Failed to load slide ${currentSlide}`);
        setIsLoading(false);
      });
  }, [currentSlide]);

  // Navigation functions
  const goToPrevious = useCallback(() => {
    setCurrentSlide((prev) => Math.max(1, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentSlide((prev) => Math.min(totalSlides, prev + 1));
  }, [totalSlides]);

  const goToSlide = useCallback((slideNumber: number) => {
    if (slideNumber >= 1 && slideNumber <= totalSlides) {
      setCurrentSlide(slideNumber);
    }
  }, [totalSlides]);

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
          goToSlide(totalSlides);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToPrevious, goToNext, goToSlide, totalSlides, isFullscreen]);

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

  if (error && !slideData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : 'min-h-screen bg-gray-100 py-8'}`}>
      {/* Navigation Bar */}
      <div
        className={`${
          isFullscreen ? 'fixed top-0 left-0 right-0 z-10' : 'sticky top-0'
        } bg-white/95 backdrop-blur-sm shadow-md border-b border-gray-200`}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPrevious}
              disabled={currentSlide === 1 || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={goToNext}
              disabled={currentSlide === totalSlides || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
            <div className="text-gray-700 font-medium">
              Slide {currentSlide} of {totalSlides}
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
              className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
            />
            <button
              onClick={toggleFullscreen}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors"
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading slide {currentSlide}...</p>
            </div>
          </div>
        ) : slideData ? (
          <SlideDisplay slideData={slideData} />
        ) : (
          <div className="flex items-center justify-center min-h-[600px]">
            <p className="text-gray-600">No slide data available</p>
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint (only show in embedded mode) */}
      {!isFullscreen && (
        <div className="container mx-auto px-4 mt-4 text-center text-sm text-gray-500">
          Use arrow keys to navigate • Press F11 or click Fullscreen for presentation mode
        </div>
      )}
    </div>
  );
}

