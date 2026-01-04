import * as fs from 'fs';
import * as path from 'path';

function main() {
  console.log('Removing images whose "Text Before" is not found in content...\n');
  
  const filePath = path.join(process.cwd(), 'content', 'thesis-content-new.ts');
  let content = fs.readFileSync(filePath, 'utf-8');
  
  const imagesToRemove = [
    {
      name: 'Figure 15: Knowledge Tree[44]',
      src: '/images/figure_15_knowledge_tree_44_.png',
      reason: 'Text Before not found in content'
    },
    {
      name: 'Figure 16: Cost estimation PGDSF[44]',
      src: '/images/figure_16_cost_estimation_pgdsf_44_.png',
      reason: 'Text Before not found in content'
    },
    {
      name: 'Figure 13: Trade-off curves',
      src: '/images/figure_13_trade-off_curves_between_a_model_performance_and_b_token_percentage_as_a.png',
      reason: 'Text Before not found in content'
    }
  ];
  
  let removedCount = 0;
  
  for (const img of imagesToRemove) {
    // Pattern to match the image object - handle various formatting
    const patterns = [
      // Pattern 1: Full object on multiple lines
      new RegExp(`\\{\\s*"type":\\s*"image",[^}]*"src":\\s*"${img.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^}]*\\}[,\\s]*`, 'g'),
      // Pattern 2: Single line
      new RegExp(`\\{\\s*"type":\\s*"image",\\s*"src":\\s*"${img.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^}]*\\}[,\\s]*`, 'g'),
      // Pattern 3: With comma before
      new RegExp(`,\\s*\\{\\s*"type":\\s*"image",[^}]*"src":\\s*"${img.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^}]*\\}[,\\s]*`, 'g')
    ];
    
    let found = false;
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, '');
        console.log(`✅ Removed: ${img.name}`);
        removedCount++;
        found = true;
        break;
      }
    }
    
    if (!found) {
      // Try a more aggressive search
      const simplePattern = new RegExp(`[^"]*"src":\\s*"${img.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^}]*\\}[,\\s]*`, 'g');
      if (simplePattern.test(content)) {
        // Find the start of the object
        const srcIndex = content.indexOf(img.src);
        if (srcIndex !== -1) {
          // Find the opening brace before src
          let startIndex = srcIndex;
          while (startIndex > 0 && content[startIndex] !== '{') {
            startIndex--;
          }
          // Find the closing brace after src
          let endIndex = srcIndex + img.src.length;
          let braceCount = 0;
          while (endIndex < content.length) {
            if (content[endIndex] === '{') braceCount++;
            if (content[endIndex] === '}') {
              if (braceCount === 0) {
                endIndex++;
                break;
              }
              braceCount--;
            }
            endIndex++;
          }
          // Remove trailing comma and whitespace
          while (endIndex < content.length && /[,\s]/.test(content[endIndex])) {
            endIndex++;
          }
          
          // Also check for leading comma
          if (startIndex > 0 && content[startIndex - 1] === ',') {
            startIndex--;
            // Remove whitespace before comma
            while (startIndex > 0 && /\s/.test(content[startIndex - 1])) {
              startIndex--;
            }
          }
          
          content = content.substring(0, startIndex) + content.substring(endIndex);
          console.log(`✅ Removed: ${img.name}`);
          removedCount++;
        }
      } else {
        console.log(`⚠️  Could not find: ${img.name}`);
      }
    }
  }
  
  // Clean up any double commas or extra whitespace
  content = content.replace(/,\s*,/g, ',');
  content = content.replace(/,\s*\]/g, ']');
  content = content.replace(/\[\s*,/g, '[');
  
  fs.writeFileSync(filePath, content, 'utf-8');
  
  console.log(`\n✅ Removed ${removedCount} images`);
  console.log('✅ Cleaned up formatting');
}

if (require.main === module) {
  main();
}

