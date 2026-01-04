import * as fs from 'fs';
import * as path from 'path';

// Map folder names to actual image src paths found in content
function createImageMapping(): Map<string, string> {
  const mapping = new Map<string, string>();
  
  // Read the content file to find all image src paths
  const contentPath = path.join(process.cwd(), 'content', 'thesis-content-new.ts');
  const content = fs.readFileSync(contentPath, 'utf-8');
  
  // Extract all image src paths
  const srcRegex = /"src":\s*"([^"]+)"/g;
  let match;
  const imageSrcs = new Set<string>();
  while ((match = srcRegex.exec(content)) !== null) {
    imageSrcs.add(match[1]);
  }
  
  // Read all folder names from thesis_images_context
  const thesisImagesDir = path.join(process.cwd(), 'thesis_images_context');
  const folders = fs.readdirSync(thesisImagesDir).filter(f => {
    const fullPath = path.join(thesisImagesDir, f);
    return fs.statSync(fullPath).isDirectory();
  });
  
  // Try to match folder names to image srcs
  for (const folder of folders) {
    // Try different transformations
    const variations = [
      folder.toLowerCase().replace(/[\[\]]/g, '_').replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, ''),
      folder.toLowerCase().replace(/[\[\]]/g, '').replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_'),
      folder.toLowerCase().replace(/figure\s+(\d+)/i, 'figure_$1').replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_'),
    ];
    
    // Handle Page_X_Image format
    if (folder.startsWith('Page_')) {
      const pageMatch = folder.match(/Page_(\d+)_Image(_\d+)?/);
      if (pageMatch) {
        const pageNum = pageMatch[1];
        const suffix = pageMatch[2] || '';
        variations.push(`page_${pageNum}_image${suffix.toLowerCase()}`);
      }
    }
    
    // Find matching image src
    for (const variation of variations) {
      const imageName = variation;
      for (const src of imageSrcs) {
        const srcName = path.basename(src, path.extname(src));
        if (srcName.includes(imageName) || imageName.includes(srcName) || 
            srcName.replace(/_/g, '').includes(imageName.replace(/_/g, ''))) {
          mapping.set(folder, src);
          break;
        }
      }
      if (mapping.has(folder)) break;
    }
  }
  
  return mapping;
}

// Test the mapping
const mapping = createImageMapping();
console.log(`Created mapping for ${mapping.size} images`);
console.log('\nSample mappings:');
let count = 0;
for (const [folder, src] of mapping.entries()) {
  if (count++ < 10) {
    console.log(`  ${folder.substring(0, 50)}... -> ${src}`);
  }
}

export { createImageMapping };

