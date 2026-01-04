'use client';

import React, { useState, useEffect } from 'react';

interface OfficeViewerProps {
  fileUrl?: string;
  fileName?: string;
}

export default function OfficeViewer({ 
  fileUrl = '/Final_Presentation.pptx',
  fileName = 'Final_Presentation.pptx'
}: OfficeViewerProps) {
  const [viewerUrl, setViewerUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    // Construct the full absolute URL for the PPTX file
    const getAbsoluteUrl = () => {
      if (typeof window !== 'undefined') {
        // Check if we're on localhost (Office Online Viewer won't work)
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
          setIsLocalhost(true);
          setError('Office Online Viewer requires the file to be publicly accessible. It will work when deployed to a public URL. For local development, please download the presentation.');
          return '';
        }

        // Client-side: use current origin
        const absoluteFileUrl = `${window.location.origin}${fileUrl}`;
        // Encode the URL for the Office Online Viewer
        const encodedUrl = encodeURIComponent(absoluteFileUrl);
        return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
      }
      return '';
    };

    const url = getAbsoluteUrl();
    setViewerUrl(url);
  }, [fileUrl]);

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        const element = document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          // Safari
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          // Firefox
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          // IE/Edge
          await (element as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    // Listen for all fullscreen change events (different browsers use different events)
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <div className="space-y-2">
            <p className="text-gray-600 text-sm mb-4">
              The Office Online Viewer may not be available. You can download the presentation instead.
            </p>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDownload();
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer"
              type="button"
            >
              Download Presentation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : 'min-h-screen bg-gray-100'}`}>
      {/* Navigation Bar */}
      <div
        className={`${
          isFullscreen ? 'fixed top-0 left-0 right-0 z-10' : 'sticky top-0'
        } bg-white/95 backdrop-blur-sm shadow-md border-b border-gray-200`}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-800">Presentation Viewer</h1>
            <span className="text-sm text-gray-600 hidden md:inline">
              Viewing: {fileName}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDownload();
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors cursor-pointer"
              aria-label="Download presentation"
              type="button"
            >
              ⬇ Download
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              type="button"
            >
              {isFullscreen ? '⤓ Exit Fullscreen' : '⤢ Fullscreen'}
            </button>
          </div>
        </div>
      </div>

      {/* Office Online Viewer */}
      <div className={`${isFullscreen ? 'pt-16 h-full' : 'pt-4'} w-full`}>
        {viewerUrl ? (
          <div className="w-full h-full" style={{ minHeight: isFullscreen ? 'calc(100vh - 4rem)' : '800px' }}>
            <iframe
              src={viewerUrl}
              className="w-full h-full border-0"
              style={{ minHeight: '800px' }}
              title="PowerPoint Presentation"
              allowFullScreen
              onLoad={() => {
                // Iframe loaded successfully
                setError(null);
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading presentation viewer...</p>
            </div>
          </div>
        )}
      </div>

      {/* Help text (only show in embedded mode) */}
      {!isFullscreen && (
        <div className="container mx-auto px-4 mt-4 pb-8 text-center text-sm text-gray-500">
          <p>Use the controls in the viewer to navigate through slides</p>
          <p className="mt-1">Press F11 or click Fullscreen for presentation mode</p>
        </div>
      )}
    </div>
  );
}

