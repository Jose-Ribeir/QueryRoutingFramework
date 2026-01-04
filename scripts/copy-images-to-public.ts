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

function loadImageMetadata(): ImageMetadata[] {
  const metadataPath = path.join(process.cwd(), 'scripts', 'image-metadata.json');
  return JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
}

function sanitizeFilename(filename: string): string {
  // Remove special characters and replace spaces with underscores
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .toLowerCase();
}

function copyImagesToPublic(metadata: ImageMetadata[]): { [folderName: string]: string } {
  const publicImagesDir = path.join(process.cwd(), 'public', 'images');

  // Ensure the directory exists
  if (!fs.existsSync(publicImagesDir)) {
    fs.mkdirSync(publicImagesDir, { recursive: true });
  }

  const filenameMap: { [folderName: string]: string } = {};

  for (const image of metadata) {
    const sourcePath = image.imagePath;
    const extension = path.extname(image.imageFilename);
    const baseName = path.basename(image.folderName, extension);
    const sanitizedName = sanitizeFilename(baseName);
    const targetFilename = `${sanitizedName}${extension}`;
    const targetPath = path.join(publicImagesDir, targetFilename);

    try {
      // Copy the file
      fs.copyFileSync(sourcePath, targetPath);
      filenameMap[image.folderName] = targetFilename;
      console.log(`Copied: ${image.folderName} -> ${targetFilename}`);
    } catch (error) {
      console.error(`Failed to copy ${image.folderName}:`, error);
    }
  }

  return filenameMap;
}

function main() {
  try {
    console.log('Loading image metadata...');
    const metadata = loadImageMetadata();
    console.log(`Loaded ${metadata.length} images`);

    console.log('Copying images to public/images/...');
    const filenameMap = copyImagesToPublic(metadata);

    console.log(`Successfully copied ${Object.keys(filenameMap).length} images`);

    // Save the filename mapping
    const mappingPath = path.join(process.cwd(), 'scripts', 'image-filename-mapping.json');
    fs.writeFileSync(mappingPath, JSON.stringify(filenameMap, null, 2));
    console.log(`Filename mapping saved to: ${mappingPath}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
