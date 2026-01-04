import * as fs from 'fs';
import * as path from 'path';

interface ImageItem {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
  figureNumber?: number;
  position: number;
}

type ContentItem = string | ImageItem;

function extractFigureNumber(src: string, alt: string, caption?: string): number | null {
  // Try to extract figure number from various sources
  const text = `${src} ${alt} ${caption || ''}`;
  
  // First check for page images (they should come after all numbered figures)
  const pageMatch = text.match(/page[_\s]*(\d+)[_\s]*image/i);
  if (pageMatch) {
    return 1000 + parseInt(pageMatch[1], 10);
  }
  
  // Then check for figure numbers
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
  
  return null;
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
  console.log('Checking image order in all sections...\n');
  
  const filePath = path.join(process.cwd(), 'content', 'thesis-content.ts');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const sections = ['introduction', 'methodology', 'conclusions'] as const;
  
  for (const section of sections) {
    console.log(`=== ${section.toUpperCase()} ===`);
    
    const sectionRegex = new RegExp(`(${section}:\\s*\\{[^}]*content:\\s*\\[)([\\s\\S]*?)(\\]\\s*\\})`, 'm');
    const sectionMatch = content.match(sectionRegex);
    
    if (!sectionMatch) {
      console.log(`  Section not found\n`);
      continue;
    }
    
    const sectionContent = sectionMatch[2];
    const items = parseContentArray(sectionContent);
    
    // Extract images with their positions and figure numbers
    const images: Array<ImageItem & { position: number; textIndex: number }> = [];
    let textIndex = 0;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (typeof item === 'string') {
        textIndex++;
      } else if (item && typeof item === 'object' && item.type === 'image') {
        const figureNum = extractFigureNumber(item.src, item.alt, item.caption);
        images.push({
          ...item,
          figureNumber: figureNum || undefined,
          position: i,
          textIndex: textIndex
        });
      }
    }
    
    if (images.length === 0) {
      console.log(`  No images found\n`);
      continue;
    }
    
    console.log(`  Found ${images.length} images:\n`);
    
    // Check order
    let isOrdered = true;
    let lastFigureNum: number | null = null;
    const outOfOrder: typeof images = [];
    
    for (const img of images) {
      const displayName = path.basename(img.src);
      const figNum = img.figureNumber !== null && img.figureNumber !== undefined 
        ? `Figure ${img.figureNumber}` 
        : 'No figure number';
      
      console.log(`  Position ${img.position} (after text ${img.textIndex}): ${displayName}`);
      console.log(`    ${figNum}`);
      
      if (img.figureNumber !== null && img.figureNumber !== undefined) {
        if (lastFigureNum !== null && img.figureNumber < lastFigureNum) {
          isOrdered = false;
          outOfOrder.push(img);
          console.log(`    ⚠️  OUT OF ORDER! Previous was Figure ${lastFigureNum}`);
        }
        lastFigureNum = img.figureNumber;
      } else {
        // Page images or images without figure numbers - they should come before numbered figures
        if (lastFigureNum !== null) {
          console.log(`    ⚠️  Page image after numbered figure - may be out of order`);
        }
      }
      console.log('');
    }
    
    if (isOrdered && outOfOrder.length === 0) {
      console.log(`  ✅ All images are in correct order (low to high)\n`);
    } else {
      console.log(`  ❌ Found ${outOfOrder.length} images out of order\n`);
    }
  }
}

if (require.main === module) {
  main();
}

