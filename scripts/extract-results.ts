import fs from 'fs';
import path from 'path';

interface PageContent {
  pageNumber: number;
  text: string;
  section: string;
}

function cleanText(text: string): string[] {
  // Remove page numbers, headers, and other artifacts
  let cleaned = text
    .replace(/\n\d+\n/g, '\n') // Remove page numbers
    .replace(/^\s*\d+\s*$/gm, '') // Remove standalone numbers
    .replace(/^\s*-\s*\d+\s*-\s*$/gm, '') // Remove page separators like "- 15 -"
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple newlines
    .replace(/^\s*Contents.*$/gm, '') // Remove table of contents
    .replace(/^\s*\d+\s+.*?\d+$/gm, '') // Remove TOC entries
    .replace(/^\s*[A-Z][a-z]+.*?\d+$/gm, '') // Remove TOC subsections
    .trim();

  // Split into paragraphs based on double newlines
  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0 && !/^\d+$/.test(p) && !/^-\s*\d+\s*-$/.test(p));

  return paragraphs;
}

function extractResultsContent(): string[] {
  // Load methodology content which contains the results section
  const methodologyContentPath = path.join(process.cwd(), 'scripts', 'methodology-content.json');
  const methodologyContent = JSON.parse(fs.readFileSync(methodologyContentPath, 'utf-8'));

  console.log('Extracting results from methodology content...');

  const results: string[] = [];
  let foundResults = false;

  for (const item of methodologyContent) {
    if (typeof item === 'string') {
      // Look for the start of results section
      if (item.includes('Experimental Consistency and Reproducibility')) {
        foundResults = true;
      }

      if (foundResults) {
        // Clean the text and split into paragraphs
        const cleanedText = item
          .replace(/^7\s+/, '') // Remove section number
          .replace(/^8\s+/, '') // Remove subsection numbers
          .replace(/^9\s+/, '')
          .replace(/^10\s+/, '')
          .trim();

        if (cleanedText.length > 50) { // Only include substantial paragraphs
          results.push(cleanedText);
        }
      }

      // Stop when we reach conclusions
      if (item.includes('Conclusion') && foundResults) {
        break;
      }
    }
  }

  return results;
}

function main() {
  console.log('Extracting results content...');
  const resultsContent = extractResultsContent();

  console.log(`Extracted ${resultsContent.length} result paragraphs`);

  // Save to a temporary file for inspection
  const outputPath = path.join(process.cwd(), 'scripts', 'results-content.json');
  fs.writeFileSync(outputPath, JSON.stringify(resultsContent, null, 2));

  console.log(`Results content saved to: ${outputPath}`);
}

main();
