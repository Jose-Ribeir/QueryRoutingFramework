// Utility functions for loading and processing slide data

export interface TextElement {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface SlideData {
  slide_number: number;
  text_elements: TextElement[];
  colors_found: string[];
}

export interface PresentationSummary {
  total_slides: number;
  all_colors_detected: string[];
}

// Convert PowerPoint EMU (English Metric Units) to CSS pixels
// 1 inch = 914400 EMU, and at 96 DPI, 1 inch = 96px
// So: 1 EMU = 96/914400 px ≈ 0.000105 px
// For practical purposes, we'll use: 914400 EMU = 96px
const EMU_PER_INCH = 914400;
const PIXELS_PER_INCH = 96;
const EMU_TO_PX_RATIO = PIXELS_PER_INCH / EMU_PER_INCH;

export function emuToPixels(emu: number): number {
  return emu * EMU_TO_PX_RATIO;
}

// Standard PowerPoint slide dimensions in EMU (16:9 aspect ratio)
// Width: 10 inches = 9144000 EMU
// Height: 5.625 inches = 5143500 EMU
const SLIDE_WIDTH_EMU = 9144000;
const SLIDE_HEIGHT_EMU = 5143500;

export function emuToPercentage(emu: number, isWidth: boolean): number {
  const dimension = isWidth ? SLIDE_WIDTH_EMU : SLIDE_HEIGHT_EMU;
  return (emu / dimension) * 100;
}

// Load presentation summary
export async function loadPresentationSummary(): Promise<PresentationSummary> {
  const response = await fetch('/presentationdata/presentation_summary.json');
  if (!response.ok) {
    throw new Error('Failed to load presentation summary');
  }
  return response.json();
}

// Load individual slide data
export async function loadSlideData(slideNumber: number): Promise<SlideData> {
  const response = await fetch(`/presentationdata/slide_${slideNumber}/data.json`);
  if (!response.ok) {
    throw new Error(`Failed to load slide ${slideNumber} data`);
  }
  return response.json();
}

// Get available images for a slide
export function getSlideImagePaths(slideNumber: number, imageCount: number): string[] {
  const images: string[] = [];
  for (let i = 1; i <= imageCount; i++) {
    // Try common image extensions
    const extensions = ['png', 'jpg', 'jpeg', 'gif'];
    // We'll return the path and let the component handle which extension exists
    images.push(`/presentationdata/slide_${slideNumber}/image_${i}`);
  }
  return images;
}

// Helper to check if an image exists (for a given extension)
export function getImagePath(slideNumber: number, imageIndex: number, extension: string = 'png'): string {
  return `/presentationdata/slide_${slideNumber}/image_${imageIndex}.${extension}`;
}

