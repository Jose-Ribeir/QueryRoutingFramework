import fs from 'fs';
import path from 'path';

function populateContent() {
  // Read the template
  let content = fs.readFileSync(path.join(process.cwd(), 'content', 'thesis-content-new.ts'), 'utf-8');

  // Load all extracted content
  const introductionContent = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'introduction-content.json'), 'utf-8'));
  const methodologyContent = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'methodology-content.json'), 'utf-8'));
  const resultsContent = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'results-content.json'), 'utf-8'));
  const conclusionsContent = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'conclusions-content.json'), 'utf-8'));

  // Replace placeholders with actual content
  content = content.replace(
    '  introduction: {\n    title: "Introduction",\n    content: [], // Will be populated from extracted content\n  },',
    `  introduction: {
    title: "Introduction",
    content: ${JSON.stringify(introductionContent, null, 2)},
  },`
  );

  content = content.replace(
    '  methodology: {\n    title: "Methodology",\n    content: [], // Will be populated from extracted content\n  },',
    `  methodology: {
    title: "Methodology",
    content: ${JSON.stringify(methodologyContent, null, 2)},
  },`
  );

  content = content.replace(
    '  results: {\n    title: "Results",\n    content: [], // Will be populated from extracted content\n  },',
    `  results: {
    title: "Results",
    content: ${JSON.stringify(resultsContent, null, 2)},
  },`
  );

  content = content.replace(
    '  conclusions: {\n    title: "Conclusions",\n    content: [], // Will be populated from extracted content\n  },',
    `  conclusions: {
    title: "Conclusions",
    content: ${JSON.stringify(conclusionsContent, null, 2)},
  },`
  );

  // Write to the main file
  fs.writeFileSync(path.join(process.cwd(), 'content', 'thesis-content.ts'), content);

  console.log('Successfully populated thesis-content.ts with extracted content');
}

populateContent();
