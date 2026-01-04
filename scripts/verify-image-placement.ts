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

function loadFilenameMapping(): { [folderName: string]: string } {
  const mappingPath = path.join(process.cwd(), 'scripts', 'image-filename-mapping.json');
  return JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
}

function checkImagesInPublic(): string[] {
  const publicImagesDir = path.join(process.cwd(), 'public', 'images');
  if (!fs.existsSync(publicImagesDir)) {
    return [];
  }

  return fs.readdirSync(publicImagesDir).filter(file =>
    file.toLowerCase().endsWith('.png') ||
    file.toLowerCase().endsWith('.jpg') ||
    file.toLowerCase().endsWith('.jpeg')
  );
}

function checkImagesInThesisContent(): { src: string; alt: string; caption?: string }[] {
  const contentPath = path.join(process.cwd(), 'content', 'thesis-content.ts');
  const content = fs.readFileSync(contentPath, 'utf-8');

  const imageMatches = content.match(/"type":\s*"image"[\s\S]*?"src":\s*"([^"]*)"[\s\S]*?"alt":\s*"([^"]*)"[\s\S]*?(?:"caption":\s*"([^"]*)")?/g);

  if (!imageMatches) return [];

  return imageMatches.map(match => {
    const srcMatch = match.match(/"src":\s*"([^"]*)"/);
    const altMatch = match.match(/"alt":\s*"([^"]*)"/);
    const captionMatch = match.match(/"caption":\s*"([^"]*)"/);

    return {
      src: srcMatch ? srcMatch[1] : '',
      alt: altMatch ? altMatch[1] : '',
      caption: captionMatch ? captionMatch[1] : undefined
    };
  });
}

function verifyImagePlacement() {
  console.log('Verifying image placement...\n');

  // Load data
  const metadata = loadImageMetadata();
  const filenameMapping = loadFilenameMapping();
  const publicImages = checkImagesInPublic();
  const thesisImages = checkImagesInThesisContent();

  console.log(`Total images in metadata: ${metadata.length}`);
  console.log(`Images copied to public/images: ${publicImages.length}`);
  console.log(`Images referenced in thesis content: ${thesisImages.length}\n`);

  // Check 1: All metadata images should be in public/images
  console.log('=== CHECK 1: Images in public/images ===');
  const missingInPublic: string[] = [];
  const extraInPublic: string[] = [...publicImages];

  for (const image of metadata) {
    const expectedFilename = filenameMapping[image.folderName];
    if (!publicImages.includes(expectedFilename)) {
      missingInPublic.push(expectedFilename);
    } else {
      extraInPublic.splice(extraInPublic.indexOf(expectedFilename), 1);
    }
  }

  if (missingInPublic.length > 0) {
    console.log(`❌ Missing images in public/images: ${missingInPublic.length}`);
    missingInPublic.forEach(img => console.log(`   - ${img}`));
  } else {
    console.log('✅ All expected images are in public/images');
  }

  if (extraInPublic.length > 0) {
    console.log(`⚠️  Extra images in public/images: ${extraInPublic.length}`);
    extraInPublic.forEach(img => console.log(`   - ${img}`));
  }

  // Check 2: All thesis images should point to existing files
  console.log('\n=== CHECK 2: Image references in thesis content ===');
  const brokenReferences: string[] = [];
  const usedImages: string[] = [];

  for (const thesisImage of thesisImages) {
    const filename = path.basename(thesisImage.src);
    usedImages.push(filename);

    if (!publicImages.includes(filename)) {
      brokenReferences.push(thesisImage.src);
    }
  }

  if (brokenReferences.length > 0) {
    console.log(`❌ Broken image references: ${brokenReferences.length}`);
    brokenReferences.forEach(ref => console.log(`   - ${ref}`));
  } else {
    console.log('✅ All image references point to existing files');
  }

  // Check 3: Coverage - how many metadata images are actually used
  console.log('\n=== CHECK 3: Image usage coverage ===');
  const unusedImages: string[] = [];
  const usedMappedImages: { [folderName: string]: boolean } = {};

  for (const thesisImage of thesisImages) {
    const filename = path.basename(thesisImage.src);

    // Find which metadata image this corresponds to
    for (const [folderName, mappedFilename] of Object.entries(filenameMapping)) {
      if (mappedFilename === filename) {
        usedMappedImages[folderName] = true;
        break;
      }
    }
  }

  for (const image of metadata) {
    if (!usedMappedImages[image.folderName]) {
      unusedImages.push(image.folderName);
    }
  }

  console.log(`Images from metadata used in thesis: ${Object.keys(usedMappedImages).length}/${metadata.length}`);

  if (unusedImages.length > 0) {
    console.log(`⚠️  Unused images from metadata: ${unusedImages.length}`);
    unusedImages.slice(0, 10).forEach(img => console.log(`   - ${img}`));
    if (unusedImages.length > 10) {
      console.log(`   ... and ${unusedImages.length - 10} more`);
    }
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  const allChecksPass = missingInPublic.length === 0 && brokenReferences.length === 0;
  if (allChecksPass) {
    console.log('✅ All checks passed! Images are properly placed.');
  } else {
    console.log('❌ Some issues found. Please review the output above.');
  }

  console.log(`\nMetadata images: ${metadata.length}`);
  console.log(`Public images: ${publicImages.length}`);
  console.log(`Thesis references: ${thesisImages.length}`);
  console.log(`Used metadata images: ${Object.keys(usedMappedImages).length}`);
}

function main() {
  try {
    verifyImagePlacement();
  } catch (error) {
    console.error('Error during verification:', error);
  }
}

main();
