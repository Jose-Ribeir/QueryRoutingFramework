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
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const sections = ['introduction', 'methodology', 'conclusions'] as const;
  const unmatchedImages: Array<{
    section: string;
    imageSrc: string;
    caption: string;
    textBefore: string;
    reason: string;
  }> = [];
  
  for (const section of sections) {
    console.log(`\n=== Checking ${section} ===`);
    
    const sectionRegex = new RegExp(`(${section}:\\s*\\{[^}]*content:\\s*\\[)([\\s\\S]*?)(\\]\\s*\\})`, 'm');
    const sectionMatch = content.match(sectionRegex);
    
    if (!sectionMatch) {
      console.warn(`  Could not find ${section} section`);
      continue;
    }
    
    const sectionContent = sectionMatch[2];
    const items = parseContentArray(sectionContent);
    
    // Find all images in this section
    const imagesInSection: Array<{ item: ImageItem; index: number }> = [];
    items.forEach((item, index) => {
      if (typeof item === 'object' && item.type === 'image') {
        imagesInSection.push({ item, index });
      }
    });
    
    console.log(`  Found ${imagesInSection.length} images in ${section}`);
    
    // Check each image
    for (const { item, index } of imagesInSection) {
      // Find placement info for this image
      const placement = Array.from(placementMap.entries()).find(([_, p]) => {
        const src = imageMapping.get(p.folderName);
        return src === item.src;
      })?.[1];
      
      if (!placement) {
        unmatchedImages.push({
          section,
          imageSrc: item.src,
          caption: item.caption || item.alt || 'No caption',
          textBefore: 'N/A',
          reason: 'No info.txt file found'
        });
        console.log(`  ❌ ${path.basename(item.src)}: No info.txt file found`);
        continue;
      }
      
      if (!placement.textBefore || placement.textBefore.trim().length === 0) {
        unmatchedImages.push({
          section,
          imageSrc: item.src,
          caption: placement.caption || item.caption || item.alt || 'No caption',
          textBefore: 'N/A',
          reason: 'No "Text Before" in info.txt'
        });
        console.log(`  ⚠️  ${path.basename(item.src)}: No "Text Before" specified`);
        continue;
      }
      
      // Try to find the text in the section
      const textIndex = findTextInItems(items, placement.textBefore);
      if (textIndex === -1) {
        unmatchedImages.push({
          section,
          imageSrc: item.src,
          caption: placement.caption || item.caption || item.alt || 'No caption',
          textBefore: placement.textBefore.substring(0, 100) + '...',
          reason: 'Could not find "Text Before" in section content'
        });
        console.log(`  ❓ ${path.basename(item.src)}: Could not find "Text Before" in content`);
        console.log(`     Looking for: "${placement.textBefore.substring(0, 80)}..."`);
      } else {
        console.log(`  ✅ ${path.basename(item.src)}: Found at position ${textIndex}`);
      }
    }
  }
  
  console.log('\n\n=== SUMMARY: Unmatched or Uncertain Images ===\n');
  if (unmatchedImages.length === 0) {
    console.log('All images have been successfully matched!');
  } else {
    console.log(`Found ${unmatchedImages.length} images with uncertain placement:\n`);
    unmatchedImages.forEach((img, i) => {
      console.log(`${i + 1}. ${path.basename(img.imageSrc)}`);
      console.log(`   Section: ${img.section}`);
      console.log(`   Caption: ${img.caption.substring(0, 80)}${img.caption.length > 80 ? '...' : ''}`);
      console.log(`   Reason: ${img.reason}`);
      if (img.textBefore !== 'N/A') {
        console.log(`   Text Before: ${img.textBefore}`);
      }
      console.log('');
    });
  }
}

if (require.main === module) {
  main();
}

