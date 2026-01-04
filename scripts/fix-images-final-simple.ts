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

// Smart distribution: place images after text items, ensuring no consecutive images
function distributeImagesSimply(
  items: ContentItem[],
  placements: Map<string, ImagePlacement>,
  imageMapping: Map<string, string>
): ContentItem[] {
  const textItems: string[] = [];
  const imageMap = new Map<string, { item: ImageItem; placement?: ImagePlacement; preferredAfter?: number }>();
  
  items.forEach((item) => {
    if (typeof item === 'string') {
      textItems.push(item);
    } else if (item.type === 'image') {
      // Find placement for this image
      const placement = Array.from(placements.entries()).find(([_, p]) => {
        const src = imageMapping.get(p.folderName);
        return src === item.src;
      })?.[1];
      
      let preferredAfter = -1;
      if (placement?.textBefore) {
        preferredAfter = findTextInItems(items, placement.textBefore);
      }
      
      imageMap.set(item.src, { item, placement, preferredAfter });
    }
  });
  
  if (imageMap.size === 0) return items;
  
  // Separate images by whether they have preferred positions
  const imagesWithPreferred: Array<{ src: string; item: ImageItem; placement?: ImagePlacement; preferredAfter: number }> = [];
  const imagesWithoutPreferred: Array<{ src: string; item: ImageItem; placement?: ImagePlacement }> = [];
  
  for (const [src, info] of imageMap.entries()) {
    if (info.preferredAfter !== undefined && info.preferredAfter >= 0) {
      imagesWithPreferred.push({ src, ...info, preferredAfter: info.preferredAfter });
    } else {
      imagesWithoutPreferred.push({ src, ...info });
    }
  }
  
  // Sort preferred images by position
  imagesWithPreferred.sort((a, b) => a.preferredAfter - b.preferredAfter);
  
  // Group images that target the same position - we'll need to spread these out
  const imagesByPosition = new Map<number, typeof imagesWithPreferred>();
  for (const img of imagesWithPreferred) {
    if (!imagesByPosition.has(img.preferredAfter)) {
      imagesByPosition.set(img.preferredAfter, []);
    }
    imagesByPosition.get(img.preferredAfter)!.push(img);
  }
  
  // Create a plan: assign each image to a text position (after which text it should appear)
  // Strategy: spread images evenly, never place two images consecutively
  const imageAssignments: Array<{ image: typeof imagesWithPreferred[0] | typeof imagesWithoutPreferred[0]; afterTextIndex: number }> = [];
  
  // First, assign preferred images, but spread out if multiple target same position
  for (const [textIndex, images] of imagesByPosition.entries()) {
    if (images.length === 1) {
      // Single image at this position - place it right after
      imageAssignments.push({ image: images[0], afterTextIndex: textIndex });
    } else {
      // Multiple images target same position - spread them out
      // Place first one at target, then spread others nearby
      const spread = Math.max(1, Math.floor(textItems.length / images.length));
      for (let i = 0; i < images.length; i++) {
        const targetPos = Math.min(textIndex + (i * spread), textItems.length - 1);
        imageAssignments.push({ image: images[i], afterTextIndex: targetPos });
      }
    }
  }
  
  // Sort assignments by position
  imageAssignments.sort((a, b) => a.afterTextIndex - b.afterTextIndex);
  
  // Now assign unpreferred images to fill gaps
  // Calculate spacing: how many text items per image
  const totalImages = imagesWithPreferred.length + imagesWithoutPreferred.length;
  const spacing = textItems.length > 0 ? Math.max(1, Math.floor(textItems.length / totalImages)) : 1;
  
  let unpreferredIndex = 0;
  let lastImagePosition = -2; // Track last position where we placed an image
  
  for (let textIdx = 0; textIdx < textItems.length && unpreferredIndex < imagesWithoutPreferred.length; textIdx++) {
    // Check if there's already a preferred image assigned here
    const hasPreferred = imageAssignments.some(a => a.afterTextIndex === textIdx);
    
    // Check if we can place an image here (not consecutive with last image)
    const canPlace = textIdx > lastImagePosition + 1;
    
    // Place if: no preferred image here, can place (not consecutive), and it's time based on spacing
    if (!hasPreferred && canPlace && (textIdx % spacing === 0 || unpreferredIndex < 2)) {
      imageAssignments.push({ 
        image: imagesWithoutPreferred[unpreferredIndex], 
        afterTextIndex: textIdx 
      });
      lastImagePosition = textIdx;
      unpreferredIndex++;
    }
  }
  
  // Add any remaining unpreferred images, trying to space them out
  while (unpreferredIndex < imagesWithoutPreferred.length) {
    // Find the best position (furthest from any existing image)
    let bestPos = -1;
    let maxDistance = -1;
    
    for (let pos = 0; pos < textItems.length; pos++) {
      // Check distance to nearest image
      let minDist = Infinity;
      for (const assign of imageAssignments) {
        const dist = Math.abs(assign.afterTextIndex - pos);
        minDist = Math.min(minDist, dist);
      }
      
      if (minDist > maxDistance) {
        maxDistance = minDist;
        bestPos = pos;
      }
    }
    
    if (bestPos >= 0) {
      imageAssignments.push({ 
        image: imagesWithoutPreferred[unpreferredIndex], 
        afterTextIndex: bestPos 
      });
    } else {
      // Fallback: place at end
      imageAssignments.push({ 
        image: imagesWithoutPreferred[unpreferredIndex], 
        afterTextIndex: textItems.length - 1 
      });
    }
    unpreferredIndex++;
  }
  
  // Sort all assignments by position
  imageAssignments.sort((a, b) => a.afterTextIndex - b.afterTextIndex);
  
  // Build final content array - ensure NO consecutive images
  // Strategy: process assignments in order, but skip if it would create consecutive images
  const newItems: ContentItem[] = [];
  let assignmentIndex = 0;
  
  for (let i = 0; i < textItems.length; i++) {
    // Always add text item first
    newItems.push(textItems[i]);
    
    // Check if last item was an image
    const lastWasImage = newItems.length > 0 && 
      typeof newItems[newItems.length - 1] === 'object' && 
      newItems[newItems.length - 1].type === 'image';
    
    // Process all images assigned to this text position
    const imagesForThisPos: typeof imageAssignments = [];
    while (assignmentIndex < imageAssignments.length && 
           imageAssignments[assignmentIndex].afterTextIndex === i) {
      imagesForThisPos.push(imageAssignments[assignmentIndex]);
      assignmentIndex++;
    }
    
    // Place first image if we can (not consecutive)
    if (imagesForThisPos.length > 0 && !lastWasImage) {
      const assignment = imagesForThisPos[0];
      const imageItem: ImageItem = {
        type: 'image',
        src: assignment.image.item.src,
        alt: assignment.image.placement?.caption || assignment.image.item.alt,
        caption: assignment.image.placement?.caption || assignment.image.item.caption
      };
      newItems.push(imageItem);
      
      // Reassign remaining images to later positions
      for (let j = 1; j < imagesForThisPos.length; j++) {
        // Find next available position (at least 1 text away)
        let nextPos = i + 1;
        while (nextPos < textItems.length) {
          // Check if any image is already assigned to this position
          const hasConflict = imageAssignments.some(a => 
            a !== imagesForThisPos[j] && a.afterTextIndex === nextPos
          );
          if (!hasConflict) {
            imagesForThisPos[j].afterTextIndex = nextPos;
            // Re-insert in sorted order
            const removed = imageAssignments.splice(
              imageAssignments.indexOf(imagesForThisPos[j]), 1
            )[0];
            let insertIdx = assignmentIndex;
            while (insertIdx < imageAssignments.length && 
                   imageAssignments[insertIdx].afterTextIndex < nextPos) {
              insertIdx++;
            }
            imageAssignments.splice(insertIdx, 0, removed);
            break;
          }
          nextPos++;
        }
      }
    } else if (imagesForThisPos.length > 0) {
      // Can't place here (would be consecutive), reassign all to later positions
      for (const assignment of imagesForThisPos) {
        let nextPos = i + 1;
        while (nextPos < textItems.length) {
          const hasConflict = imageAssignments.some(a => 
            a !== assignment && a.afterTextIndex === nextPos
          );
          if (!hasConflict) {
            assignment.afterTextIndex = nextPos;
            // Re-insert in sorted order
            const removed = imageAssignments.splice(
              imageAssignments.indexOf(assignment), 1
            )[0];
            let insertIdx = assignmentIndex;
            while (insertIdx < imageAssignments.length && 
                   imageAssignments[insertIdx].afterTextIndex < nextPos) {
              insertIdx++;
            }
            imageAssignments.splice(insertIdx, 0, removed);
            break;
          }
          nextPos++;
        }
      }
      // Reset assignmentIndex to reprocess these
      assignmentIndex = 0;
      // Re-sort
      imageAssignments.sort((a, b) => a.afterTextIndex - b.afterTextIndex);
    }
  }
  
  // Add any remaining images at the end, but only if last item wasn't an image
  let lastWasImage = newItems.length > 0 && 
    typeof newItems[newItems.length - 1] === 'object' && 
    newItems[newItems.length - 1].type === 'image';
  
  while (assignmentIndex < imageAssignments.length) {
    if (!lastWasImage) {
      const assignment = imageAssignments[assignmentIndex];
      const imageItem: ImageItem = {
        type: 'image',
        src: assignment.image.item.src,
        alt: assignment.image.placement?.caption || assignment.image.item.alt,
        caption: assignment.image.placement?.caption || assignment.image.item.caption
      };
      newItems.push(imageItem);
      lastWasImage = true;
      assignmentIndex++;
    } else {
      // Can't add - would be consecutive. Try to insert before a text item
      // Look for a text item we can move before this image
      let inserted = false;
      for (let k = newItems.length - 2; k >= 0 && k >= newItems.length - 5; k--) {
        if (typeof newItems[k] === 'string') {
          // Found text - can't move it, but we can skip this image
          break;
        }
      }
      if (!inserted) {
        // Skip this image to avoid consecutive images
        assignmentIndex++;
      }
    }
  }
  
  // Final pass: fix any remaining consecutive images by moving one
  for (let i = 0; i < newItems.length - 1; i++) {
    if (typeof newItems[i] === 'object' && newItems[i].type === 'image' &&
        typeof newItems[i + 1] === 'object' && newItems[i + 1].type === 'image') {
      // Found consecutive images - try to move the second one
      // Look for next text item to insert before
      for (let j = i + 2; j < newItems.length && j < i + 10; j++) {
        if (typeof newItems[j] === 'string') {
          // Move second image to after this text
          const imageToMove = newItems.splice(i + 1, 1)[0];
          newItems.splice(j, 0, imageToMove);
          break;
        }
      }
      // If no text found, try moving first image earlier
      if (i < newItems.length - 1 && 
          typeof newItems[i + 1] === 'object' && newItems[i + 1].type === 'image') {
        for (let j = i - 1; j >= 0 && j >= i - 10; j--) {
          if (typeof newItems[j] === 'string') {
            // Move first image to after this text
            const imageToMove = newItems.splice(i, 1)[0];
            newItems.splice(j + 1, 0, imageToMove);
            break;
          }
        }
      }
    }
  }
  
  return newItems;
}

function main() {
  console.log('Parsing placements...');
  const placements = parseAllInfoFiles();
  const imageMapping = createImageMapping();
  
  const placementMap = new Map<string, ImagePlacement>();
  for (const placement of placements) {
    placementMap.set(placement.folderName, placement);
  }
  
  console.log('Reading thesis content...');
  const filePath = path.join(process.cwd(), 'content', 'thesis-content-new.ts');
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
    console.log(`  Parsed ${items.length} items`);
    
    // Count consecutive images
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    for (const item of items) {
      if (typeof item === 'object' && item.type === 'image') {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }
    console.log(`  Found ${maxConsecutive} consecutive images`);
    
    // Distribute images
    const distributed = distributeImagesSimply(items, placementMap, imageMapping);
    
    // Check consecutive images after
    let newMaxConsecutive = 0;
    currentConsecutive = 0;
    for (const item of distributed) {
      if (typeof item === 'object' && item.type === 'image') {
        currentConsecutive++;
        newMaxConsecutive = Math.max(newMaxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }
    console.log(`  After distribution: ${newMaxConsecutive} consecutive images`);
    
    const serialized = serializeContentArray(distributed, '  ');
    const before = content.substring(0, sectionStart);
    const after = content.substring(sectionEnd);
    content = before + serialized + after;
  }
  
  console.log('\nWriting updated file...');
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Done!');
}

if (require.main === module) {
  main();
}

