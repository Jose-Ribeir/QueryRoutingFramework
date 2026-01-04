import * as fs from 'fs';
import * as path from 'path';

interface ImageMetadata {
  folderName: string;
  contextBefore: string[];
  caption: string;
  contextAfter: string[];
  imagePath: string;
  imageFilename: string;
}

interface MatchedImage {
  metadata: ImageMetadata;
  section: 'introduction' | 'methodology' | 'conclusions';
  position: number;
  confidence: 'high' | 'medium' | 'low';
  matchedText: string;
}

interface ContentItem {
  type: 'text' | 'image';
  content?: string;
  src?: string;
  alt?: string;
  caption?: string;
}

function loadMatchedImages(): MatchedImage[] {
  const matchedPath = path.join(process.cwd(), 'scripts', 'matched-images.json');
  return JSON.parse(fs.readFileSync(matchedPath, 'utf-8'));
}

function loadFilenameMapping(): { [folderName: string]: string } {
  const mappingPath = path.join(process.cwd(), 'scripts', 'image-filename-mapping.json');
  return JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
}

function loadImageMetadata(): ImageMetadata[] {
  const metadataPath = path.join(process.cwd(), 'scripts', 'image-metadata.json');
  return JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
}

function createImageObject(metadata: ImageMetadata, filename: string): { type: 'image'; src: string; alt: string; caption?: string } {
  return {
    type: 'image',
    src: `/images/${filename}`,
    alt: metadata.caption || metadata.folderName,
    caption: metadata.caption !== 'No Caption Detected' ? metadata.caption : undefined
  };
}

function parseThesisContent(content: string): {
  introduction: ContentItem[];
  methodology: ContentItem[];
  conclusions: ContentItem[];
} {
  // Extract sections
  const introductionMatch = content.match(/introduction:\s*{\s*title:\s*["'][^"']*["'],\s*content:\s*\[([\s\S]*?)\]\s*}/);
  const methodologyMatch = content.match(/methodology:\s*{\s*title:\s*["'][^"']*["'],\s*content:\s*\[([\s\S]*?)\]\s*}/);
  const conclusionsMatch = content.match(/conclusions:\s*{\s*title:\s*["'][^"']*["'],\s*content:\s*\[([\s\S]*?)\]\s*}/);

  const parseSection = (sectionContent: string): ContentItem[] => {
    const items: ContentItem[] = [];
    const lines = sectionContent.split('\n').map(line => line.trim());

    for (const line of lines) {
      if (line.startsWith('{') && line.includes('"type"')) {
        // This is an image object - we'll handle it separately
        continue;
      } else if (line.startsWith('"') || line.startsWith("'")) {
        // Extract string content
        const stringMatch = line.match(/^["']([\s\S]*?)["']\s*,?$/);
        if (stringMatch) {
          items.push({
            type: 'text',
            content: stringMatch[1]
          });
        }
      }
    }

    return items;
  };

  return {
    introduction: introductionMatch ? parseSection(introductionMatch[1]) : [],
    methodology: methodologyMatch ? parseSection(methodologyMatch[1]) : [],
    conclusions: conclusionsMatch ? parseSection(conclusionsMatch[1]) : []
  };
}

function insertImagesIntoContent(
  textContent: ContentItem[],
  matchedImages: MatchedImage[],
  filenameMapping: { [folderName: string]: string },
  sectionName: string
): ContentItem[] {
  const result: ContentItem[] = [...textContent];
  const sectionMatches = matchedImages.filter(m => m.section === sectionName);

  // Sort by position
  sectionMatches.sort((a, b) => a.position - b.position);

  // Insert images at their positions
  for (const match of sectionMatches) {
    const filename = filenameMapping[match.metadata.folderName];
    if (filename) {
      const imageObject = createImageObject(match.metadata, filename);

      // Insert at the matched position (or at the end if position is invalid)
      const insertPos = Math.min(match.position + 1, result.length);
      result.splice(insertPos, 0, imageObject);
    }
  }

  return result;
}

function generateContentString(items: ContentItem[]): string {
  return items.map(item => {
    if (item.type === 'text') {
      return `      "${item.content}",`;
    } else if (item.type === 'image') {
      const captionStr = item.caption ? `,\n        "caption": "${item.caption}"` : '';
      return `      {
        "type": "image",
        "src": "${item.src}",
        "alt": "${item.alt}"${captionStr}
      },`;
    }
    return '';
  }).join('\n');
}

function updateThesisContent() {
  const matchedImages = loadMatchedImages();
  const filenameMapping = loadFilenameMapping();
  const imageMetadata = loadImageMetadata();

  // Read current thesis content
  const contentPath = path.join(process.cwd(), 'content', 'thesis-content.ts');
  let content = fs.readFileSync(contentPath, 'utf-8');

  // Parse current content structure
  const currentContent = parseThesisContent(content);

  // Update each section with matched images
  const updatedContent = {
    introduction: insertImagesIntoContent(currentContent.introduction, matchedImages, filenameMapping, 'introduction'),
    methodology: insertImagesIntoContent(currentContent.methodology, matchedImages, filenameMapping, 'methodology'),
    conclusions: insertImagesIntoContent(currentContent.conclusions, matchedImages, filenameMapping, 'conclusions')
  };

  // Generate new content strings
  const introductionContent = generateContentString(updatedContent.introduction);
  const methodologyContent = generateContentString(updatedContent.methodology);
  const conclusionsContent = generateContentString(updatedContent.conclusions);

  // Replace the content in the file
  content = content.replace(
    /introduction:\s*{\s*title:\s*["'][^"']*["'],\s*content:\s*\[[\s\S]*?\]\s*}/,
    `introduction: {\n    title: "Introduction",\n    content: [\n${introductionContent}\n    ]\n  }`
  );

  content = content.replace(
    /methodology:\s*{\s*title:\s*["'][^"']*["'],\s*content:\s*\[[\s\S]*?\]\s*}/,
    `methodology: {\n    title: "Methodology",\n    content: [\n${methodologyContent}\n    ]\n  }`
  );

  content = content.replace(
    /conclusions:\s*{\s*title:\s*["'][^"']*["'],\s*content:\s*\[[\s\S]*?\]\s*}/,
    `conclusions: {\n    title: "Conclusions",\n    content: [\n${conclusionsContent}\n    ]\n  }`
  );

  // Write back to file
  fs.writeFileSync(contentPath, content);

  console.log('Thesis content updated successfully!');
  console.log(`Introduction: ${updatedContent.introduction.length} items`);
  console.log(`Methodology: ${updatedContent.methodology.length} items`);
  console.log(`Conclusions: ${updatedContent.conclusions.length} items`);
}

function main() {
  try {
    console.log('Updating thesis content with matched images...');
    updateThesisContent();
    console.log('Update completed successfully!');
  } catch (error) {
    console.error('Error updating thesis content:', error);
  }
}

main();