import * as fs from 'fs';
import * as path from 'path';

function main() {
  console.log('Step 1: Removing page_33_image_1 from content...');
  const filePath = path.join(process.cwd(), 'content', 'thesis-content-new.ts');
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Remove page_33_image_1
  const page33Regex = /,\s*\{\s*"type":\s*"image",\s*"src":\s*"\/images\/page_33_image_1\.png"[^}]*\}/g;
  content = content.replace(page33Regex, '');
  
  // Also handle if it's the last item before a closing bracket
  const page33Regex2 = /\{\s*"type":\s*"image",\s*"src":\s*"\/images\/page_33_image_1\.png"[^}]*\},\s*/g;
  content = content.replace(page33Regex2, '');
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('  ✅ Removed page_33_image_1');
  
  console.log('\nStep 2: Searching for missing text snippets...');
  
  // Read the content again
  content = fs.readFileSync(filePath, 'utf-8');
  
  const searchTerms = [
    {
      name: 'Figure 15 - RAGCache prefix matching',
      terms: ['RAGCache retrieves tensors', 'prefix matching along these paths', 'longest identified document sequence', 'Knowledge Tree']
    },
    {
      name: 'Figure 16 - Cost estimation PGDSF',
      terms: ['Cost is defined as the time taken', 'document\'s key-value tensors', 'PGDSF method through two primary', 'Prefix-aware Greedy']
    },
    {
      name: 'Figure 13 - Trade-off curves',
      terms: ['optimal value of k is dependent', 'lower k.*may result', 'RAGCache works by caching', 'Trade-off curves between']
    }
  ];
  
  console.log('\nSearching in all sections...\n');
  
  for (const search of searchTerms) {
    console.log(`\n${search.name}:`);
    let found = false;
    for (const term of search.terms) {
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if (regex.test(content)) {
        // Find the context
        const match = content.match(new RegExp(`.{0,100}${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.{0,100}`, 'i'));
        if (match) {
          console.log(`  ✅ Found: "${term}"`);
          console.log(`     Context: ...${match[0].substring(0, 150)}...`);
          found = true;
          break;
        }
      }
    }
    if (!found) {
      console.log(`  ❌ Not found in content file`);
      console.log(`     The text might be in a section not included in the content file`);
    }
  }
  
  console.log('\n\nStep 3: Checking which images are in introduction vs methodology...');
  
  // Count images in each section
  const introMatch = content.match(/introduction:\s*\{[^}]*content:\s*\[([\s\S]*?)\]\s*\}/);
  const methodMatch = content.match(/methodology:\s*\{[^}]*content:\s*\[([\s\S]*?)\]\s*\}/);
  
  if (introMatch) {
    const introImages = (introMatch[1].match(/figure_15|figure_16|figure_13/g) || []).length;
    console.log(`\nIntroduction section contains:`);
    if (introMatch[1].includes('figure_15')) console.log('  - Figure 15 (Knowledge Tree)');
    if (introMatch[1].includes('figure_16')) console.log('  - Figure 16 (Cost estimation PGDSF)');
    if (introMatch[1].includes('figure_13')) console.log('  - Figure 13 (Trade-off curves)');
  }
  
  if (methodMatch) {
    console.log(`\nMethodology section contains:`);
    if (methodMatch[1].includes('figure_29')) console.log('  - Figure 29 (Jsonl Data Structure)');
    if (methodMatch[1].includes('figure_52')) console.log('  - Figure 52 (Distribution of Energy Consumption)');
  }
  
  console.log('\n✅ Done!');
}

if (require.main === module) {
  main();
}

