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

function extractMetadataFromInfoTxt(infoTxtPath: string): {
  contextBefore: string[];
  caption: string;
  contextAfter: string[];
} {
  const content = fs.readFileSync(infoTxtPath, 'utf-8');
  const lines = content.split('\n').map(line => line.trim());

  // Find the sections
  const beforeStart = lines.indexOf('--- Text Before Image ---');
  const captionStart = lines.indexOf('--- Full Caption ---');
  const afterStart = lines.indexOf('--- Text After Image ---');

  const contextBefore = beforeStart !== -1 ? lines.slice(beforeStart + 1, captionStart).filter(line => line.length > 0) : [];
  const caption = captionStart !== -1 ? lines[captionStart + 1] || '' : '';
  const contextAfter = afterStart !== -1 ? lines.slice(afterStart + 1).filter(line => line.length > 0) : [];

  return { contextBefore, caption, contextAfter };
}

function findImageFile(folderPath: string): { imagePath: string; imageFilename: string } | null {
  const files = fs.readdirSync(folderPath);
  const imageFile = files.find(file =>
    file.toLowerCase().endsWith('.png') ||
    file.toLowerCase().endsWith('.jpg') ||
    file.toLowerCase().endsWith('.jpeg')
  );

  if (!imageFile) return null;

  return {
    imagePath: path.join(folderPath, imageFile),
    imageFilename: imageFile
  };
}

function extractAllImageMetadata(): ImageMetadata[] {
  const imagesWithLocationPath = path.join(process.cwd(), 'images with location');
  const metadata: ImageMetadata[] = [];

  if (!fs.existsSync(imagesWithLocationPath)) {
    console.error(`Directory not found: ${imagesWithLocationPath}`);
    return metadata;
  }

  const folders = fs.readdirSync(imagesWithLocationPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const folderName of folders) {
    const folderPath = path.join(imagesWithLocationPath, folderName);
    const infoTxtPath = path.join(folderPath, 'info.txt');

    if (!fs.existsSync(infoTxtPath)) {
      console.warn(`info.txt not found in ${folderName}`);
      continue;
    }

    const imageInfo = findImageFile(folderPath);
    if (!imageInfo) {
      console.warn(`No image file found in ${folderName}`);
      continue;
    }

    const { contextBefore, caption, contextAfter } = extractMetadataFromInfoTxt(infoTxtPath);

    metadata.push({
      folderName,
      contextBefore,
      caption,
      contextAfter,
      imagePath: imageInfo.imagePath,
      imageFilename: imageInfo.imageFilename
    });
  }

  return metadata;
}

// Main execution
const metadata = extractAllImageMetadata();

// Write to a JSON file for inspection and further processing
const outputPath = path.join(process.cwd(), 'scripts', 'image-metadata.json');
fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));

console.log(`Extracted metadata for ${metadata.length} images`);
console.log(`Metadata saved to: ${outputPath}`);

// Print summary
metadata.forEach((item, index) => {
  console.log(`${index + 1}. ${item.folderName}`);
  console.log(`   Caption: ${item.caption || 'No Caption Detected'}`);
  console.log(`   Before: ${item.contextBefore.slice(0, 2).join(' | ')}`);
  console.log(`   After: ${item.contextAfter.slice(0, 2).join(' | ')}`);
  console.log(`   Image: ${item.imageFilename}`);
  console.log('');
});
