import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

interface PageContent {
  pageNumber: number;
  text: string;
  section?: string;
}

interface ExtractedContent {
  pages: PageContent[];
  sections: {
    abstract?: { startPage: number; endPage: number };
    introduction?: { startPage: number; endPage: number };
    methodology?: { startPage: number; endPage: number };
    results?: { startPage: number; endPage: number };
    conclusions?: { startPage: number; endPage: number };
  };
}

async function extractPDFContent(pdfPath: string): Promise<ExtractedContent> {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdf(dataBuffer);
  
  const pages: PageContent[] = [];
  const sections: ExtractedContent['sections'] = {};
  
  // Split text by page (approximate - pdf-parse doesn't always preserve page breaks perfectly)
  // We'll use the total pages and approximate text per page
  const totalPages = data.numpages;
  const textPerPage = Math.ceil(data.text.length / totalPages);
  
  // Extract text from each page
  for (let i = 0; i < totalPages; i++) {
    // pdf-parse doesn't provide per-page text directly, so we'll need to work with the full text
    // and identify sections by keywords
    pages.push({
      pageNumber: i + 1,
      text: '', // Will be populated by section detection
    });
  }
  
  // Full text for section detection
  const fullText = data.text;
  
  // Detect sections by looking for common headers
  // Try multiple patterns to catch different formatting
  const sectionPatterns = {
    abstract: [
      /(?:^|\n)\s*(?:Abstract|ABSTRACT|RESUMO|Resumo)\s*(?:\n|$)/i,
      /Abstract\s*$/im,
      /^abstract\s*$/im,
    ],
    introduction: [
      /(?:^|\n)\s*(?:4\.?\s*)?(?:Introduction|INTRODUCTION|Introdução|Introducao)\s*(?:\n|$)/i,
      /(?:^|\n)\s*4\s+(?:Introduction|INTRODUCTION|Introdução|Introducao)\s*(?:\n|$)/i,
      /^4\s+Introduction/im,
      /^4\s+INTRODUCTION/im,
    ],
    methodology: [
      /(?:^|\n)\s*6\s+(?:Methodology|METHODOLOGY|Metodologia)\s*(?:\n|$)/i,
      /^6\s+Methodology/im,
      /^6\s+METHODOLOGY/im,
      /(?:^|\n)\s*6\.\s*(?:Methodology|METHODOLOGY|Metodologia)\s*(?:\n|$)/i,
      /6\.1\s+Overview/i, // Methodology subsection
    ],
    results: [
      /(?:^|\n)\s*7\s+(?:Results|RESULTS|Resultados|Experimental Consistency)\s*(?:\n|$)/i,
      /^7\s+(?:Results|RESULTS|Resultados)/im,
      /Experimental Consistency/i, // This appears to be the results section
    ],
    conclusions: [
      /(?:^|\n)\s*9\s+(?:Conclusion|CONCLUSION|Conclusões?|Conclusoes?)\s*(?:\n|$)/i,
      /^9\s+Conclusion/im,
      /^9\s+CONCLUSION/im,
      /(?:^|\n)\s*(?:Conclusion|CONCLUSION|Conclusões?|Conclusoes?)\s*(?:\n|$)/i,
    ],
  };
  
  // Find section positions in text - try all patterns
  const findSection = (patterns: RegExp[]): number => {
    for (const pattern of patterns) {
      const match = fullText.search(pattern);
      if (match !== -1) return match;
    }
    return -1;
  };
  
  let abstractStart = findSection(sectionPatterns.abstract);
  let introductionStart = findSection(sectionPatterns.introduction);
  let methodologyStart = findSection(sectionPatterns.methodology);
  let resultsStart = findSection(sectionPatterns.results);
  let conclusionsStart = findSection(sectionPatterns.conclusions);
  
  // Estimate page numbers based on text position
  const estimatePage = (textPosition: number): number => {
    return Math.ceil((textPosition / fullText.length) * totalPages);
  };
  
  // Ensure sections are in order and have valid page ranges
  const sectionStarts = [
    { name: 'abstract', pos: abstractStart },
    { name: 'introduction', pos: introductionStart },
    { name: 'methodology', pos: methodologyStart },
    { name: 'results', pos: resultsStart },
    { name: 'conclusions', pos: conclusionsStart },
  ].filter(s => s.pos !== -1).sort((a, b) => a.pos - b.pos);
  
  for (let i = 0; i < sectionStarts.length; i++) {
    const current = sectionStarts[i];
    const next = sectionStarts[i + 1];
    const startPage = estimatePage(current.pos);
    const endPage = next ? estimatePage(next.pos) - 1 : totalPages;
    
    if (endPage > startPage) {
      sections[current.name as keyof typeof sections] = {
        startPage,
        endPage,
      };
    }
  }
  
  // Split full text into approximate page chunks
  const chunkSize = Math.ceil(fullText.length / totalPages);
  for (let i = 0; i < totalPages; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, fullText.length);
    pages[i].text = fullText.substring(start, end);
    
    // Determine section for this page
    const pageMid = start + chunkSize / 2;
    if (sections.abstract && pageMid >= abstractStart && (!sections.introduction || pageMid < introductionStart)) {
      pages[i].section = 'abstract';
    } else if (sections.introduction && pageMid >= introductionStart && (!sections.methodology || pageMid < methodologyStart)) {
      pages[i].section = 'introduction';
    } else if (sections.methodology && pageMid >= methodologyStart && (!sections.results || pageMid < resultsStart)) {
      pages[i].section = 'methodology';
    } else if (sections.results && pageMid >= resultsStart && (!sections.conclusions || pageMid < conclusionsStart)) {
      pages[i].section = 'results';
    } else if (sections.conclusions && pageMid >= conclusionsStart) {
      pages[i].section = 'conclusions';
    }
  }
  
  return { pages, sections };
}

async function main() {
  const pdfPath = path.join(process.cwd(), 'public', 'Tese_fixed_references.pdf');
  
  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF file not found at: ${pdfPath}`);
    process.exit(1);
  }
  
  console.log('Extracting content from PDF...');
  const extracted = await extractPDFContent(pdfPath);
  
  // Save extracted content to JSON for use by other scripts
  const outputPath = path.join(process.cwd(), 'scripts', 'extracted-content.json');
  fs.writeFileSync(outputPath, JSON.stringify(extracted, null, 2));
  
  console.log(`Extraction complete! Found ${extracted.pages.length} pages.`);
  console.log('Sections detected:');
  console.log(JSON.stringify(extracted.sections, null, 2));
  console.log(`\nExtracted content saved to: ${outputPath}`);
}

main().catch(console.error);

