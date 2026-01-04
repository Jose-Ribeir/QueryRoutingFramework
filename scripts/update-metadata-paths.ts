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

function findImageFile(folderPath: string): { filename: string; extension: string } | null {
  if (!fs.existsSync(folderPath)) {
    return null;
  }

  const files = fs.readdirSync(folderPath);
  const imageExtensions = ['.png', '.jpg', '.jpeg'];
  
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (imageExtensions.includes(ext)) {
      return {
        filename: file,
        extension: ext
      };
    }
  }

  return null;
}

function updateMetadataPaths() {
  console.log('Loading image metadata...');
  const metadata = loadImageMetadata();
  console.log(`Loaded ${metadata.length} metadata entries`);

  const thesisImagesDir = path.join(process.cwd(), 'thesis_images_context');
  
  if (!fs.existsSync(thesisImagesDir)) {
    console.error(`Error: thesis_images_context directory not found at ${thesisImagesDir}`);
    return;
  }

  console.log('Scanning thesis_images_context directory...');
  const folders = fs.readdirSync(thesisImagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log(`Found ${folders.length} folders in thesis_images_context`);

  // Create a map of folderName to metadata entry for quick lookup
  const metadataMap = new Map<string, ImageMetadata & { index: number }>();
  metadata.forEach((entry, index) => {
    metadataMap.set(entry.folderName, { ...entry, index });
  });

  let updatedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;

  // Process each folder
  for (const folderName of folders) {
    const folderPath = path.join(thesisImagesDir, folderName);
    const imageFile = findImageFile(folderPath);

    if (!imageFile) {
      console.log(`⚠️  Skipping ${folderName}: No image file found`);
      skippedCount++;
      continue;
    }

    // Try exact match first
    let metadataEntry = metadataMap.get(folderName);
    
    // If no exact match, try prefix matching (folder names may be truncated)
    if (!metadataEntry) {
      for (const [metaFolderName, entry] of metadataMap.entries()) {
        // Check if folder name matches the start of metadata folderName or vice versa
        if (metaFolderName.startsWith(folderName) || folderName.startsWith(metaFolderName)) {
          metadataEntry = entry;
          break;
        }
      }
    }

    if (!metadataEntry) {
      console.log(`⚠️  No metadata entry found for folder: ${folderName}`);
      notFoundCount++;
      continue;
    }

    // Update the metadata entry
    const workspacePath = process.cwd();
    const newImagePath = path.join(workspacePath, 'thesis_images_context', folderName, imageFile.filename);
    const newImageFilename = imageFile.filename;

    metadata[metadataEntry.index].imagePath = newImagePath;
    metadata[metadataEntry.index].imageFilename = newImageFilename;

    console.log(`✓ Updated: ${folderName} -> ${imageFile.filename}`);
    updatedCount++;
  }

  console.log(`\nSummary:`);
  console.log(`  Updated: ${updatedCount}`);
  console.log(`  Skipped (no image): ${skippedCount}`);
  console.log(`  Not found in metadata: ${notFoundCount}`);

  // Save updated metadata
  const metadataPath = path.join(process.cwd(), 'scripts', 'image-metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`\n✅ Updated metadata saved to: ${metadataPath}`);
}

function main() {
  try {
    updateMetadataPaths();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();

