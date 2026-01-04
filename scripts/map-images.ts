import fs from 'fs';
import path from 'path';

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

function extractPageNumber(filename: string): { pageNumber: number; imageIndex: number } | null {
  // Match patterns like: page_64_img_1.png, page_100_img_2.png
  const pageMatch = filename.match(/page[_\s](\d+)[_\s]img[_\s](\d+)/i);
  if (pageMatch) {
    return {
      pageNumber: parseInt(pageMatch[1], 10),
      imageIndex: parseInt(pageMatch[2], 10),
    };
  }
  return null;
}

function extractFigureNumber(filename: string): string | null {
  // Match patterns like: Figure 25, Figure_25, Figure25
  const figureMatch = filename.match(/figure[_\s]?(\d+)/i);
  if (figureMatch) {
    return `Figure ${figureMatch[1]}`;
  }
  return null;
}

function scanImagesDirectory(dirPath: string): ImageInfo[] {
  const images: ImageInfo[] = [];
  
  if (!fs.existsSync(dirPath)) {
    console.warn(`Directory not found: ${dirPath}`);
    return images;
  }
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile() && /\.(png|jpg|jpeg|gif)$/i.test(file)) {
      const pageInfo = extractPageNumber(file);
      const figureNumber = extractFigureNumber(file);
      
      const imageInfo: ImageInfo = {
        filename: file,
        path: `/images/methodology/${file}`,
      };
      
      if (pageInfo) {
        imageInfo.pageNumber = pageInfo.pageNumber;
        imageInfo.imageIndex = pageInfo.imageIndex;
      }
      
      if (figureNumber) {
        imageInfo.figureNumber = figureNumber;
      }
      
      images.push(imageInfo);
    }
  }
  
  return images;
}

async function mapImagesToSections(images: ImageInfo[], extractedContentPath: string): Promise<ImageInfo[]> {
  // Load extracted content to determine sections
  if (!fs.existsSync(extractedContentPath)) {
    console.warn(`Extracted content file not found: ${extractedContentPath}`);
    return images;
  }
  
  const extractedContent = JSON.parse(fs.readFileSync(extractedContentPath, 'utf-8'));
  const { sections } = extractedContent;
  
  // Map images to sections based on page numbers
  for (const image of images) {
    if (image.pageNumber) {
      if (sections.abstract && image.pageNumber >= sections.abstract.startPage && image.pageNumber <= sections.abstract.endPage) {
        image.section = 'abstract';
      } else if (sections.introduction && image.pageNumber >= sections.introduction.startPage && image.pageNumber <= sections.introduction.endPage) {
        image.section = 'introduction';
      } else if (sections.methodology && image.pageNumber >= sections.methodology.startPage && image.pageNumber <= sections.methodology.endPage) {
        image.section = 'methodology';
      } else if (sections.results && image.pageNumber >= sections.results.startPage && image.pageNumber <= sections.results.endPage) {
        image.section = 'results';
      } else if (sections.conclusions && image.pageNumber >= sections.conclusions.startPage && image.pageNumber <= sections.conclusions.endPage) {
        image.section = 'conclusions';
      }
    }
  }
  
  return images;
}

async function main() {
  const imagesDir = path.join(process.cwd(), 'public', 'images', 'methodology');
  const extractedContentPath = path.join(process.cwd(), 'scripts', 'extracted-content.json');
  
  console.log('Scanning images directory...');
  const allImages = scanImagesDirectory(imagesDir);
  
  console.log(`Found ${allImages.length} images`);
  
  // Separate page-based and figure-based images
  const pageBasedImages = allImages.filter(img => img.pageNumber !== undefined);
  const figureImages = allImages.filter(img => img.figureNumber !== undefined);
  
  console.log(`- Page-based images: ${pageBasedImages.length}`);
  console.log(`- Figure-based images: ${figureImages.length}`);
  
  // Map images to sections
  const mappedImages = await mapImagesToSections(allImages, extractedContentPath);
  
  const mapping: ImageMapping = {
    pageBasedImages: mappedImages.filter(img => img.pageNumber !== undefined),
    figureImages: mappedImages.filter(img => img.figureNumber !== undefined),
    allImages: mappedImages,
  };
  
  // Save mapping to JSON
  const outputPath = path.join(process.cwd(), 'scripts', 'image-mapping.json');
  fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));
  
  console.log(`\nImage mapping saved to: ${outputPath}`);
  console.log('\nPage-based images by section:');
  const bySection = mappedImages.reduce((acc, img) => {
    const section = img.section || 'unknown';
    if (!acc[section]) acc[section] = [];
    acc[section].push(img);
    return acc;
  }, {} as Record<string, ImageInfo[]>);
  
  Object.entries(bySection).forEach(([section, imgs]) => {
    console.log(`  ${section}: ${imgs.length} images`);
  });
}

main().catch(console.error);

