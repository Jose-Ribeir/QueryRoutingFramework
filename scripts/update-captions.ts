import fs from 'fs';
import path from 'path';

interface CaptionMapping {
  [pageNumber: number]: {
    [imageIndex: number]: string;
  };
}

function updateThesisContentCaptions() {
  // Load the caption mapping
  const captionsPath = path.join(process.cwd(), 'scripts', 'image-captions.json');
  const captionMapping: CaptionMapping = JSON.parse(fs.readFileSync(captionsPath, 'utf-8'));

  // Load thesis content
  const thesisContentPath = path.join(process.cwd(), 'content', 'thesis-content.ts');
  let thesisContent = fs.readFileSync(thesisContentPath, 'utf-8');

  console.log('Updating thesis content captions...');

  let updatedCount = 0;

  // Simple string replacements for known placeholder captions
  const replacements = [
    // Page 84, image 1
    {
      search: `"caption": "Page 84 Image"`,
      replace: `"caption": "Figure 24: RAGEval System: 1 summarizing a schema containing specific knowledge from seed documents. 2 filling in factual information based on this schema to generate diverse configurations. 3 generating documents according to the configurations. 4 creating evaluation data composed of questions, answers, and references derived from the configurations and documents.[65]"`
    },
    // Page 85, image 1
    {
      search: `"caption": "Page 85 Image"`,
      replace: `"caption": "Figure 28: Analysis Prompt"`
    },
    // Page 87, image 1
    {
      search: `"caption": "Page 87 Image"`,
      replace: `"caption": "Figure 29: Jsonl Data Structure"`
    },
    // Page 92, image 1 (conclusions)
    {
      search: `"caption": "Page 92 Image"`,
      replace: `"caption": "Figure 28: Analysis Prompt"`
    },
    // Page 94, image 1 (conclusions)
    {
      search: `"caption": "Page 94 Image"`,
      replace: `"caption": "Figure 29: Jsonl Data Structure"`
    },
    // Page 96, image 1 (conclusions)
    {
      search: `"caption": "Page 96 Image"`,
      replace: `"caption": "Figure 42: Energy Costs vs. Correctness Scatterplot"`
    },
    // Page 98, image 1 (conclusions)
    {
      search: `"caption": "Page 98 Image"`,
      replace: `"caption": "Figure 44: Domain Average Energy per Correct Answer"`
    },
    // Page 100, image 1 (conclusions)
    {
      search: `"caption": "Page 100 Image"`,
      replace: `"caption": "Figure 46: Average Energy Consumption per Query by File"`
    },
    // Page 101, image 1 (conclusions)
    {
      search: `"caption": "Page 101 Image"`,
      replace: `"caption": "Figure 48: Total Energy Consumption by File (CPU vs GPU)"`
    },
    // Page 103, image 1 (conclusions)
    {
      search: `"caption": "Page 103 Image"`,
      replace: `"caption": "Figure 52: Distribution of Energy Consumption per Query by File"`
    },
    // Page 104, image 1 (conclusions)
    {
      search: `"caption": "Page 104 Image"`,
      replace: `"caption": "Figure 53: Overall Performance Overview: Correctness vs. Energy Cost for ARC queries"`
    },
    // Page 107, image 1 (methodology)
    {
      search: `"caption": "Page 107 Image"`,
      replace: `"caption": "Figure 41: Instruction V6 Results"`
    }
  ];

  for (const replacement of replacements) {
    if (thesisContent.includes(replacement.search)) {
      thesisContent = thesisContent.replace(replacement.search, replacement.replace);
      console.log(`Updated: ${replacement.search.substring(0, 30)}...`);
      updatedCount++;
    }
  }

  // Also update incomplete captions
  const incompleteReplacements = [
    {
      search: `"caption": "Figure 25: Relationship between"`,
      replace: `"caption": "Figure 25: Relationship between model size and monthly downloads[68]"`
    },
    {
      search: `"caption": "Figure 30: Instruction V1"`,
      replace: `"caption": "Figure 30: Instruction V1"`
    },
    {
      search: `"caption": "Figure 33."`,
      replace: `"caption": "Figure 33: Instruction V2"`
    },
    {
      search: `"caption": "Figure 36: Instruction V4"`,
      replace: `"caption": "Figure 36: Instruction V4"`
    }
  ];

  for (const replacement of incompleteReplacements) {
    if (thesisContent.includes(replacement.search)) {
      thesisContent = thesisContent.replace(replacement.search, replacement.replace);
      console.log(`Updated incomplete: ${replacement.search}`);
      updatedCount++;
    }
  }

  // Write back the updated thesis content
  fs.writeFileSync(thesisContentPath, thesisContent, 'utf-8');

  console.log(`\nCaption update complete! Updated ${updatedCount} image captions.`);
}

function main() {
  updateThesisContentCaptions();
}

main();
