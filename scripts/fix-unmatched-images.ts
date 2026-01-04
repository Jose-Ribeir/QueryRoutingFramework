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

// Update info.txt files with correct Text Before snippets
const updates: Array<{ folderName: string; textBefore: string }> = [
  {
    folderName: 'Figure 15 Knowledge Tree[44]',
    textBefore: 'RAGCache retrieves tensors by performing prefix matching along these paths. If a subsequent document in a sequence cannot be found among the child nodes, the traversal is terminated, and the longest identified document sequence is returned. This method ensures efficiency'
  },
  {
    folderName: 'Figure 29 Jsonl Data Structure',
    textBefore: 'already recorded in the JSONL, and the trapezoidal rule is applied in real time during inference to account for variations in the intervals between data points.'
  },
  {
    folderName: 'Figure 16 Cost estimation PGDSF[44]',
    textBefore: 'The Cost is defined as the time taken to compute a document\'s key-value tensors, this can vary depending on GPU performance as well as document size and the sequence of preceding documents.'
  },
  {
    folderName: 'Figure 13 Trade-off curves between (a) model perfo',
    textBefore: 'not required a lower k (e.g., k = 1) may result in lower computational cost. Conversely, tasks that require deeper reasoning may benefit from a higher k. Therefore, the optimal value of k is dependent on both the nature of the task and the level of performance required.'
  },
  {
    folderName: 'Figure 52 Distribution of Energy Consumption per Q',
    textBefore: 'Figure 52 provides valuable insight into all the versions by visually representing the distribution of energy consumption per query for each one.'
  },
  {
    folderName: 'Figure 1 Transformer model architecture [5]',
    textBefore: 'a separate memory cell; instead, it directly updates the hidden state using two gates: an update gate that combines the forget and input gates of the LSTM model and a reset gate that gives the network the ability to control how much information it forgets.'
  }
];

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
  console.log('Step 1: Updating info.txt files...');
  const imagesContextPath = path.join(process.cwd(), 'thesis_images_context');
  
  for (const update of updates) {
    const folderPath = path.join(imagesContextPath, update.folderName);
    const infoPath = path.join(folderPath, 'info.txt');
    
    if (fs.existsSync(infoPath)) {
      let content = fs.readFileSync(infoPath, 'utf-8');
      
      // Update Text Before section
      const textBeforeRegex = /--- Text Before ---\s*\n([\s\S]*?)(?=\n--- Full Caption ---)/;
      if (textBeforeRegex.test(content)) {
        content = content.replace(textBeforeRegex, `--- Text Before ---\n${update.textBefore}\n`);
        fs.writeFileSync(infoPath, content, 'utf-8');
        console.log(`  ✅ Updated ${update.folderName}`);
      } else {
        // Add Text Before section if it doesn't exist
        const captionMatch = content.match(/--- Full Caption ---/);
        if (captionMatch) {
          const beforeCaption = content.substring(0, captionMatch.index);
          const afterCaption = content.substring(captionMatch.index);
          content = beforeCaption + `--- Text Before ---\n${update.textBefore}\n\n` + afterCaption;
          fs.writeFileSync(infoPath, content, 'utf-8');
          console.log(`  ✅ Added Text Before to ${update.folderName}`);
        }
      }
    } else {
      console.log(`  ⚠️  Info file not found: ${infoPath}`);
    }
  }
  
  console.log('\nStep 2: Re-running placement script...');
  // The placement script will be run separately
  console.log('Please run: npx tsx scripts/fix-images-final-simple.ts');
}

if (require.main === module) {
  main();
}

