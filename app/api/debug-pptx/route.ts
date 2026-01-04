import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    // Try root directory first, then public folder
    let pptxPath = join(process.cwd(), 'Final_Presentation.pptx');
    let fileBuffer;
    
    try {
      fileBuffer = await readFile(pptxPath);
    } catch {
      pptxPath = join(process.cwd(), 'public', 'Final_Presentation.pptx');
      fileBuffer = await readFile(pptxPath);
    }
    
    const zip = await JSZip.loadAsync(fileBuffer.buffer);
    
    // Get first slide XML
    const slide1XML = await zip.file('ppt/slides/slide1.xml')?.async('string');
    
    if (!slide1XML) {
      return NextResponse.json({ error: 'Could not find slide1.xml' });
    }
    
    // Also get presentation.xml to see structure
    const presentationXML = await zip.file('ppt/presentation.xml')?.async('string');
    
    return NextResponse.json({
      slide1XML: slide1XML.substring(0, 5000), // First 5000 chars
      presentationXML: presentationXML?.substring(0, 2000), // First 2000 chars
      slide1Length: slide1XML.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

