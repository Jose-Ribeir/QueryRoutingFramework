import { NextRequest, NextResponse } from 'next/server';
import { parsePPTX } from '../../utils/pptxParser';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    // Try root directory first, then public folder
    let pptxPath = join(process.cwd(), 'Final_Presentation.pptx');
    let fileBuffer;
    
    try {
      fileBuffer = await readFile(pptxPath);
      console.log('Using PPTX from root directory');
    } catch {
      // Fallback to public folder
      pptxPath = join(process.cwd(), 'public', 'Final_Presentation.pptx');
      fileBuffer = await readFile(pptxPath);
      console.log('Using PPTX from public folder');
    }
    
    // Parse the PPTX file
    const slides = await parsePPTX(fileBuffer.buffer);
    
    console.log(`Parsed ${slides.length} slides`);
    if (slides.length > 0) {
      console.log(`Slide 1 has ${slides[0].textElements.length} text elements and ${slides[0].images.length} images`);
    }
    
    return NextResponse.json({ slides });
  } catch (error) {
    console.error('Error parsing PPTX:', error);
    return NextResponse.json(
      { error: 'Failed to parse PPTX file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

