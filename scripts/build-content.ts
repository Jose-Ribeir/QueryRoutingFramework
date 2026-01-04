import fs from 'fs';
import path from 'path';
import { cleanText, cleanAbstractText, removeTableOfContents, splitIntoParagraphs as cleanSplitIntoParagraphs } from './clean-text';

interface PageContent {
  pageNumber: number;
  text: string;
  section?: string;
}

interface ExtractedContent {
  pages: PageContent[];
  sections: {
    abstract?: { startPage: number; endPage: number };
    introduction?: { startPage: number; endPage: number };
    methodology?: { startPage: number; endPage: number };
    results?: { startPage: number; endPage: number };
    conclusions?: { startPage: number; endPage: number };
  };
}

interface ImageInfo {
  filename: string;
  pageNumber?: number;
  imageIndex?: number;
  figureNumber?: string;
  caption?: string;
  section?: string;
  path: string;
}

interface ImageMapping {
  pageBasedImages: ImageInfo[];
  figureImages: ImageInfo[];
  allImages: ImageInfo[];
}

type ContentItem = string | { type: 'image'; src: string; alt: string; caption?: string };

// Use the clean-text utility function
const splitIntoParagraphs = cleanSplitIntoParagraphs;

function findImageCaption(text: string, figureNumber: string): string | null {
  // Look for figure captions in the text
  const patterns = [
    new RegExp(`Figure\\s+${figureNumber.replace('Figure ', '')}[^\\n]*:?[^\\n]*`, 'i'),
    new RegExp(`Fig\\.\\s+${figureNumber.replace('Figure ', '')}[^\\n]*:?[^\\n]*`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  
  return null;
}

function insertImagesIntoContent(
  pages: PageContent[],
  images: ImageInfo[],
  section: string
): ContentItem[] {
  const content: ContentItem[] = [];
  const sectionPages = pages.filter(p => p.section === section);
  
  // Group images by page number
  const imagesByPage = images
    .filter(img => img.section === section && img.pageNumber)
    .reduce((acc, img) => {
      const page = img.pageNumber!;
      if (!acc[page]) acc[page] = [];
      acc[page].push(img);
      return acc;
    }, {} as Record<number, ImageInfo[]>);
  
  // Sort images within each page by image index
  Object.keys(imagesByPage).forEach(page => {
    imagesByPage[parseInt(page)].sort((a, b) => (a.imageIndex || 0) - (b.imageIndex || 0));
  });
  
  // Process each page
  for (const page of sectionPages) {
    const pageText = page.text;
    const pageImages = imagesByPage[page.pageNumber] || [];
    
    if (pageImages.length === 0) {
      // No images on this page, just add text
      const paragraphs = splitIntoParagraphs(pageText);
      content.push(...paragraphs);
    } else {
      // Has images - need to interleave text and images
      // For now, add all text first, then images
      // This is a simplification - ideally we'd parse where images appear in text
      const paragraphs = splitIntoParagraphs(pageText);
      content.push(...paragraphs);
      
      // Add images after text for this page
      for (const image of pageImages) {
        const caption = image.caption || image.figureNumber || image.filename.replace(/\.(png|jpg|jpeg)$/i, '');
        content.push({
          type: 'image',
          src: image.path,
          alt: image.figureNumber || image.filename,
          caption: caption,
        });
      }
    }
  }
  
  // Also add figure-based images that might not have page numbers
  const figureImages = images.filter(
    img => img.section === section && img.figureNumber && !img.pageNumber
  );
  
  // Try to match figure images by finding their captions in text
  const allText = sectionPages.map(p => p.text).join('\n\n');
  for (const image of figureImages) {
    const caption = findImageCaption(allText, image.figureNumber!);
    if (caption) {
      // Find where this caption appears and insert image nearby
      const captionIndex = allText.indexOf(caption);
      if (captionIndex !== -1) {
        // For now, just append at the end of methodology section
        // More sophisticated placement would require better text parsing
        content.push({
          type: 'image',
          src: image.path,
          alt: image.figureNumber!,
          caption: caption,
        });
      }
    }
  }
  
  return content;
}

function buildThesisContent(
  extracted: ExtractedContent,
  imageMapping: ImageMapping
): string {
  // Get hero section from existing content (we'll preserve it)
  const existingContentPath = path.join(process.cwd(), 'content', 'thesis-content.ts.backup');
  let heroCode = `{
    title: "An Adaptive Query-Routing Framework for Optimizing Small Language Models in Resource-Constrained Environments",
    subtitle: "Mestre em Creative Computing and Artificial Intelligence",
    author: "José Pedro Farinha Ribeiro",
    university: "IADE - Faculdade de Design, Tecnologia e Comunicação",
    date: "2025",
    department: "Mestre em Creative Computing and Artificial Intelligence",
  }`;
  let downloadsCode = `{
    title: "Downloads",
    thesisPdf: "/Tese_fixed_references.pdf",
    presentationPptx: "/Final_Presentation.pptx",
    frameworkGitHub: "https://git.mainet.uk/Jose-Ribeir/An-Adaptive-Query-Routing-Framework.git",
  }`;
  let contactCode = `{
    title: "Contact",
    name: "José Pedro Farinha Ribeiro",
    email: "josepfribeiro@live.com.pt",
    university: "IADE - Faculdade de Design, Tecnologia e Comunicação",
    department: "Mestre em Creative Computing and Artificial Intelligence",
  }`;
  
  if (fs.existsSync(existingContentPath)) {
    const existingContent = fs.readFileSync(existingContentPath, 'utf-8');
    // Extract hero section - look for the object literal after "hero:"
    const heroMatch = existingContent.match(/hero:\s*\{([\s\S]*?)\n\s*\},/);
    if (heroMatch) {
      const heroContent = heroMatch[1].trim();
      // Only use if it looks like actual values, not type definitions
      if (!heroContent.includes('string;') && !heroContent.includes('title: string')) {
        heroCode = `{${heroContent}}`;
      }
    }
    
    // Extract downloads section
    const downloadsMatch = existingContent.match(/downloads:\s*\{([\s\S]*?)\n\s*\},/);
    if (downloadsMatch) {
      const downloadsContent = downloadsMatch[1].trim();
      if (!downloadsContent.includes('string;') && !downloadsContent.includes('title: string')) {
        downloadsCode = `{${downloadsContent}}`;
      }
    }
    
    // Extract contact section
    const contactMatch = existingContent.match(/contact:\s*\{([\s\S]*?)\n\s*\},?/);
    if (contactMatch) {
      const contactContent = contactMatch[1].trim();
      if (!contactContent.includes('string;') && !contactContent.includes('title: string')) {
        contactCode = `{${contactContent}}`;
      }
    }
  }
  
  // Build abstract content
  const abstractPages = extracted.pages.filter(
    p => p.section === 'abstract' && extracted.sections.abstract &&
    p.pageNumber >= extracted.sections.abstract.startPage &&
    p.pageNumber <= extracted.sections.abstract.endPage
  );
  let abstractText = abstractPages.map(p => p.text).join('\n\n').trim();
  // Clean abstract text - remove artifacts, TOC, etc.
  abstractText = cleanAbstractText(abstractText);
  // Remove table of contents if it got included
  abstractText = removeTableOfContents(abstractText);
  
  // Build introduction content (text only for now, can add images later if needed)
  const introductionPages = extracted.pages.filter(
    p => p.section === 'introduction' && extracted.sections.introduction &&
    p.pageNumber >= extracted.sections.introduction.startPage &&
    p.pageNumber <= extracted.sections.introduction.endPage
  );
  let introductionText = introductionPages.map(p => p.text).join('\n\n');
  introductionText = cleanText(introductionText);
  introductionText = removeTableOfContents(introductionText);
  const introductionContent = splitIntoParagraphs(introductionText);
  
  // Build methodology content (with images)
  const methodologyContent = insertImagesIntoContent(
    extracted.pages,
    imageMapping.allImages,
    'methodology'
  );
  
  // Build results content (text only for now)
  const resultsPages = extracted.pages.filter(
    p => p.section === 'results' && extracted.sections.results &&
    p.pageNumber >= extracted.sections.results.startPage &&
    p.pageNumber <= extracted.sections.results.endPage
  );
  let resultsText = resultsPages.map(p => p.text).join('\n\n');
  resultsText = cleanText(resultsText);
  resultsText = removeTableOfContents(resultsText);
  const resultsContent = splitIntoParagraphs(resultsText);
  
  // Build conclusions content (text only for now)
  const conclusionsPages = extracted.pages.filter(
    p => p.section === 'conclusions' && extracted.sections.conclusions &&
    p.pageNumber >= extracted.sections.conclusions.startPage &&
    p.pageNumber <= extracted.sections.conclusions.endPage
  );
  let conclusionsText = conclusionsPages.map(p => p.text).join('\n\n');
  conclusionsText = cleanText(conclusionsText);
  conclusionsText = removeTableOfContents(conclusionsText);
  const conclusionsContent = splitIntoParagraphs(conclusionsText);
  
  // Generate TypeScript content
  const formatContentItem = (item: ContentItem, indent: string = '      '): string => {
    if (typeof item === 'string') {
      // Escape quotes and format string
      const escaped = item.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
      return `${indent}"${escaped}",`;
    } else {
      const caption = item.caption ? `, caption: "${item.caption.replace(/"/g, '\\"')}"` : '';
      return `${indent}{ type: 'image', src: '${item.src}', alt: '${item.alt}'${caption} },`;
    }
  };
  
  const formatContentArray = (items: ContentItem[]): string => {
    if (items.length === 0) return '[]';
    return `[\n${items.map(item => formatContentItem(item)).join('\n')}\n    ]`;
  };
  
  
  return `// Thesis content - Auto-generated from PDF extraction
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
    content: string[];
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
    content: string[];
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
  hero: ${heroCode},
  abstract: {
    title: "Abstract",
    content: ${JSON.stringify(abstractText)},
  },
  introduction: {
    title: "Introduction",
    content: ${formatContentArray(introductionContent)},
  },
  methodology: {
    title: "Methodology",
    content: ${formatContentArray(methodologyContent)},
  },
  results: {
    title: "Results",
    content: ${formatContentArray(resultsContent)},
  },
  conclusions: {
    title: "Conclusions",
    content: ${formatContentArray(conclusionsContent)},
  },
  downloads: ${downloadsCode},
  contact: ${contactCode},
};
`;
}

async function main() {
  const extractedPath = path.join(process.cwd(), 'scripts', 'extracted-content.json');
  const imageMappingPath = path.join(process.cwd(), 'scripts', 'image-mapping.json');
  const outputPath = path.join(process.cwd(), 'content', 'thesis-content.ts');
  
  if (!fs.existsSync(extractedPath)) {
    console.error('Extracted content not found. Please run extract-pdf script first.');
    process.exit(1);
  }
  
  if (!fs.existsSync(imageMappingPath)) {
    console.error('Image mapping not found. Please run map-images script first.');
    process.exit(1);
  }
  
  console.log('Loading extracted content and image mapping...');
  const extracted: ExtractedContent = JSON.parse(fs.readFileSync(extractedPath, 'utf-8'));
  const imageMapping: ImageMapping = JSON.parse(fs.readFileSync(imageMappingPath, 'utf-8'));
  
  console.log('Building thesis content...');
  const content = buildThesisContent(extracted, imageMapping);
  
  // Backup existing file
  if (fs.existsSync(outputPath)) {
    const backupPath = outputPath + '.backup';
    fs.copyFileSync(outputPath, backupPath);
    console.log(`Backed up existing file to: ${backupPath}`);
  }
  
  fs.writeFileSync(outputPath, content);
  console.log(`\nNew thesis content generated at: ${outputPath}`);
  console.log(`\nSummary:`);
  console.log(`- Abstract: ${extracted.sections.abstract ? 'Found' : 'Not found'}`);
  console.log(`- Introduction: ${extracted.sections.introduction ? 'Found' : 'Not found'}`);
  console.log(`- Methodology: ${extracted.sections.methodology ? 'Found' : 'Not found'}`);
  console.log(`- Results: ${extracted.sections.results ? 'Found' : 'Not found'}`);
  console.log(`- Conclusions: ${extracted.sections.conclusions ? 'Found' : 'Not found'}`);
  console.log(`- Total images mapped: ${imageMapping.allImages.length}`);
}

main().catch(console.error);

