import * as fs from 'fs';
import * as path from 'path';

interface ImageItem {
  folderName: string;
  imagePath: string;
  contextPath?: string;
  pageNumber?: number;
  imageNumber?: number;
  type: 'page' | 'figure';
  normalizedName: string;
}

interface ContentItem {
  pageNumber: number;
  imageNumber: number;
  type: 'page' | 'figure';
  folderName: string;
  precedingText?: string;
  caption?: string;
  imagePath: string;
}

interface SectionContent {
  introduction: ContentItem[];
  methodology: ContentItem[];
  results: ContentItem[];
  conclusions: ContentItem[];
}

/**
 * Scan the images with location folder and catalog all images and context files
 */
function scanFolderStructure(): ImageItem[] {
  const imagesWithLocationPath = path.join(process.cwd(), 'images with location');
  const imageItems: ImageItem[] = [];

  if (!fs.existsSync(imagesWithLocationPath)) {
    throw new Error(`Images with location folder not found at: ${imagesWithLocationPath}`);
  }

  const entries = fs.readdirSync(imagesWithLocationPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(imagesWithLocationPath, entry.name);

    if (entry.isDirectory()) {
      // Handle directory-based images (like Page_64_Image_40/)
      const imagePath = path.join(fullPath, 'image.png');
      const contextPath = path.join(fullPath, 'context.txt');

      if (fs.existsSync(imagePath)) {
        const item = parseFolderName(entry.name);
        if (item) {
          item.imagePath = imagePath;
          item.contextPath = fs.existsSync(contextPath) ? contextPath : undefined;
          imageItems.push(item);
        }
      }
    } else if (entry.isFile() && (entry.name.endsWith('.png') || entry.name.endsWith('.jpeg') || entry.name.endsWith('.jpg'))) {
      // Handle standalone images (like figure_1_transformer_model_architecture_5_.png)
      const item = parseStandaloneImageName(entry.name);
      if (item) {
        item.imagePath = fullPath;
        imageItems.push(item);
      }
    }
  }

  return imageItems;
}

/**
 * Parse folder names like "Page_64_Image_40" or "Figure 1 Transformer model architecture [5]"
 */
function parseFolderName(folderName: string): ImageItem | null {
  // Handle Page_X_Image_Y format
  const pageMatch = folderName.match(/^Page_(\d+)_Image_(\d+)$/);
  if (pageMatch) {
    return {
      folderName,
      imagePath: '',
      pageNumber: parseInt(pageMatch[1]),
      imageNumber: parseInt(pageMatch[2]),
      type: 'page',
      normalizedName: `page_${pageMatch[1]}_image_${pageMatch[2]}.png`
    };
  }

  // Handle Figure X ... format
  const figureMatch = folderName.match(/^Figure\s+(\d+)/);
  if (figureMatch) {
    return {
      folderName,
      imagePath: '',
      pageNumber: 0, // Will be determined from context
      imageNumber: parseInt(figureMatch[1]),
      type: 'figure',
      normalizedName: folderName.replace(/[^\w]/g, '_').toLowerCase() + '.png'
    };
  }

  return null;
}

/**
 * Parse standalone image names
 */
function parseStandaloneImageName(filename: string): ImageItem | null {
  // Handle figure_*.png format
  if (filename.startsWith('figure_')) {
    const figureMatch = filename.match(/figure_(\d+)/);
    return {
      folderName: filename.replace(/\.(png|jpeg|jpg)$/, ''),
      imagePath: '',
      pageNumber: 0, // Will be determined from context
      imageNumber: figureMatch ? parseInt(figureMatch[1]) : 0,
      type: 'figure',
      normalizedName: filename
    };
  }

  // Handle page_*.png format
  const pageMatch = filename.match(/^page_(\d+)_image_(\d+)\.(png|jpeg|jpg)$/);
  if (pageMatch) {
    return {
      folderName: filename.replace(/\.(png|jpeg|jpg)$/, ''),
      imagePath: '',
      pageNumber: parseInt(pageMatch[1]),
      imageNumber: parseInt(pageMatch[2]),
      type: 'page',
      normalizedName: filename
    };
  }

  return null;
}

/**
 * Main execution function
 */
function main() {
  try {
    console.log('Scanning folder structure...');
    const imageItems = scanFolderStructure();

    console.log(`Found ${imageItems.length} image items:`);
    console.log(`- Page images: ${imageItems.filter(i => i.type === 'page').length}`);
    console.log(`- Figure images: ${imageItems.filter(i => i.type === 'figure').length}`);

    // Group by type for logging
    const pageImages = imageItems.filter(i => i.type === 'page');
    const figureImages = imageItems.filter(i => i.type === 'figure');

    console.log('\nPage images:');
    pageImages.slice(0, 5).forEach(img => {
      console.log(`  ${img.folderName} -> Page ${img.pageNumber}, Image ${img.imageNumber}`);
    });
    if (pageImages.length > 5) console.log(`  ... and ${pageImages.length - 5} more`);

    console.log('\nFigure images:');
    figureImages.slice(0, 5).forEach(img => {
      console.log(`  ${img.folderName} -> Figure ${img.imageNumber}`);
    });
    if (figureImages.length > 5) console.log(`  ... and ${figureImages.length - 5} more`);

    // Save the scan results for the next step
    const outputPath = path.join(process.cwd(), 'scripts', 'scan-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(imageItems, null, 2));
    console.log(`\nScan results saved to: ${outputPath}`);

    return imageItems;

  } catch (error) {
    console.error('Error scanning folder structure:', error);
    throw error;
  }
}

/**
 * Generate the updated thesis-content.ts file with all extracted content
 */
function generateContentFile(sectionedContent: SectionContent): void {
  // Helper function to convert content items to the format expected by the thesis interface
  const convertToThesisFormat = (items: ContentItem[]): (string | { type: 'image'; src: string; alt: string; caption?: string })[] => {
    const result: (string | { type: 'image'; src: string; alt: string; caption?: string })[] = [];

    // Sort items by page and image number to maintain order
    const sortedItems = [...items].sort((a, b) => {
      if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber;
      return a.imageNumber - b.imageNumber;
    });

    for (const item of sortedItems) {
      // Add preceding text if available
      if (item.precedingText) {
        // Clean up the text (remove extra whitespace, fix line breaks)
        const cleanText = item.precedingText
          .replace(/\n+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanText) {
          result.push(cleanText);
        }
      }

      // Add the image
      result.push({
        type: 'image',
        src: item.imagePath,
        alt: item.caption || item.folderName,
        caption: item.caption
      });
    }

    return result;
  };

  // Convert Results section to string array format (as currently defined in interface)
  const convertResultsToStringArray = (items: ContentItem[]): string[] => {
    const result: string[] = [];

    for (const item of items) {
      if (item.precedingText) {
        const cleanText = item.precedingText
          .replace(/\n+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanText) {
          result.push(cleanText);
        }
      }

      // For results, we'll include image references as text descriptions
      if (item.caption) {
        result.push(`[${item.caption}]`);
      }
    }

    return result;
  };

  // Read the existing thesis-content.ts to preserve hero, abstract, downloads, and contact
  const existingContentPath = path.join(process.cwd(), 'content', 'thesis-content.ts');
  let existingContent = '';

  try {
    existingContent = fs.readFileSync(existingContentPath, 'utf-8');
  } catch (error) {
    console.error('Error reading existing thesis-content.ts:', error);
    throw error;
  }

  // Extract the existing hero, abstract, downloads, and contact sections from the object
  const contentAfterExport = existingContent.split('export const thesisContent: ThesisContent = {')[1];

  const heroMatch = contentAfterExport.match(/hero:\s*{[^}]+},/s);
  const abstractMatch = contentAfterExport.match(/abstract:\s*{[^}]+},/s);
  const downloadsMatch = contentAfterExport.match(/downloads:\s*{[^}]+},/s);
  const contactMatch = contentAfterExport.match(/contact:\s*{[^}]+}/s);

  if (!heroMatch || !abstractMatch || !downloadsMatch || !contactMatch) {
    throw new Error('Could not extract existing sections from thesis-content.ts');
  }

  // Generate the new content sections
  const introductionContent = convertToThesisFormat(sectionedContent.introduction);
  const methodologyContent = convertToThesisFormat(sectionedContent.methodology);
  const resultsContent = convertResultsToStringArray(sectionedContent.results);
  const conclusionsContent = convertToThesisFormat(sectionedContent.conclusions);

  // Generate the complete TypeScript file
  const newContent = `// Thesis content - Auto-generated from PDF extraction
// This file was generated automatically. Manual edits may be overwritten.

export interface ThesisContent {
  hero: {
    title: string;
    subtitle?: string;
    author: string;
    university: string;
    date: string;
    department?: string;
  };
  abstract: {
    title: string;
    content: string;
  };
  introduction: {
    title: string;
    content: (string | { type: 'image'; src: string; alt: string; caption?: string })[];
  };
  methodology: {
    title: string;
    content: (string | { type: 'image'; src: string; alt: string; caption?: string })[];
  };
  results: {
    title: string;
    content: string[];
  };
  conclusions: {
    title: string;
    content: (string | { type: 'image'; src: string; alt: string; caption?: string })[];
  };
  downloads: {
    title: string;
    thesisPdf: string;
    presentationPptx: string;
    frameworkGitHub?: string;
  };
  contact: {
    title: string;
    name: string;
    email: string;
    university?: string;
    department?: string;
  };
}

export const thesisContent: ThesisContent = {
  ${heroMatch[0]}
  ${abstractMatch[0]}
  introduction: {
    title: "Introduction",
    content: ${JSON.stringify(introductionContent, null, 2)}
  },
  methodology: {
    title: "Methodology",
    content: ${JSON.stringify(methodologyContent, null, 2)}
  },
  results: {
    title: "Results",
    content: ${JSON.stringify(resultsContent, null, 2)}
  },
  conclusions: {
    title: "Conclusions",
    content: ${JSON.stringify(conclusionsContent, null, 2)}
  },
  ${downloadsMatch[0]}
  ${contactMatch[0]}
};
`;

  // Write the new content file
  const outputPath = path.join(process.cwd(), 'content', 'thesis-content-new.ts');
  fs.writeFileSync(outputPath, newContent, 'utf-8');

  console.log(`Generated thesis content file: ${outputPath}`);
  console.log(`- Introduction: ${introductionContent.length} content items`);
  console.log(`- Methodology: ${methodologyContent.length} content items`);
  console.log(`- Results: ${resultsContent.length} content items`);
  console.log(`- Conclusions: ${conclusionsContent.length} content items`);
}

/**
 * Map content items to thesis sections based on page numbers and content analysis
 */
function mapToSections(organizedContent: ContentItem[]): SectionContent {
  const sections: SectionContent = {
    introduction: [],
    methodology: [],
    results: [],
    conclusions: []
  };

  // Define section boundaries based on page ranges and content analysis
  for (const item of organizedContent) {
    let section: keyof SectionContent = 'introduction';

    if (item.pageNumber >= 111) {
      section = 'conclusions';
    } else if (item.pageNumber >= 81) {
      section = 'results';
    } else if (item.pageNumber >= 31) {
      section = 'methodology';
    } else {
      section = 'introduction';
    }

    // Additional content-based refinement using keywords
    if (item.precedingText) {
      const text = item.precedingText.toLowerCase();

      // Check for section-specific keywords
      if (text.includes('conclusion') || text.includes('future work') || text.includes('references')) {
        section = 'conclusions';
      } else if (text.includes('result') || text.includes('evaluation') || text.includes('performance') || text.includes('analysis')) {
        section = 'results';
      } else if (text.includes('method') || text.includes('approach') || text.includes('system') || text.includes('framework')) {
        section = 'methodology';
      }
    }

    sections[section].push(item);
  }

  return sections;
}

/**
 * Organize content items by page number chronologically
 */
function organizeByPage(contentItems: ContentItem[]): ContentItem[] {
  // First, assign estimated page numbers to figures that don't have them
  const itemsWithPages = contentItems.map(item => {
    if (item.type === 'figure' && item.pageNumber === 0) {
      // Estimate page number based on figure number and typical thesis structure
      // Figures 1-10: Introduction (pages 1-30)
      // Figures 11-35: Methodology (pages 31-80)
      // Figures 36-45: Results (pages 81-110)
      // Figures 46+: Conclusions (pages 111+)
      let estimatedPage = 1;
      if (item.imageNumber <= 10) {
        estimatedPage = Math.max(1, Math.min(30, item.imageNumber * 3));
      } else if (item.imageNumber <= 35) {
        estimatedPage = 31 + (item.imageNumber - 11) * 2;
      } else if (item.imageNumber <= 45) {
        estimatedPage = 81 + (item.imageNumber - 36);
      } else {
        estimatedPage = 111 + (item.imageNumber - 46) * 2;
      }

      return { ...item, pageNumber: estimatedPage };
    }
    return item;
  });

  // Sort by page number, then by image number
  return itemsWithPages.sort((a, b) => {
    if (a.pageNumber !== b.pageNumber) {
      return a.pageNumber - b.pageNumber;
    }
    return a.imageNumber - b.imageNumber;
  });
}

/**
 * Extract text content from context.txt files
 */
function extractTextContent(imageItems: ImageItem[]): ContentItem[] {
  const contentItems: ContentItem[] = [];

  for (const item of imageItems) {
    if (!item.contextPath || !fs.existsSync(item.contextPath)) {
      // No context file, just add the image item
      contentItems.push({
        pageNumber: item.pageNumber || 0,
        imageNumber: item.imageNumber || 0,
        type: item.type,
        folderName: item.folderName,
        imagePath: `/images/${item.normalizedName}`
      });
      continue;
    }

    try {
      const contextContent = fs.readFileSync(item.contextPath, 'utf-8');
      const parsed = parseContextFile(contextContent);

      contentItems.push({
        pageNumber: item.pageNumber || 0,
        imageNumber: item.imageNumber || 0,
        type: item.type,
        folderName: item.folderName,
        precedingText: parsed.precedingText,
        caption: parsed.caption,
        imagePath: `/images/${item.normalizedName}`
      });

    } catch (error) {
      console.error(`Error parsing context file for ${item.folderName}:`, error);
      // Still add the item without context
      contentItems.push({
        pageNumber: item.pageNumber || 0,
        imageNumber: item.imageNumber || 0,
        type: item.type,
        folderName: item.folderName,
        imagePath: `/images/${item.normalizedName}`
      });
    }
  }

  return contentItems;
}

/**
 * Parse a context.txt file to extract preceding text and caption
 */
function parseContextFile(content: string): { precedingText?: string; caption?: string } {
  const lines = content.split('\n');
  let precedingText = '';
  let caption = '';
  let inPrecedingText = false;
  let inCaption = false;

  for (const line of lines) {
    if (line.includes('=== TEXT PRECEDING THIS IMAGE ===')) {
      inPrecedingText = true;
      inCaption = false;
      continue;
    }

    if (line.includes('=== CAPTION ===')) {
      inPrecedingText = false;
      inCaption = true;
      continue;
    }

    if (inPrecedingText) {
      if (precedingText && line.trim()) {
        precedingText += '\n' + line;
      } else if (line.trim()) {
        precedingText = line;
      }
    }

    if (inCaption) {
      if (caption && line.trim()) {
        caption += '\n' + line;
      } else if (line.trim()) {
        caption = line;
      }
    }
  }

  return {
    precedingText: precedingText.trim() || undefined,
    caption: caption.trim() || undefined
  };
}

/**
 * Copy all images to public/images/ with normalized filenames
 */
function copyImages(imageItems: ImageItem[]): void {
  const publicImagesPath = path.join(process.cwd(), 'public', 'images');

  // Ensure public/images directory exists
  if (!fs.existsSync(publicImagesPath)) {
    fs.mkdirSync(publicImagesPath, { recursive: true });
  }

  let copiedCount = 0;
  let skippedCount = 0;

  for (const item of imageItems) {
    try {
      const destPath = path.join(publicImagesPath, item.normalizedName);

      // Check if file already exists
      if (fs.existsSync(destPath)) {
        console.log(`Skipping existing image: ${item.normalizedName}`);
        skippedCount++;
        continue;
      }

      // Copy the image
      fs.copyFileSync(item.imagePath, destPath);
      console.log(`Copied: ${item.folderName} -> ${item.normalizedName}`);
      copiedCount++;

    } catch (error) {
      console.error(`Error copying ${item.folderName}:`, error);
    }
  }

  console.log(`\nImage copy complete:`);
  console.log(`- Copied: ${copiedCount} images`);
  console.log(`- Skipped: ${skippedCount} existing images`);
}

/**
 * Main execution function with image copying
 */
function mainWithCopy() {
  try {
    console.log('Scanning folder structure...');
    const imageItems = scanFolderStructure();

    console.log(`Found ${imageItems.length} image items:`);
    console.log(`- Page images: ${imageItems.filter(i => i.type === 'page').length}`);
    console.log(`- Figure images: ${imageItems.filter(i => i.type === 'figure').length}`);

    // Group by type for logging
    const pageImages = imageItems.filter(i => i.type === 'page');
    const figureImages = imageItems.filter(i => i.type === 'figure');

    console.log('\nPage images:');
    pageImages.slice(0, 5).forEach(img => {
      console.log(`  ${img.folderName} -> Page ${img.pageNumber}, Image ${img.imageNumber}`);
    });
    if (pageImages.length > 5) console.log(`  ... and ${pageImages.length - 5} more`);

    console.log('\nFigure images:');
    figureImages.slice(0, 5).forEach(img => {
      console.log(`  ${img.folderName} -> Figure ${img.imageNumber}`);
    });
    if (figureImages.length > 5) console.log(`  ... and ${figureImages.length - 5} more`);

    // Copy images
    console.log('\nCopying images to public/images/...');
    copyImages(imageItems);

    // Extract text content
    console.log('\nExtracting text content from context files...');
    const contentItems = extractTextContent(imageItems);

    console.log(`Extracted content for ${contentItems.length} items:`);
    console.log(`- Items with preceding text: ${contentItems.filter(i => i.precedingText).length}`);
    console.log(`- Items with captions: ${contentItems.filter(i => i.caption).length}`);

    // Organize by page
    console.log('\nOrganizing content by page number...');
    const organizedContent = organizeByPage(contentItems);

    console.log(`Organized ${organizedContent.length} content items by page:`);
    const pageRange = organizedContent.reduce((range, item) => ({
      min: Math.min(range.min, item.pageNumber),
      max: Math.max(range.max, item.pageNumber)
    }), { min: Infinity, max: 0 });
    console.log(`- Page range: ${pageRange.min} to ${pageRange.max}`);

    // Map to sections
    console.log('\nMapping content to thesis sections...');
    const sectionedContent = mapToSections(organizedContent);

    console.log('Content distribution by section:');
    console.log(`- Introduction: ${sectionedContent.introduction.length} items`);
    console.log(`- Methodology: ${sectionedContent.methodology.length} items`);
    console.log(`- Results: ${sectionedContent.results.length} items`);
    console.log(`- Conclusions: ${sectionedContent.conclusions.length} items`);

    // Generate the thesis content file
    console.log('\nGenerating thesis content file...');
    generateContentFile(sectionedContent);

    // Save the scan results for the next step
    const scanOutputPath = path.join(process.cwd(), 'scripts', 'scan-results.json');
    fs.writeFileSync(scanOutputPath, JSON.stringify(imageItems, null, 2));

    // Save the extracted content
    const contentOutputPath = path.join(process.cwd(), 'scripts', 'extracted-content.json');
    fs.writeFileSync(contentOutputPath, JSON.stringify(contentItems, null, 2));

    // Save the organized content
    const organizedOutputPath = path.join(process.cwd(), 'scripts', 'organized-content.json');
    fs.writeFileSync(organizedOutputPath, JSON.stringify(organizedContent, null, 2));

    // Save the sectioned content
    const sectionedOutputPath = path.join(process.cwd(), 'scripts', 'sectioned-content.json');
    fs.writeFileSync(sectionedOutputPath, JSON.stringify(sectionedContent, null, 2));

    console.log(`\nResults saved to:`);
    console.log(`- Scan results: ${scanOutputPath}`);
    console.log(`- Extracted content: ${contentOutputPath}`);
    console.log(`- Organized content: ${organizedOutputPath}`);
    console.log(`- Sectioned content: ${sectionedOutputPath}`);

    return { imageItems, contentItems, organizedContent, sectionedContent };

  } catch (error) {
    console.error('Error in main execution:', error);
    throw error;
  }
}

// Export for use in other scripts
export { scanFolderStructure, copyImages, ImageItem, ContentItem, SectionContent };

// Run if called directly
if (require.main === module) {
  mainWithCopy();
}
