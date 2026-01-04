import fs from 'fs';
import path from 'path';

// Use require for pdfjs-dist to handle CommonJS/ESM compatibility
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

// Set up worker
const pdfjsWorkerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerPath;

interface ImagePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TextItem {
  x: number;
  y: number;
  text: string;
  width: number;
  height: number;
}

interface ImageInfo {
  imageIndex: number;
  pageNumber: number;
  position: ImagePosition;
  figureNumber?: string;
  caption?: string;
  captionText?: string;
  filename?: string;
}

interface ImagePlacementReport {
  images: ImageInfo[];
  summary: {
    totalImages: number;
    imagesWithCaptions: number;
    imagesWithFigureNumbers: number;
  };
}

// Extract figure number from text
function extractFigureNumber(text: string): string | null {
  const patterns = [
    /Figure\s+(\d+)/i,
    /Fig\.\s+(\d+)/i,
    /Fig\s+(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  return null;
}

// Check if text is a caption (usually contains "Figure" or "Fig.")
function isCaption(text: string): boolean {
  const captionPatterns = [
    /^Figure\s+\d+/i,
    /^Fig\.\s+\d+/i,
    /^Fig\s+\d+/i,
  ];

  return captionPatterns.some(pattern => pattern.test(text.trim()));
}

// Find caption near an image based on proximity
function findCaptionNearImage(
  imagePos: ImagePosition,
  textItems: TextItem[],
  pageHeight: number
): { caption: string; captionText: string } | null {
  // Look for captions above or below the image (within 200 points)
  const proximityThreshold = 200;
  
  // Preferred positions: directly above (top of image) or directly below (bottom of image)
  const imageTop = imagePos.y + imagePos.height;
  const imageBottom = imagePos.y;

  let bestMatch: { text: TextItem; dist: number } | null = null;

  for (const textItem of textItems) {
    const textY = textItem.y; // Y coordinate of text (typically baseline or top)
    
    // Check if text is near the image (above or below)
    const distAbove = Math.abs(textY - imageTop);
    const distBelow = Math.abs(textY - imageBottom);
    const minDist = Math.min(distAbove, distBelow);

    // Also check horizontal overlap
    const horizontalOverlap = 
      (textItem.x < imagePos.x + imagePos.width) && 
      (textItem.x + textItem.width > imagePos.x);

    if (minDist < proximityThreshold && (horizontalOverlap || minDist < 50)) {
      if (isCaption(textItem.text)) {
        if (!bestMatch || minDist < bestMatch.dist) {
          bestMatch = { text: textItem, dist: minDist };
        }
      }
    }
  }

  if (bestMatch) {
    // Try to find additional caption text lines nearby
    let captionText = bestMatch.text.text;
    const captionY = bestMatch.text.y;
    
    // Look for additional lines within 30 points of the caption
    const additionalLines: Array<{ text: string; x: number }> = [];
    for (const textItem of textItems) {
      if (textItem === bestMatch.text) continue;
      
      const dist = Math.abs(textItem.y - captionY);
      if (dist < 30) {
        // Check if it's on the same line (similar Y coordinate)
        additionalLines.push({ text: textItem.text, x: textItem.x });
      }
    }

    // Sort additional lines by X coordinate (left to right)
    additionalLines.sort((a, b) => a.x - b.x);

    if (additionalLines.length > 0) {
      captionText = [bestMatch.text.text, ...additionalLines.map(l => l.text)].join(' ');
    }

    return {
      caption: bestMatch.text.text,
      captionText: captionText
    };
  }

  return null;
}

async function analyzeImagePlacements(pdfPath: string): Promise<ImagePlacementReport> {
  const data = fs.readFileSync(pdfPath);
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;

  const images: ImageInfo[] = [];
  let imageIndex = 0;

  console.log(`Processing PDF with ${pdf.numPages} pages...`);

  const OPS = pdfjsLib.OPS;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    
    console.log(`Processing page ${pageNum}...`);

    // Extract text items with positions
    const textContent = await page.getTextContent();
    const textItems: TextItem[] = textContent.items.map((item: any) => {
      const transform = item.transform;
      return {
        x: transform[4],
        y: viewport.height - transform[5], // Convert to bottom-left origin
        text: item.str,
        width: item.width || 0,
        height: item.height || 0,
      };
    });

    // Extract images by analyzing the operator list
    const opList = await page.getOperatorList();
    const imageMap = new Map<string, any>();
    
    // First pass: collect all image resources
    for (let i = 0; i < opList.fnArray.length; i++) {
      const op = opList.fnArray[i];
      const args = opList.argsArray[i];

      if (op === OPS.paintImageXObject || op === OPS.paintXObject) {
        const imageName = args[0];
        try {
          const imageObj = await page.objs.get(imageName);
          if (imageObj && !imageMap.has(imageName)) {
            imageMap.set(imageName, imageObj);
          }
        } catch (error) {
          // Skip if we can't get the image object
        }
      }
    }

    // Second pass: find image positions by tracking transforms
    const transformStack: number[][] = [];
    transformStack.push([1, 0, 0, 1, 0, 0]); // Identity matrix
    
    const imagesOnPage: Array<{ name: string; x: number; y: number; width: number; height: number }> = [];

    for (let i = 0; i < opList.fnArray.length; i++) {
      const op = opList.fnArray[i];
      const args = opList.argsArray[i];

      // Handle transform operations
      if (op === OPS.transform) {
        const [a, b, c, d, e, f] = args;
        const current = transformStack[transformStack.length - 1];
        // Multiply current transform with new transform
        const newTransform = [
          current[0] * a + current[2] * b,
          current[1] * a + current[3] * b,
          current[0] * c + current[2] * d,
          current[1] * c + current[3] * d,
          current[0] * e + current[2] * f + current[4],
          current[1] * e + current[3] * f + current[5],
        ];
        transformStack.push(newTransform);
      } else if (op === OPS.save) {
        const current = transformStack[transformStack.length - 1];
        transformStack.push([...current]);
      } else if (op === OPS.restore) {
        if (transformStack.length > 1) {
          transformStack.pop();
        }
      } else if (op === OPS.paintImageXObject || op === OPS.paintXObject) {
        const imageName = args[0];
        const imageObj = imageMap.get(imageName);
        
        if (imageObj && transformStack.length > 0) {
          const currentTransform = transformStack[transformStack.length - 1];
          
          // Extract dimensions from transform matrix
          const a = currentTransform[0]; // scale X
          const d = currentTransform[3]; // scale Y
          const e = currentTransform[4]; // translate X
          const f = currentTransform[5]; // translate Y

          // Get image dimensions
          const imgWidth = imageObj.width || (imageObj.data?.width) || 100;
          const imgHeight = imageObj.height || (imageObj.data?.height) || 100;

          // Calculate actual dimensions on page
          const width = Math.abs(a * imgWidth);
          const height = Math.abs(d * imgHeight);
          
          // Position (PDF uses bottom-left origin, convert to top-left)
          const x = e;
          const y = viewport.height - (f + height);

          imagesOnPage.push({
            name: imageName,
            x,
            y,
            width,
            height,
          });
        }
      }
    }

    // Process each image found on this page
    for (const img of imagesOnPage) {
      imageIndex++;

      // Find caption near this image
      const captionInfo = findCaptionNearImage(
        { x: img.x, y: img.y, width: img.width, height: img.height },
        textItems,
        viewport.height
      );

      let figureNumber: string | undefined;
      let caption: string | undefined;
      let captionText: string | undefined;

      if (captionInfo) {
        caption = captionInfo.caption;
        captionText = captionInfo.captionText;
        const figNum = extractFigureNumber(captionInfo.captionText);
        if (figNum) {
          figureNumber = figNum;
        }
      }

      // Generate suggested filename
      let filename: string | undefined;
      if (figureNumber) {
        // Use figure number in filename
        const sanitized = captionText?.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toLowerCase().substring(0, 100) || `figure_${figureNumber}`;
        filename = `figure_${figureNumber}_${sanitized}.png`;
      } else {
        filename = `page_${pageNum}_img_${imageIndex}.png`;
      }

      images.push({
        imageIndex,
        pageNumber: pageNum,
        position: {
          x: Math.round(img.x * 100) / 100,
          y: Math.round(img.y * 100) / 100,
          width: Math.round(img.width * 100) / 100,
          height: Math.round(img.height * 100) / 100,
        },
        figureNumber,
        caption,
        captionText,
        filename,
      });
    }
  }

  // Calculate summary
  const imagesWithCaptions = images.filter(img => img.caption).length;
  const imagesWithFigureNumbers = images.filter(img => img.figureNumber).length;

  return {
    images,
    summary: {
      totalImages: images.length,
      imagesWithCaptions,
      imagesWithFigureNumbers,
    },
  };
}

async function main() {
  const pdfPath = path.join(process.cwd(), 'public', 'Tese_fixed_references.pdf');

  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF file not found at: ${pdfPath}`);
    process.exit(1);
  }

  console.log('Analyzing image placements in PDF...\n');
  
  try {
    const report = await analyzeImagePlacements(pdfPath);

    // Save report to JSON file
    const outputPath = path.join(process.cwd(), 'scripts', 'image-placement-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    console.log('\n=== Summary ===');
    console.log(`Total images found: ${report.summary.totalImages}`);
    console.log(`Images with captions: ${report.summary.imagesWithCaptions}`);
    console.log(`Images with figure numbers: ${report.summary.imagesWithFigureNumbers}`);
    console.log(`\nReport saved to: ${outputPath}\n`);

    // Print detailed information for each image
    console.log('=== Image Details ===');
    report.images.forEach((img) => {
      console.log(`\nImage ${img.imageIndex} (Page ${img.pageNumber}):`);
      console.log(`  Position: x=${img.position.x}, y=${img.position.y}, w=${img.position.width}, h=${img.position.height}`);
      if (img.figureNumber) {
        console.log(`  Figure Number: ${img.figureNumber}`);
      }
      if (img.caption) {
        console.log(`  Caption: ${img.caption}`);
      }
      if (img.filename) {
        console.log(`  Suggested filename: ${img.filename}`);
      }
    });

  } catch (error) {
    console.error('Error analyzing PDF:', error);
    process.exit(1);
  }
}

main().catch(console.error);
