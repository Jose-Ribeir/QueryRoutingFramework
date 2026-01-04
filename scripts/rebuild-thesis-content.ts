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

function loadMatchedImages(): MatchedImage[] {
  const matchedPath = path.join(process.cwd(), 'scripts', 'matched-images.json');
  return JSON.parse(fs.readFileSync(matchedPath, 'utf-8'));
}

function loadFilenameMapping(): { [folderName: string]: string } {
  const mappingPath = path.join(process.cwd(), 'scripts', 'image-filename-mapping.json');
  return JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
}

function loadCurrentThesisContent(): string {
  const contentPath = path.join(process.cwd(), 'content', 'thesis-content.ts');
  return fs.readFileSync(contentPath, 'utf-8');
}

function extractTextContent(content: string, sectionName: string): string[] {
  // Extract the section content
  const sectionRegex = new RegExp(`${sectionName}:\\s*{\\s*title:\\s*["'][^"']*["'],\\s*content:\\s*\\[([\\s\S]*?)\\]\\s*}`, 'i');
  const match = content.match(sectionRegex);

  if (!match) return [];

  const sectionContent = match[1];
  const textLines: string[] = [];

  // Split by lines and extract only text content (not image objects)
  const lines = sectionContent.split('\n').map(line => line.trim());

  for (const line of lines) {
    if (line.startsWith('"') || line.startsWith("'")) {
      // Extract string content
      const stringMatch = line.match(/^["']([\s\S]*?)["']\s*,?$/);
      if (stringMatch) {
        textLines.push(stringMatch[1]);
      }
    }
  }

  return textLines;
}

function createImageObject(metadata: ImageMetadata, filename: string): string {
  const captionStr = metadata.caption && metadata.caption !== 'No Caption Detected'
    ? `,\n        "caption": "${metadata.caption.replace(/"/g, '\\"')}"`
    : '';

  return `      {
        "type": "image",
        "src": "/images/${filename}",
        "alt": "${(metadata.caption || metadata.folderName).replace(/"/g, '\\"')}"${captionStr}
      }`;
}

function rebuildSectionContent(textLines: string[], matchedImages: MatchedImage[], filenameMapping: { [folderName: string]: string }, sectionName: string): string {
  const sectionMatches = matchedImages
    .filter(m => m.section === sectionName)
    .sort((a, b) => a.position - b.position);

  let result: string[] = [];
  let matchIndex = 0;

  for (let i = 0; i < textLines.length; i++) {
    result.push(`      "${textLines[i]}",`);

    // Check if we should insert images at this position
    while (matchIndex < sectionMatches.length && sectionMatches[matchIndex].position === i) {
      const match = sectionMatches[matchIndex];
      const filename = filenameMapping[match.metadata.folderName];

      if (filename) {
        result.push(createImageObject(match.metadata, filename) + ',');
      }

      matchIndex++;
    }
  }

  // Add any remaining images at the end
  while (matchIndex < sectionMatches.length) {
    const match = sectionMatches[matchIndex];
    const filename = filenameMapping[match.metadata.folderName];

    if (filename) {
      result.push(createImageObject(match.metadata, filename) + ',');
    }

    matchIndex++;
  }

  // Remove trailing comma from last item
  if (result.length > 0) {
    result[result.length - 1] = result[result.length - 1].replace(/,$/, '');
  }

  return result.join('\n');
}

function rebuildThesisContent() {
  const matchedImages = loadMatchedImages();
  const filenameMapping = loadFilenameMapping();
  let content = loadCurrentThesisContent();

  // Extract text content from each section
  const introductionText = extractTextContent(content, 'introduction');
  const methodologyText = extractTextContent(content, 'methodology');
  const conclusionsText = extractTextContent(content, 'conclusions');

  // Rebuild each section with images inserted
  const introductionContent = rebuildSectionContent(introductionText, matchedImages, filenameMapping, 'introduction');
  const methodologyContent = rebuildSectionContent(methodologyText, matchedImages, filenameMapping, 'methodology');
  const conclusionsContent = rebuildSectionContent(conclusionsText, matchedImages, filenameMapping, 'conclusions');

  // Replace sections in the content
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
  fs.writeFileSync(path.join(process.cwd(), 'content', 'thesis-content.ts'), content);

  console.log('Thesis content rebuilt successfully!');
  console.log(`Introduction: ${introductionText.length} text lines + ${matchedImages.filter(m => m.section === 'introduction').length} images`);
  console.log(`Methodology: ${methodologyText.length} text lines + ${matchedImages.filter(m => m.section === 'methodology').length} images`);
  console.log(`Conclusions: ${conclusionsText.length} text lines + ${matchedImages.filter(m => m.section === 'conclusions').length} images`);
}

function main() {
  try {
    console.log('Rebuilding thesis content with only matched images...');
    rebuildThesisContent();
    console.log('Rebuild completed successfully!');
  } catch (error) {
    console.error('Error rebuilding thesis content:', error);
  }
}

main();
