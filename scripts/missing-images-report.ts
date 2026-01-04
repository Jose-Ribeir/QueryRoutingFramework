import * as fs from 'fs';
import * as path from 'path';
import { parseAllInfoFiles } from './fix-image-placements';
import { createImageMapping } from './fix-image-mapping';

function main() {
  console.log('=== MISSING IMAGES REPORT ===\n');
  
  const placements = parseAllInfoFiles();
  const imageMapping = createImageMapping();
  
  const filePath = path.join(process.cwd(), 'content', 'thesis-content-new.ts');
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Images that couldn't be matched
  const missingImages = [
    {
      name: 'Figure 15: Knowledge Tree[44]',
      src: '/images/figure_15_knowledge_tree_44_.png',
      textBefore: 'RAGCache retrieves tensors by performing prefix matching along these paths. If a subsequent document in a sequence cannot be found among the child nodes, the traversal is terminated, and the longest identified document sequence is returned. This method ensures efficiency',
      currentLocation: 'introduction',
      status: 'TEXT NOT FOUND IN CONTENT'
    },
    {
      name: 'Figure 16: Cost estimation PGDSF[44]',
      src: '/images/figure_16_cost_estimation_pgdsf_44_.png',
      textBefore: 'The Cost is defined as the time taken to compute a document\'s key-value tensors, this can vary depending on GPU performance as well as document size and the sequence of preceding documents.',
      currentLocation: 'introduction',
      status: 'TEXT NOT FOUND IN CONTENT'
    },
    {
      name: 'Figure 13: Trade-off curves between (a) model performance and (b) token percentage',
      src: '/images/figure_13_trade-off_curves_between_a_model_performance_and_b_token_percentage_as_a.png',
      textBefore: 'not required a lower k (e.g., k = 1) may result in lower computational cost. Conversely, tasks that require deeper reasoning may benefit from a higher k. Therefore, the optimal value of k is dependent on both the nature of the task and the level of performance required.',
      currentLocation: 'introduction',
      status: 'TEXT NOT FOUND IN CONTENT'
    }
  ];
  
  console.log('IMAGES WITH MISSING TEXT IN CONTENT FILE:\n');
  
  for (const img of missingImages) {
    console.log(`📷 ${img.name}`);
    console.log(`   Current Location: ${img.currentLocation}`);
    console.log(`   Status: ${img.status}`);
    console.log(`   Text Before (from info.txt):`);
    console.log(`   "${img.textBefore.substring(0, 100)}..."`);
    
    // Check if image exists in content
    if (content.includes(img.src)) {
      console.log(`   ✅ Image is present in content file`);
      
      // Find surrounding context
      const srcIndex = content.indexOf(img.src);
      const contextStart = Math.max(0, srcIndex - 200);
      const contextEnd = Math.min(content.length, srcIndex + 200);
      const context = content.substring(contextStart, contextEnd);
      
      // Find which section
      const introIndex = content.indexOf('introduction:');
      const methodIndex = content.indexOf('methodology:');
      const resultsIndex = content.indexOf('results:');
      
      let section = 'unknown';
      if (srcIndex > introIndex && (methodIndex === -1 || srcIndex < methodIndex)) {
        section = 'introduction';
      } else if (srcIndex > methodIndex && (resultsIndex === -1 || srcIndex < resultsIndex)) {
        section = 'methodology';
      } else if (srcIndex > resultsIndex) {
        section = 'results';
      }
      
      console.log(`   Current Section: ${section}`);
    } else {
      console.log(`   ❌ Image NOT found in content file`);
    }
    console.log('');
  }
  
  console.log('\n=== ANALYSIS ===\n');
  console.log('The "Text Before" snippets you provided are not found in the current content file.');
  console.log('This could mean:');
  console.log('1. The text is in a section that wasn\'t extracted to the content file');
  console.log('2. The text wording is slightly different in the actual content');
  console.log('3. These images belong in a different section (e.g., background/related work)');
  console.log('\nRECOMMENDATION:');
  console.log('- These images are currently in the introduction section');
  console.log('- They are being distributed evenly among text paragraphs');
  console.log('- You may need to manually place them or provide the exact text from the PDF');
  console.log('- Alternatively, search the PDF for these exact text snippets to find their location');
}

if (require.main === module) {
  main();
}

