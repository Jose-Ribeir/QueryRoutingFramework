import * as fs from 'fs';
import * as path from 'path';
import {
  parseAllInfoFiles,
  normalizeText,
  ImagePlacement
} from './fix-image-placements';
import { createImageMapping } from './fix-image-mapping';

interface ImageItem {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
}

type ContentItem = string | ImageItem;

function extractFigureNumber(src: string, alt: string, caption?: string): number {
  const text = `${src} ${alt} ${caption || ''}`;
  const patterns = [
    /figure[_\s]*(\d+)/i,
    /Figure[_\s]*(\d+)/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  
  // For page images, extract page number and add 1000 to put them at the end
  const pageMatch = text.match(/page[_\s]*(\d+)[_\s]*image/i);
  if (pageMatch) {
    return 1000 + parseInt(pageMatch[1], 10);
  }
  
  // No number found - put at end
  return 9999;
}

function findTextInItems(items: ContentItem[], searchText: string): number {
  if (!searchText || searchText.trim().length === 0) return -1;
  const normalizedSearch = normalizeText(searchText);
  const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 3).slice(0, 5);
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (typeof item === 'string') {
      const normalizedItem = normalizeText(item);
      const matchingWords = searchWords.filter(sw => 
        normalizedItem.includes(sw)
      );
      if (matchingWords.length >= Math.min(2, searchWords.length)) {
        return i;
      }
    }
  }
  return -1;
}

function parseContentArray(contentStr: string): ContentItem[] {
  const items: ContentItem[] = [];
  let i = 0;
  let depth = 0;
  let inString = false;
  let stringDelim = '';
  let currentItem = '';
  let escapeNext = false;
  
  while (i < contentStr.length) {
    const char = contentStr[i];
    
    if (escapeNext) {
      currentItem += char;
      escapeNext = false;
      i++;
      continue;
    }
    
    if (char === '\\' && inString) {
      escapeNext = true;
      currentItem += char;
      i++;
      continue;
    }
    
    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringDelim = char;
      currentItem += char;
    } else if (inString && char === stringDelim) {
      inString = false;
      currentItem += char;
    } else if (!inString && char === '{') {
      depth++;
      currentItem += char;
    } else if (!inString && char === '}') {
      depth--;
      currentItem += char;
      if (depth === 0) {
        try {
          const jsonStr = currentItem.replace(/'/g, '"');
          const parsed = JSON.parse(jsonStr);
          items.push(parsed);
        } catch (e) {
          const srcMatch = currentItem.match(/"src":\s*"([^"]+)"/);
          const altMatch = currentItem.match(/"alt":\s*"([^"]*)"/);
          const captionMatch = currentItem.match(/"caption":\s*"([^"]*)"/);
          if (srcMatch) {
            items.push({
              type: 'image',
              src: srcMatch[1],
              alt: altMatch ? altMatch[1] : '',
              caption: captionMatch ? captionMatch[1] : undefined
            });
          }
        }
        currentItem = '';
        while (i + 1 < contentStr.length && /[,\s]/.test(contentStr[i + 1]) && contentStr[i + 1] !== ']') {
          i++;
        }
      }
    } else if (!inString && depth === 0 && char === ',') {
      if (currentItem.trim()) {
        const trimmed = currentItem.trim();
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
          const unescaped = trimmed.slice(1, -1)
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'")
            .replace(/\\n/g, '\n')
            .replace(/\\\\/g, '\\');
          items.push(unescaped);
        } else {
          items.push(trimmed);
        }
        currentItem = '';
      }
    } else {
      currentItem += char;
    }
    
    i++;
  }
  
  if (currentItem.trim()) {
    const trimmed = currentItem.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      const unescaped = trimmed.slice(1, -1)
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\n/g, '\n')
        .replace(/\\\\/g, '\\');
      items.push(unescaped);
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
  
  return items;
}

function serializeContentArray(items: ContentItem[], indent: string = '  '): string {
  const lines: string[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let itemStr = '';
    
    if (typeof item === 'string') {
      const escaped = item
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
      itemStr = `"${escaped}"`;
    } else if (item && typeof item === 'object' && item.type === 'image') {
      const parts: string[] = [`"type": "image"`];
      parts.push(`"src": "${item.src.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
      parts.push(`"alt": "${(item.alt || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
      if (item.caption) {
        parts.push(`"caption": "${item.caption.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
      }
      itemStr = `{ ${parts.join(', ')} }`;
    }
    
    lines.push(`${indent}${itemStr}${i < items.length - 1 ? ',' : ''}`);
  }
  
  return lines.join('\n');
}

function main() {
  console.log('Step 1: Parsing placements and mapping...');
  const placements = parseAllInfoFiles();
  const imageMapping = createImageMapping();
  
  const placementMap = new Map<string, ImagePlacement>();
  for (const placement of placements) {
    placementMap.set(placement.folderName, placement);
  }
  
  console.log('Step 2: Reading thesis content...');
  const filePath = path.join(process.cwd(), 'content', 'thesis-content.ts');
  let content = fs.readFileSync(filePath, 'utf-8');
  
  const sections = ['introduction', 'methodology', 'conclusions'] as const;
  
  for (const section of sections) {
    console.log(`\nProcessing ${section}...`);
    
    const sectionRegex = new RegExp(`(${section}:\\s*\\{[^}]*content:\\s*\\[)([\\s\\S]*?)(\\]\\s*\\})`, 'm');
    const sectionMatch = content.match(sectionRegex);
    
    if (!sectionMatch) {
      console.warn(`  Could not find ${section} section`);
      continue;
    }
    
    const sectionContent = sectionMatch[2];
    const sectionStart = sectionMatch.index! + sectionMatch[1].length;
    const sectionEnd = sectionMatch.index! + sectionMatch[1].length + sectionMatch[2].length;
    const items = parseContentArray(sectionContent);
    
    // Separate text and images
    const textItems: string[] = [];
    const imageItems: Array<{ item: ImageItem; originalIndex: number; figureNumber: number; placement?: ImagePlacement; preferredAfter?: number }> = [];
    
    items.forEach((item, index) => {
      if (typeof item === 'string') {
        textItems.push(item);
      } else if (item && typeof item === 'object' && item.type === 'image') {
        const figureNum = extractFigureNumber(item.src, item.alt, item.caption);
        const placement = Array.from(placementMap.entries()).find(([_, p]) => {
          const src = imageMapping.get(p.folderName);
          return src === item.src;
        })?.[1];
        
        let preferredAfter = -1;
        if (placement?.textBefore) {
          preferredAfter = findTextInItems(items, placement.textBefore);
        }
        
        imageItems.push({
          item,
          originalIndex: index,
          figureNumber: figureNum,
          placement,
          preferredAfter
        });
      }
    });
    
    console.log(`  Found ${textItems.length} text items and ${imageItems.length} images`);
    
    // Sort images by figure number (ascending)
    imageItems.sort((a, b) => a.figureNumber - b.figureNumber);
    
    console.log(`  Image order (by figure number):`);
    imageItems.forEach(img => {
      const figNum = img.figureNumber < 1000 ? `Figure ${img.figureNumber}` : `Page ${img.figureNumber - 1000}`;
      console.log(`    ${figNum}: ${path.basename(img.item.src)}`);
    });
    
    // Build new content array
    // Strategy: Place images in figure number order, but try to respect preferred positions
    // If multiple images have preferred positions, place them in order
    // Distribute remaining images evenly
    
    const newItems: ContentItem[] = [];
    let textIndex = 0;
    let imageIndex = 0;
    let lastImagePosition = -2;
    
    // First, place images with preferred positions (in figure number order)
    const imagesWithPreferred = imageItems.filter(img => img.preferredAfter !== undefined && img.preferredAfter >= 0);
    const imagesWithoutPreferred = imageItems.filter(img => !img.preferredAfter || img.preferredAfter < 0);
    
    // Sort preferred images by their preferred position, but maintain figure number order within same position
    imagesWithPreferred.sort((a, b) => {
      if (a.preferredAfter! !== b.preferredAfter!) {
        return a.preferredAfter! - b.preferredAfter!;
      }
      return a.figureNumber - b.figureNumber;
    });
    
    // Process text items and place preferred images
    for (let i = 0; i < textItems.length; i++) {
      newItems.push(textItems[i]);
      textIndex++;
      
      // Check if last item was an image
      const lastWasImage = newItems.length > 0 && 
        typeof newItems[newItems.length - 1] === 'object' && 
        newItems[newItems.length - 1].type === 'image';
      
      // Place preferred images that should go after this text
      while (imageIndex < imagesWithPreferred.length && 
             imagesWithPreferred[imageIndex].preferredAfter === i) {
        if (!lastWasImage) {
          const imageInfo = imagesWithPreferred[imageIndex];
          const imageItem: ImageItem = {
            type: 'image',
            src: imageInfo.item.src,
            alt: imageInfo.placement?.caption || imageInfo.item.alt,
            caption: imageInfo.placement?.caption || imageInfo.item.caption
          };
          newItems.push(imageItem);
          lastImagePosition = textIndex - 1;
          imageIndex++;
        } else {
          // Can't place consecutively - move to next position
          imagesWithPreferred[imageIndex].preferredAfter = i + 1;
          // Re-sort
          imagesWithPreferred.sort((a, b) => {
            if (a.preferredAfter! !== b.preferredAfter!) {
              return a.preferredAfter! - b.preferredAfter!;
            }
            return a.figureNumber - b.figureNumber;
          });
          break;
        }
      }
    }
    
    // Add any remaining preferred images
    while (imageIndex < imagesWithPreferred.length) {
      const imageInfo = imagesWithPreferred[imageIndex];
      const imageItem: ImageItem = {
        type: 'image',
        src: imageInfo.item.src,
        alt: imageInfo.placement?.caption || imageInfo.item.alt,
        caption: imageInfo.placement?.caption || imageInfo.item.caption
      };
      newItems.push(imageItem);
      imageIndex++;
    }
    
    // Now place images without preferred positions, distributing them evenly
    // But maintain figure number order
    if (imagesWithoutPreferred.length > 0) {
      const spacing = Math.max(1, Math.floor(textItems.length / (imagesWithoutPreferred.length + 1)));
      let unpreferredIndex = 0;
      
      // Find insertion points
      const insertionPoints: number[] = [];
      for (let i = 0; i < textItems.length && unpreferredIndex < imagesWithoutPreferred.length; i += spacing) {
        insertionPoints.push(i);
        unpreferredIndex++;
      }
      
      // Insert images at these points, maintaining figure number order
      unpreferredIndex = 0;
      for (const insertPoint of insertionPoints) {
        if (unpreferredIndex < imagesWithoutPreferred.length) {
          // Find where this text item is in newItems
          let textCount = 0;
          let insertIndex = -1;
          for (let i = 0; i < newItems.length; i++) {
            if (typeof newItems[i] === 'string') {
              if (textCount === insertPoint) {
                insertIndex = i + 1;
                break;
              }
              textCount++;
            }
          }
          
          if (insertIndex >= 0) {
            // Check if last item before insert is an image
            const lastIsImage = insertIndex > 0 && 
              typeof newItems[insertIndex - 1] === 'object' && 
              newItems[insertIndex - 1].type === 'image';
            
            if (!lastIsImage) {
              const imageInfo = imagesWithoutPreferred[unpreferredIndex];
              const imageItem: ImageItem = {
                type: 'image',
                src: imageInfo.item.src,
                alt: imageInfo.placement?.caption || imageInfo.item.alt,
                caption: imageInfo.placement?.caption || imageInfo.item.caption
              };
              newItems.splice(insertIndex, 0, imageItem);
              unpreferredIndex++;
            }
          }
        }
      }
      
      // Add any remaining images at the end
      while (unpreferredIndex < imagesWithoutPreferred.length) {
        const imageInfo = imagesWithoutPreferred[unpreferredIndex];
        const imageItem: ImageItem = {
          type: 'image',
          src: imageInfo.item.src,
          alt: imageInfo.placement?.caption || imageInfo.item.alt,
          caption: imageInfo.placement?.caption || imageInfo.item.caption
        };
        newItems.push(imageItem);
        unpreferredIndex++;
      }
    }
    
    const serialized = serializeContentArray(newItems, '  ');
    const before = content.substring(0, sectionStart);
    const after = content.substring(sectionEnd);
    content = before + serialized + after;
    
    console.log(`  ✅ Reordered ${imageItems.length} images by figure number`);
  }
  
  console.log('\nStep 3: Writing updated file...');
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Done! Images reordered by figure number (low to high).');
}

if (require.main === module) {
  main();
}

