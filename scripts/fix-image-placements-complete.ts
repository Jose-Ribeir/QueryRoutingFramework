import * as fs from 'fs';
import * as path from 'path';
import {
  parseAllInfoFiles,
  folderNameToImageSrc,
  findTextPosition,
  findImageInContent,
  normalizeText,
  ImagePlacement
} from './fix-image-placements';

interface ContentItem {
  type?: 'image';
  src?: string;
  alt?: string;
  caption?: string;
}

type ContentArray = (string | ContentItem)[];

// Read the thesis content file
function readThesisContentFile(): string {
  const contentPath = path.join(process.cwd(), 'content', 'thesis-content-new.ts');
  return fs.readFileSync(contentPath, 'utf-8');
}

// Parse content array from string representation
function parseContentArray(contentStr: string): ContentArray {
  // This is a simplified parser - we'll use a more robust approach
  // by finding the array boundaries and parsing JSON-like structure
  try {
    // Remove comments and normalize
    let cleaned = contentStr.trim();
    if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
      // Try to parse as JSON array (with some adjustments)
      // Replace single quotes with double quotes for JSON compatibility
      cleaned = cleaned
        .replace(/'/g, '"')
        .replace(/,\s*]/g, ']')
        .replace(/,\s*}/g, '}');
      
      // Parse individual items
      const items: ContentArray = [];
      let depth = 0;
      let currentItem = '';
      let inString = false;
      let stringChar = '';
      
      for (let i = 1; i < cleaned.length - 1; i++) {
        const char = cleaned[i];
        const prevChar = cleaned[i - 1];
        
        if (!inString && (char === '"' || char === "'")) {
          inString = true;
          stringChar = char;
          currentItem += char;
        } else if (inString && char === stringChar && prevChar !== '\\') {
          inString = false;
          currentItem += char;
        } else if (!inString && char === '{') {
          depth++;
          currentItem += char;
        } else if (!inString && char === '}') {
          depth--;
          currentItem += char;
          if (depth === 0 && currentItem.trim()) {
            try {
              const parsed = JSON.parse(currentItem);
              items.push(parsed);
            } catch (e) {
              // If it's a string item
              const strMatch = currentItem.match(/^"(.+)"$/);
              if (strMatch) {
                items.push(strMatch[1]);
              }
            }
            currentItem = '';
          }
        } else if (!inString && char === ',' && depth === 0) {
          if (currentItem.trim()) {
            const trimmed = currentItem.trim();
            if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
              items.push(trimmed.slice(1, -1));
            } else {
              try {
                const parsed = JSON.parse(trimmed);
                items.push(parsed);
              } catch (e) {
                items.push(trimmed);
              }
            }
            currentItem = '';
          }
        } else {
          currentItem += char;
        }
      }
      
      if (currentItem.trim()) {
        const trimmed = currentItem.trim();
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          items.push(trimmed.slice(1, -1));
        } else {
          try {
            items.push(JSON.parse(trimmed));
          } catch (e) {
            items.push(trimmed);
          }
        }
      }
      
      return items;
    }
  } catch (error) {
    console.error('Error parsing content array:', error);
  }
  
  return [];
}

// Better approach: use regex to extract and replace content arrays
function extractContentArray(fileContent: string, sectionName: string): { array: ContentArray; start: number; end: number } | null {
  // Find the section content array
  const sectionRegex = new RegExp(`${sectionName}:\\s*\\{[^}]*content:\\s*\\[([\\s\\S]*?)\\]`, 'm');
  const match = fileContent.match(sectionRegex);
  
  if (!match) {
    return null;
  }
  
  const arrayContent = match[1];
  const startPos = match.index! + match[0].indexOf('[');
  const endPos = startPos + arrayContent.length + 1;
  
  // Parse the array content
  const items: ContentArray = [];
  let currentPos = 0;
  let depth = 0;
  let inString = false;
  let stringDelim = '';
  let currentItem = '';
  
  while (currentPos < arrayContent.length) {
    const char = arrayContent[currentPos];
    const prevChar = currentPos > 0 ? arrayContent[currentPos - 1] : '';
    
    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringDelim = char;
      currentItem += char;
    } else if (inString && char === stringDelim && prevChar !== '\\') {
      inString = false;
      currentItem += char;
    } else if (!inString && char === '{') {
      depth++;
      currentItem += char;
    } else if (!inString && char === '}') {
      depth--;
      currentItem += char;
      if (depth === 0) {
        // Complete object
        try {
          // Replace single quotes with double quotes for JSON
          const jsonStr = currentItem.replace(/'/g, '"');
          const parsed = JSON.parse(jsonStr);
          items.push(parsed);
        } catch (e) {
          console.warn('Failed to parse item:', currentItem.substring(0, 50));
        }
        currentItem = '';
        // Skip comma if present
        if (arrayContent[currentPos + 1] === ',') {
          currentPos++;
        }
      }
    } else if (!inString && depth === 0 && char === ',') {
      // End of string item
      if (currentItem.trim()) {
        const trimmed = currentItem.trim();
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
          items.push(trimmed.slice(1, -1));
        } else {
          items.push(trimmed);
        }
        currentItem = '';
      }
    } else {
      currentItem += char;
    }
    
    currentPos++;
  }
  
  // Handle last item
  if (currentItem.trim()) {
    const trimmed = currentItem.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      items.push(trimmed.slice(1, -1));
    } else if (trimmed) {
      try {
        const jsonStr = trimmed.replace(/'/g, '"');
        const parsed = JSON.parse(jsonStr);
        items.push(parsed);
      } catch (e) {
        items.push(trimmed);
      }
    }
  }
  
  return { array: items, start: startPos, end: endPos };
}

// Serialize content array back to string
function serializeContentArray(items: ContentArray, indent: string = '  '): string {
  const lines: string[] = [];
  lines.push('[');
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let itemStr = '';
    
    if (typeof item === 'string') {
      // Escape and quote string
      const escaped = item.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
      itemStr = `"${escaped}"`;
    } else if (item && typeof item === 'object') {
      // Serialize object
      const objParts: string[] = [];
      if (item.type) objParts.push(`"type": "${item.type}"`);
      if (item.src) objParts.push(`"src": "${item.src.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
      if (item.alt) objParts.push(`"alt": "${item.alt.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
      if (item.caption) objParts.push(`"caption": "${item.caption.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
      itemStr = `{ ${objParts.join(', ')} }`;
    }
    
    lines.push(`${indent}${itemStr}${i < items.length - 1 ? ',' : ''}`);
  }
  
  lines.push(']');
  return lines.join('\n');
}

// Reorder content with images in correct positions
function reorderContentWithPlacements(
  content: ContentArray,
  placements: ImagePlacement[],
  sectionName: string
): ContentArray {
  // Filter placements for images that exist in this content
  const relevantPlacements: Array<{ placement: ImagePlacement; imageSrc: string; currentIndex: number }> = [];
  
  for (const placement of placements) {
    const imageSrc = folderNameToImageSrc(placement.folderName);
    const currentIndex = findImageInContent(content, imageSrc);
    
    if (currentIndex >= 0) {
      relevantPlacements.push({ placement, imageSrc, currentIndex });
    }
  }
  
  if (relevantPlacements.length === 0) {
    return content; // No images to reorder
  }
  
  // Sort by current position to process in order
  relevantPlacements.sort((a, b) => a.currentIndex - b.currentIndex);
  
  // Build new content array
  const newContent: ContentArray = [];
  const usedIndices = new Set<number>();
  let textIndex = 0;
  
  // Process each image placement
  for (const { placement, imageSrc, currentIndex } of relevantPlacements) {
    // Add all text items up to where this image should be placed
    while (textIndex < content.length) {
      const item = content[textIndex];
      
      // Skip if this is an image we've already processed
      if (typeof item === 'object' && item.type === 'image') {
        if (usedIndices.has(textIndex)) {
          textIndex++;
          continue;
        }
        // Check if this is the image we're looking for
        if (item.src === imageSrc) {
          usedIndices.add(textIndex);
          textIndex++;
          break; // We'll add this image in the right place
        }
      }
      
      // If it's text, check if we should place the image before it
      if (typeof item === 'string' && placement.textBefore) {
        const normalizedItem = normalizeText(item);
        const normalizedBefore = normalizeText(placement.textBefore);
        
        // Check if textBefore appears in this string
        if (normalizedItem.includes(normalizedBefore.substring(0, Math.min(100, normalizedBefore.length)))) {
          // Add this text item
          newContent.push(item);
          textIndex++;
          
          // Add the image right after
          const imageItem: ContentItem = {
            type: 'image',
            src: imageSrc,
            alt: placement.caption || placement.folderName,
            caption: placement.caption || undefined
          };
          newContent.push(imageItem);
          break;
        }
      }
      
      // Add text items that don't match
      if (typeof item === 'string') {
        newContent.push(item);
      } else if (typeof item === 'object' && item.type === 'image' && !usedIndices.has(textIndex)) {
        // Keep other images for now
        newContent.push(item);
      }
      
      textIndex++;
    }
  }
  
  // Add remaining content
  while (textIndex < content.length) {
    if (!usedIndices.has(textIndex)) {
      newContent.push(content[textIndex]);
    }
    textIndex++;
  }
  
  return newContent;
}

// Main function
function main() {
  console.log('Step 1: Parsing image placements...');
  const placements = parseAllInfoFiles();
  console.log(`Found ${placements.length} image placements\n`);
  
  console.log('Step 2: Reading thesis content file...');
  const fileContent = readThesisContentFile();
  
  console.log('Step 3: Extracting and reordering content arrays...');
  
  const sections = ['introduction', 'methodology', 'conclusions'] as const;
  let updatedContent = fileContent;
  
  for (const section of sections) {
    console.log(`\nProcessing ${section}...`);
    const extracted = extractContentArray(fileContent, section);
    
    if (!extracted) {
      console.warn(`Could not extract ${section} content array`);
      continue;
    }
    
    console.log(`  Found ${extracted.array.length} items`);
    
    // Reorder content
    const reordered = reorderContentWithPlacements(extracted.array, placements, section);
    console.log(`  Reordered to ${reordered.length} items`);
    
    // Serialize back
    const serialized = serializeContentArray(reordered, '  ');
    
    // Replace in file content
    const before = updatedContent.substring(0, extracted.start);
    const after = updatedContent.substring(extracted.end);
    updatedContent = before + serialized + after;
  }
  
  console.log('\nStep 4: Writing updated content...');
  const outputPath = path.join(process.cwd(), 'content', 'thesis-content-new.ts');
  fs.writeFileSync(outputPath, updatedContent, 'utf-8');
  
  console.log('Done! Updated thesis-content-new.ts');
}

if (require.main === module) {
  main();
}

