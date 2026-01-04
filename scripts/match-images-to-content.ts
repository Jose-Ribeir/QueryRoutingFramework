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

function loadImageMetadata(): ImageMetadata[] {
  const metadataPath = path.join(process.cwd(), 'scripts', 'image-metadata.json');
  return JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
}

function loadThesisContentText(): string {
  const contentPath = path.join(process.cwd(), 'content', 'thesis-content.ts');
  return fs.readFileSync(contentPath, 'utf-8');
}

function findSectionContent(content: string, sectionName: string): string {
  const sectionRegex = new RegExp(`${sectionName}:\\s*{\\s*title:\\s*["'][^"']*["'],\\s*content:\\s*\\[([\\s\\S]*?)\\]\\s*}`, 'i');
  const match = content.match(sectionRegex);
  return match ? match[1] : '';
}

function extractTextLinesFromSection(sectionContent: string): string[] {
  const lines: string[] = [];

  // Split by newlines and clean up
  const contentLines = sectionContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  for (const line of contentLines) {
    // Skip image objects - they start with {
    if (line.startsWith('{') && line.includes('"type"') || line.includes("'type'")) {
      continue;
    }

    // Handle string literals that may span multiple lines
    if (line.startsWith('"') || line.startsWith("'")) {
      // Extract content between quotes
      const stringMatch = line.match(/^["']([\s\S]*?)["']\s*,?$/);
      if (stringMatch) {
        lines.push(stringMatch[1]);
      }
    }
  }

  return lines;
}

function findContextMatch(textLines: string[], contextBefore: string[], contextAfter: string[]): { position: number; confidence: 'high' | 'medium' | 'low' } | null {
  if (contextBefore.length === 0) return null;

  const beforeText = contextBefore.join(' ').toLowerCase().trim();

  for (let i = 0; i < textLines.length; i++) {
    const line = textLines[i].toLowerCase().trim();

    // Check if this line contains significant parts of the context before text
    const beforeWords = beforeText.split(/\s+/).filter(word => word.length > 3); // Only meaningful words
    const matchingWords = beforeWords.filter(word => line.includes(word));

    if (matchingWords.length >= Math.min(2, beforeWords.length)) { // At least 2 matching words or all if fewer
      let confidence: 'high' | 'medium' | 'low' = 'medium';

      // Check context after if available
      if (contextAfter.length > 0 && i + 1 < textLines.length) {
        const nextLine = textLines[i + 1].toLowerCase().trim();
        const afterWords = contextAfter[0].split(/\s+/).filter(word => word.length > 3);
        const afterMatchingWords = afterWords.filter(word => nextLine.includes(word));

        if (afterMatchingWords.length >= Math.min(2, afterWords.length)) {
          confidence = 'high';
        }
      }

      return { position: i, confidence };
    }
  }

  return null;
}

function matchImagesToSections(metadata: ImageMetadata[], thesisContent: string): MatchedImage[] {
  const matchedImages: MatchedImage[] = [];

  const sections = ['introduction', 'methodology', 'conclusions'];

  for (const image of metadata) {
    let bestMatch: MatchedImage | null = null;

    for (const sectionName of sections) {
      const sectionContent = findSectionContent(thesisContent, sectionName);
      const textLines = extractTextLinesFromSection(sectionContent);
      const match = findContextMatch(textLines, image.contextBefore, image.contextAfter);

      if (match) {
        const matchedImage: MatchedImage = {
          metadata: image,
          section: sectionName as 'introduction' | 'methodology' | 'conclusions',
          position: match.position,
          confidence: match.confidence,
          matchedText: textLines[match.position]
        };

        // Prefer higher confidence matches
        if (!bestMatch || match.confidence === 'high' || (match.confidence === 'medium' && bestMatch.confidence === 'low')) {
          bestMatch = matchedImage;
        }
      }
    }

    if (bestMatch) {
      matchedImages.push(bestMatch);
    } else {
      console.warn(`No match found for image: ${image.folderName}`);
      console.warn(`Context before: ${image.contextBefore.join(' | ')}`);
      console.warn(`Context after: ${image.contextAfter.join(' | ')}`);
    }
  }

  return matchedImages;
}

function main() {
  try {
    console.log('Loading image metadata...');
    const metadata = loadImageMetadata();
    console.log(`Loaded ${metadata.length} images`);

    console.log('Loading thesis content...');
    const thesisContent = loadThesisContentText();
    console.log('Thesis content loaded');

    console.log('Matching images to content sections...');
    const matchedImages = matchImagesToSections(metadata, thesisContent);

    console.log(`Successfully matched ${matchedImages.length} out of ${metadata.length} images`);

    // Group by confidence
    const highConfidence = matchedImages.filter(m => m.confidence === 'high');
    const mediumConfidence = matchedImages.filter(m => m.confidence === 'medium');
    const lowConfidence = matchedImages.filter(m => m.confidence === 'low');

    console.log(`High confidence matches: ${highConfidence.length}`);
    console.log(`Medium confidence matches: ${mediumConfidence.length}`);
    console.log(`Low confidence matches: ${lowConfidence.length}`);

    // Save results
    const outputPath = path.join(process.cwd(), 'scripts', 'matched-images.json');
    fs.writeFileSync(outputPath, JSON.stringify(matchedImages, null, 2));
    console.log(`Results saved to: ${outputPath}`);

    // Print summary
    matchedImages.forEach((match, index) => {
      console.log(`${index + 1}. ${match.metadata.folderName}`);
      console.log(`   Section: ${match.section}`);
      console.log(`   Position: ${match.position}`);
      console.log(`   Confidence: ${match.confidence}`);
      console.log(`   Caption: ${match.metadata.caption || 'No Caption Detected'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

main();