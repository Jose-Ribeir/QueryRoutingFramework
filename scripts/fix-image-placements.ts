import * as fs from 'fs';
import * as path from 'path';

interface ImagePlacement {
  folderName: string;
  textBefore: string;
  caption: string;
  textAfter: string;
  imagePath: string;
}

interface ImageInfo {
  placement: ImagePlacement;
  section?: 'introduction' | 'methodology' | 'results' | 'conclusions';
  imageSrc?: string;
  matchedPosition?: number;
}

// Normalize text for matching (remove extra whitespace, normalize line breaks)
function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim()
    .toLowerCase();
}

// Extract a snippet from text for matching (first 100 chars)
function getTextSnippet(text: string, length: number = 100): string {
  const normalized = normalizeText(text);
  return normalized.substring(0, length);
}

// Parse info.txt file
function parseInfoFile(infoPath: string): ImagePlacement | null {
  try {
    const content = fs.readFileSync(infoPath, 'utf-8');
    const lines = content.split('\n');
    
    let textBefore = '';
    let caption = '';
    let textAfter = '';
    let currentSection = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '--- Text Before ---') {
        currentSection = 'before';
        continue;
      } else if (line === '--- Full Caption ---') {
        currentSection = 'caption';
        continue;
      } else if (line === '--- Text After ---') {
        currentSection = 'after';
        continue;
      }
      
      if (currentSection === 'before' && line) {
        textBefore += (textBefore ? ' ' : '') + line;
      } else if (currentSection === 'caption' && line) {
        caption += (caption ? ' ' : '') + line;
      } else if (currentSection === 'after' && line) {
        textAfter += (textAfter ? ' ' : '') + line;
      }
    }
    
    const folderName = path.basename(path.dirname(infoPath));
    const imagePath = path.join(path.dirname(infoPath), 'image.png');
    
    return {
      folderName,
      textBefore: textBefore.trim(),
      caption: caption.trim(),
      textAfter: textAfter.trim(),
      imagePath
    };
  } catch (error) {
    console.error(`Error parsing ${infoPath}:`, error);
    return null;
  }
}

// Map folder name to image src path
function folderNameToImageSrc(folderName: string): string {
  // Convert folder name to image filename
  // Example: "Figure 1 Transformer model architecture [5]" -> "figure_1_transformer_model_architecture__5_.png"
  let imageName = folderName
    .toLowerCase()
    .replace(/[\[\]]/g, '_')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  // Handle Page_X_Image format
  if (folderName.startsWith('Page_')) {
    const match = folderName.match(/Page_(\d+)_Image(_\d+)?/);
    if (match) {
      const pageNum = match[1];
      const suffix = match[2] || '';
      imageName = `page_${pageNum}_image${suffix.toLowerCase()}`;
    }
  }
  
  return `/images/${imageName}.png`;
}

// Find image in content by src path
function findImageInContent(content: any[], imageSrc: string): number {
  return content.findIndex(item => 
    typeof item === 'object' && 
    item.type === 'image' && 
    item.src === imageSrc
  );
}

// Find text position in content array
function findTextPosition(
  content: (string | { type: string; src: string; alt: string; caption?: string })[],
  searchText: string,
  startIndex: number = 0
): number {
  const normalizedSearch = normalizeText(searchText);
  const searchSnippet = getTextSnippet(searchText, 150);
  
  for (let i = startIndex; i < content.length; i++) {
    const item = content[i];
    if (typeof item === 'string') {
      const normalizedItem = normalizeText(item);
      // Check if search text appears in this string
      if (normalizedItem.includes(searchSnippet) || 
          normalizedItem.includes(normalizedSearch.substring(0, 50))) {
        return i;
      }
    }
  }
  
  return -1;
}

// Main function to parse all info files
function parseAllInfoFiles(): ImagePlacement[] {
  const thesisImagesDir = path.join(process.cwd(), 'thesis_images_context');
  const placements: ImagePlacement[] = [];
  
  if (!fs.existsSync(thesisImagesDir)) {
    console.error(`Directory not found: ${thesisImagesDir}`);
    return placements;
  }
  
  const folders = fs.readdirSync(thesisImagesDir).filter(f => {
    const fullPath = path.join(thesisImagesDir, f);
    return fs.statSync(fullPath).isDirectory();
  });
  
  console.log(`Found ${folders.length} folders in thesis_images_context`);
  
  for (const folder of folders) {
    const infoPath = path.join(thesisImagesDir, folder, 'info.txt');
    if (fs.existsSync(infoPath)) {
      const placement = parseInfoFile(infoPath);
      if (placement) {
        placements.push(placement);
      }
    }
  }
  
  return placements;
}

// Export functions for use
export {
  parseAllInfoFiles,
  parseInfoFile,
  folderNameToImageSrc,
  findTextPosition,
  findImageInContent,
  normalizeText,
  getTextSnippet,
  ImagePlacement,
  ImageInfo
};

// If run directly, parse and output
if (require.main === module) {
  const placements = parseAllInfoFiles();
  console.log(`\nParsed ${placements.length} image placements`);
  console.log('\nSample placements:');
  placements.slice(0, 3).forEach(p => {
    console.log(`\n${p.folderName}:`);
    console.log(`  Before: ${p.textBefore.substring(0, 80)}...`);
    console.log(`  Caption: ${p.caption}`);
    console.log(`  After: ${p.textAfter.substring(0, 80)}...`);
  });
}

