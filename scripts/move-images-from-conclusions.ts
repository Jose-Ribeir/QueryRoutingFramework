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

function main() {
  console.log('Step 1: Parsing placements and mapping...');
  const placements = parseAllInfoFiles();
  const imageMapping = createImageMapping();
  
  const placementMap = new Map<string, ImagePlacement>();
  for (const placement of placements) {
    placementMap.set(placement.folderName, placement);
  }
  
  console.log('Step 2: Reading thesis content...');
  const filePath = path.join(process.cwd(), 'content', 'thesis-content-new.ts');
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract all sections
  const sections = ['introduction', 'methodology', 'conclusions'] as const;
  const sectionData = new Map<string, { items: ContentItem[]; start: number; end: number; content: string }>();
  
  for (const section of sections) {
    const sectionRegex = new RegExp(`(${section}:\\s*\\{[^}]*content:\\s*\\[)([\\s\\S]*?)(\\]\\s*\\})`, 'm');
    const sectionMatch = content.match(sectionRegex);
    if (sectionMatch) {
      const sectionContent = sectionMatch[2];
      const sectionStart = sectionMatch.index! + sectionMatch[1].length;
      const sectionEnd = sectionMatch.index! + sectionMatch[1].length + sectionMatch[2].length;
      const items = parseContentArray(sectionContent);
      sectionData.set(section, { items, start: sectionStart, end: sectionEnd, content: sectionContent });
    }
  }
  
  // Step 3: Remove all images from conclusions and find where they should go
  console.log('\nStep 3: Processing conclusions section...');
  const conclusionsData = sectionData.get('conclusions');
  if (!conclusionsData) {
    console.error('Could not find conclusions section');
    return;
  }
  
  const conclusionsItems = conclusionsData.items;
  const imagesToMove: Array<{ image: ImageItem; placement?: ImagePlacement; targetSection?: string; targetIndex?: number }> = [];
  const conclusionsTextOnly: ContentItem[] = [];
  
  // Separate images from text in conclusions
  for (const item of conclusionsItems) {
    if (typeof item === 'string') {
      conclusionsTextOnly.push(item);
    } else if (item.type === 'image') {
      // Find placement info for this image
      const placement = Array.from(placementMap.entries()).find(([_, p]) => {
        const src = imageMapping.get(p.folderName);
        return src === item.src;
      })?.[1];
      
      imagesToMove.push({ image: item, placement });
    }
  }
  
  console.log(`  Found ${imagesToMove.length} images in conclusions (should be removed)`);
  console.log(`  Keeping ${conclusionsTextOnly.length} text items in conclusions`);
  
  // Step 4: Find correct sections for each image
  console.log('\nStep 4: Finding correct sections for images...');
  for (const imageInfo of imagesToMove) {
    if (!imageInfo.placement?.textBefore) continue;
    
    // Search in all sections for the textBefore
    for (const [sectionName, secData] of sectionData.entries()) {
      if (sectionName === 'conclusions') continue; // Skip conclusions
      
      const targetIndex = findTextInItems(secData.items, imageInfo.placement.textBefore);
      if (targetIndex >= 0) {
        imageInfo.targetSection = sectionName;
        imageInfo.targetIndex = targetIndex;
        console.log(`    ${imageInfo.image.src.substring(imageInfo.image.src.lastIndexOf('/') + 1)} -> ${sectionName} (position ${targetIndex})`);
        break;
      }
    }
    
    if (!imageInfo.targetSection) {
      console.log(`    ${imageInfo.image.src.substring(imageInfo.image.src.lastIndexOf('/') + 1)} -> could not find section`);
    }
  }
  
  // Step 5: Update conclusions (remove all images)
  console.log('\nStep 5: Removing images from conclusions...');
  const conclusionsSerialized = serializeContentArray(conclusionsTextOnly, '  ');
  const conclusionsStart = conclusionsData.start;
  const conclusionsEnd = conclusionsData.end;
  const beforeConclusions = content.substring(0, conclusionsStart);
  const afterConclusions = content.substring(conclusionsEnd);
  content = beforeConclusions + conclusionsSerialized + afterConclusions;
  
  // Step 6: Add images to correct sections
  console.log('\nStep 6: Adding images to correct sections...');
  
  // Group images by target section
  const imagesBySection = new Map<string, Array<typeof imagesToMove[0]>>();
  for (const imageInfo of imagesToMove) {
    if (imageInfo.targetSection) {
      if (!imagesBySection.has(imageInfo.targetSection)) {
        imagesBySection.set(imageInfo.targetSection, []);
      }
      imagesBySection.get(imageInfo.targetSection)!.push(imageInfo);
    }
  }
  
  // Update each section
  for (const [sectionName, images] of imagesBySection.entries()) {
    console.log(`  Processing ${sectionName}...`);
    const secData = sectionData.get(sectionName);
    if (!secData) {
      console.warn(`    Section ${sectionName} not found`);
      continue;
    }
    
    // Re-parse section (content may have changed)
    const sectionRegex = new RegExp(`(${sectionName}:\\s*\\{[^}]*content:\\s*\\[)([\\s\\S]*?)(\\]\\s*\\})`, 'm');
    const sectionMatch = content.match(sectionRegex);
    if (!sectionMatch) continue;
    
    const sectionContent = sectionMatch[2];
    const sectionStart = sectionMatch.index! + sectionMatch[1].length;
    const sectionEnd = sectionMatch.index! + sectionMatch[1].length + sectionMatch[2].length;
    const items = parseContentArray(sectionContent);
    
    // Sort images by target index
    images.sort((a, b) => (a.targetIndex || 0) - (b.targetIndex || 0));
    
    // Build new items array with images inserted
    const newItems: ContentItem[] = [];
    let textIndex = 0;
    let imageIndex = 0;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (typeof item === 'string') {
        newItems.push(item);
        textIndex++;
        
        // Check if any image should be placed after this text
        while (imageIndex < images.length && images[imageIndex].targetIndex === textIndex - 1) {
          const imageInfo = images[imageIndex];
          const imageItem: ImageItem = {
            type: 'image',
            src: imageInfo.image.src,
            alt: imageInfo.placement?.caption || imageInfo.image.alt,
            caption: imageInfo.placement?.caption || imageInfo.image.caption
          };
          newItems.push(imageItem);
          imageIndex++;
        }
      } else if (item.type === 'image') {
        // Keep existing images (don't duplicate)
        newItems.push(item);
      }
    }
    
    // Add any remaining images at the end
    while (imageIndex < images.length) {
      const imageInfo = images[imageIndex];
      const imageItem: ImageItem = {
        type: 'image',
        src: imageInfo.image.src,
        alt: imageInfo.placement?.caption || imageInfo.image.alt,
        caption: imageInfo.placement?.caption || imageInfo.image.caption
      };
      newItems.push(imageItem);
      imageIndex++;
    }
    
    const serialized = serializeContentArray(newItems, '  ');
    const before = content.substring(0, sectionStart);
    const after = content.substring(sectionEnd);
    content = before + serialized + after;
    
    console.log(`    Added ${images.length} images to ${sectionName}`);
  }
  
  console.log('\nStep 7: Writing updated file...');
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Done! Removed all images from conclusions and moved them to correct sections.');
}

if (require.main === module) {
  main();
}

