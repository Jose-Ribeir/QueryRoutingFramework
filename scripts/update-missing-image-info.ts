import * as fs from 'fs';
import * as path from 'path';

function main() {
  console.log('Updating info.txt files with correct Text Before snippets...\n');
  
  const imagesContextPath = path.join(process.cwd(), 'thesis_images_context');
  
  const updates = [
    {
      folderName: 'Figure 15 Knowledge Tree[44]',
      textBefore: 'RAGCache retrieves tensors by performing prefix matching along these paths. If a subsequent document in a sequence cannot be found among the child nodes, the traversal is terminated, and the longest identified document sequence is returned. This method ensures efficiency with a time complexity of O(h), where h is the height of the tree.'
    },
    {
      folderName: 'Figure 16 Cost estimation PGDSF[44]',
      textBefore: 'required for its key-value tensors. The Cost is defined as the time taken to compute a document\'s key-value tensors, this can vary depending on GPU performance as well as document size and the sequence of preceding documents.'
    },
    {
      folderName: 'Figure 13 Trade-off curves between (a) model perfo',
      textBefore: 'at require deeper reasoning may benefit from a higher k. Therefore, the optimal value of k is dependent on both the nature of the task and the level of performance required.'
    }
  ];
  
  for (const update of updates) {
    const folderPath = path.join(imagesContextPath, update.folderName);
    const infoPath = path.join(folderPath, 'info.txt');
    
    if (fs.existsSync(infoPath)) {
      let content = fs.readFileSync(infoPath, 'utf-8');
      
      // Update Text Before section
      const textBeforeRegex = /--- Text Before ---\s*\n([\s\S]*?)(?=\n--- Full Caption ---)/;
      if (textBeforeRegex.test(content)) {
        content = content.replace(textBeforeRegex, `--- Text Before ---\n${update.textBefore}\n`);
        fs.writeFileSync(infoPath, content, 'utf-8');
        console.log(`✅ Updated ${update.folderName}`);
      } else {
        // Add Text Before section if it doesn't exist
        const captionMatch = content.match(/--- Full Caption ---/);
        if (captionMatch) {
          const beforeCaption = content.substring(0, captionMatch.index);
          const afterCaption = content.substring(captionMatch.index);
          content = beforeCaption + `--- Text Before ---\n${update.textBefore}\n\n` + afterCaption;
          fs.writeFileSync(infoPath, content, 'utf-8');
          console.log(`✅ Added Text Before to ${update.folderName}`);
        }
      }
    } else {
      console.log(`⚠️  Info file not found: ${infoPath}`);
    }
  }
  
  console.log('\n\n=== SUMMARY ===\n');
  console.log('Updated info.txt files with the correct "Text Before" snippets.');
  console.log('\n⚠️  IMPORTANT NOTE:');
  console.log('These text snippets are NOT currently in the content file.');
  console.log('This means:');
  console.log('1. The images (Figures 15, 16, 13) are currently in the introduction section');
  console.log('2. They are being distributed evenly among text paragraphs');
  console.log('3. Once you add these text snippets to the content file, run the placement script again');
  console.log('4. The images will then be automatically moved to their correct positions');
  console.log('\nThe text snippets you provided appear to be from sections that may not be');
  console.log('included in the current content file (possibly background/related work section).');
}

if (require.main === module) {
  main();
}

