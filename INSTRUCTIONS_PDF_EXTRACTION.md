# Instructions for PDF Content and Image Extraction for Thesis Webpage

## Overview
This document provides complete instructions for an LLM to extract content and images from a PDF thesis document and populate a Next.js webpage. The extracted content must be formatted according to the project's TypeScript interface structure.

## Project Structure

### Key Files and Directories
- **PDF Location**: `public/Tese_fixed_references.pdf` - The source PDF to extract from
- **Content Output**: `content/thesis-content.ts` - The TypeScript file containing all extracted content
- **Image Directory**: `public/images/methodology/` - Where extracted images should be stored
- **Scripts Directory**: `scripts/` - Contains helper scripts for extraction
- **Page Component**: `app/page.tsx` - Displays the extracted content

### Content Structure
The extracted content must conform to the `ThesisContent` interface defined in `content/thesis-content.ts`:

```typescript
interface ThesisContent {
  hero: {
    title: string;
    subtitle?: string;
    author: string;
    university: string;
    date: string;
    department?: string;
  };
  abstract: {
    title: string;
    content: string;  // Single string, not array
  };
  introduction: {
    title: string;
    content: (string | { type: 'image'; src: string; alt: string; caption?: string })[];
  };
  methodology: {
    title: string;
    content: (string | { type: 'image'; src: string; alt: string; caption?: string })[];
  };
  results: {
    title: string;
    content: string[];  // Array of strings only
  };
  conclusions: {
    title: string;
    content: (string | { type: 'image'; src: string; alt: string; caption?: string })[];
  };
  downloads: {
    title: string;
    thesisPdf: string;
    presentationPptx: string;
    frameworkGitHub?: string;
  };
  contact: {
    title: string;
    name: string;
    email: string;
    university?: string;
    department?: string;
  };
}
```

## Step-by-Step Extraction Process

### Step 1: Identify PDF Sections

Examine the PDF and identify the following sections by looking for section headers:

1. **Abstract/Resumo** - Usually appears early in the document (pages 2-3)
   - Look for headers like "Abstract", "ABSTRACT", "Resumo", "RESUMO"
   - Extract all text content from this section

2. **Introduction** - Typically labeled as "4 Introduction" or "4. Introduction"
   - Look for patterns: `/4\s+(?:Introduction|INTRODUCTION|Introdução|Introducao)/i`
   - Extract all text and identify images within this section

3. **Methodology** - Typically labeled as "6 Methodology" or "6. Methodology"
   - Look for patterns: `/6\s+(?:Methodology|METHODOLOGY|Metodologia)/i`
   - This section contains the most images and complex content
   - Extract all text and all images

4. **Results** - Typically labeled as "7 Results" or "7. Results"
   - Look for patterns: `/7\s+(?:Results|RESULTS|Resultados|Experimental Consistency)/i`
   - Extract text content (typically no images, but check)

5. **Conclusions** - Typically labeled as "9 Conclusion" or "9. Conclusion"
   - Look for patterns: `/9\s+(?:Conclusion|CONCLUSION|Conclusões?|Conclusoes?)/i`
   - Extract text and any images

### Step 2: Extract Hero Section Information

From the PDF cover page or title page, extract:
- **Title**: The main thesis title
- **Subtitle**: Degree or program name (e.g., "Mestre em Creative Computing and Artificial Intelligence")
- **Author**: Full author name
- **University**: Institution name
- **Date**: Year of completion
- **Department**: Department or program name (if applicable)

### Step 3: Extract Text Content

For each section:

1. **Read all text** from the identified page range
2. **Clean the text**:
   - Remove page numbers and headers/footers
   - Remove excessive whitespace
   - Preserve paragraph breaks (double newlines)
   - Remove table of contents entries if they appear in the text
   - Remove references section if it appears

3. **Split into paragraphs**:
   - Split on double newlines (`\n\n`)
   - For very long paragraphs (>500 characters), consider splitting on sentence boundaries
   - Each paragraph should be a separate string in the content array

4. **Preserve formatting**:
   - Keep line breaks within paragraphs where they add meaning
   - Preserve special characters and symbols
   - Maintain proper spacing

### Step 4: Extract and Process Images

#### 4.1 Identify Images in PDF

For each section, identify all images:
- **Figure-based images**: Images with captions like "Figure 25", "Figure 26", etc.
- **Page-based images**: Images without explicit figure numbers (extracted by page number)

#### 4.2 Extract Images from PDF

1. **Extract each image** from the PDF pages
2. **Save images** to `public/images/methodology/` directory
3. **Name images** using one of these conventions:
   - **Page-based**: `page_{PAGE_NUMBER}_img_{IMAGE_INDEX}.png`
     - Example: `page_64_img_1.png`, `page_105_img_2.png`
   - **Figure-based**: `Figure {NUMBER} {DESCRIPTION}.png`
     - Example: `Figure 25 Relationship between model size and monthly downloads[68].png`
     - Example: `Figure 26 Traditional information retrieval architecture[68].png`

4. **Image format**: Save as PNG format for best quality

#### 4.3 Map Images to Sections

Create a mapping that associates each image with:
- **Page number**: The PDF page where the image appears
- **Section**: Which section it belongs to (abstract, introduction, methodology, results, conclusions)
- **Image index**: If multiple images on same page (1, 2, 3, etc.)
- **Figure number**: If it has a figure caption (e.g., "Figure 25")
- **Caption**: Extract the full caption text from the PDF

#### 4.4 Extract Image Captions

For each image:
1. Look for captions in the PDF text near the image
2. Common patterns:
   - "Figure {NUMBER}: {DESCRIPTION}"
   - "Fig. {NUMBER}: {DESCRIPTION}"
   - Captions may appear above or below the image
3. Store the full caption text for use in the content

### Step 5: Integrate Images into Content

For sections that support images (`introduction`, `methodology`, `conclusions`):

1. **Determine image placement**:
   - Images should be placed in the content array where they appear in the PDF
   - If exact placement is unclear, place images after the paragraph that references them
   - If a figure number is mentioned in text (e.g., "as shown in Figure 25"), place the image near that reference

2. **Create image objects**:
   ```typescript
   {
     type: 'image',
     src: '/images/methodology/page_64_img_1.png',  // Path relative to public directory
     alt: 'Page 64 Image - Figure 1: Transformer model architecture',  // Descriptive alt text
     caption: 'Page 64 - Figure 1: Transformer model architecture [5]'  // Full caption if available
   }
   ```

3. **Interleave images with text**:
   - The content array should alternate between strings (paragraphs) and image objects
   - Example structure:
     ```typescript
     content: [
       "First paragraph of text...",
       "Second paragraph of text...",
       { type: 'image', src: '/images/methodology/page_64_img_1.png', alt: '...', caption: '...' },
       "Third paragraph that references the image...",
       // etc.
     ]
     ```

### Step 6: Handle Special Section Requirements

#### Abstract Section
- Content should be a **single string**, not an array
- Combine all paragraphs with `\n\n` separators
- No images in abstract section

#### Results Section
- Content should be an **array of strings only** (no images)
- Split into logical paragraphs

#### Introduction Section
- Can contain both text and images
- Images are typically figures referenced in the text

#### Methodology Section
- **Most complex section** - contains many images
- Images are critical for understanding the methodology
- Ensure all figures are properly placed near their text references
- Common image types:
  - System architecture diagrams
  - Instruction examples (V1, V2, V3, etc.)
  - Energy consumption graphs
  - Performance analysis charts

#### Conclusions Section
- Can contain both text and images
- Typically fewer images than methodology

### Step 7: Extract Contact and Download Information

#### Contact Information
Extract from the PDF (usually on cover page or contact page):
- **Name**: Author's full name
- **Email**: Author's email address
- **University**: Institution name
- **Department**: Department or program name

#### Download Links
Set these paths (they should already exist in the project):
- **thesisPdf**: `/Tese_fixed_references.pdf`
- **presentationPptx**: `/Final_Presentation.pptx`
- **frameworkGitHub**: GitHub repository URL (if available)

### Step 8: Format and Generate TypeScript File

1. **Create the TypeScript file structure**:
   - Start with the interface definition
   - Add the exported constant with all content
   - Use proper TypeScript syntax

2. **Format strings correctly**:
   - Escape quotes: `"` becomes `\"`
   - Escape backslashes: `\` becomes `\\`
   - Preserve newlines: `\n` for line breaks
   - Use template literals or JSON.stringify for complex strings

3. **Format image objects**:
   ```typescript
   {
     type: 'image',
     src: '/images/methodology/filename.png',
     alt: 'Descriptive alt text',
     caption: 'Full caption text'  // Optional
   }
   ```

4. **File header**:
   ```typescript
   // Thesis content - Auto-generated from PDF extraction
   // This file was generated automatically. Manual edits may be overwritten.
   ```

### Step 9: Quality Checks

Before finalizing, verify:

1. **All sections are present**: abstract, introduction, methodology, results, conclusions
2. **Hero information is complete**: title, author, university, date
3. **All images are extracted**: Check that every image mentioned in the PDF is extracted
4. **Image paths are correct**: All paths start with `/images/methodology/`
5. **Text is clean**: No artifacts, page numbers, or formatting issues
6. **Images are properly placed**: Images appear near their text references
7. **Captions are accurate**: Image captions match the PDF
8. **TypeScript syntax is valid**: File should compile without errors
9. **Content structure matches interface**: All required fields are present

### Step 10: Handle Edge Cases

1. **Multiple images on same page**:
   - Number them sequentially: `page_105_img_1.png`, `page_105_img_2.png`
   - Place them in order of appearance (top to bottom, left to right)

2. **Images without clear captions**:
   - Use descriptive alt text based on surrounding context
   - Use figure number if available: `alt: 'Figure 25'`

3. **Text that references images**:
   - If text says "as shown in Figure 25", place that image object immediately after or before that sentence

4. **Long paragraphs**:
   - Split into multiple paragraphs if they exceed 500-800 characters
   - Maintain logical flow and sentence boundaries

5. **Special characters**:
   - Preserve mathematical symbols, Greek letters, and special formatting
   - Ensure proper encoding (UTF-8)

## Technical Implementation Notes

### Image Extraction Tools
You may need to use PDF processing libraries:
- `pdf-parse` for text extraction
- `pdf-lib` or `pdfjs-dist` for image extraction
- `sharp` or `jimp` for image processing if needed

### File Paths
- All image paths in the TypeScript file should be relative to the `public` directory
- Example: Image at `public/images/methodology/page_64_img_1.png` should be referenced as `/images/methodology/page_64_img_1.png`

### Content Formatting
- Use `JSON.stringify()` for complex strings to handle escaping automatically
- For arrays, format each item on a new line with proper indentation
- Maintain consistent indentation (2 spaces)

## Example Output Structure

```typescript
export const thesisContent: ThesisContent = {
  hero: {
    title: "An Adaptive Query-Routing Framework for Optimizing Small Language Models in Resource-Constrained Environments",
    subtitle: "Mestre em Creative Computing and Artificial Intelligence",
    author: "José Pedro Farinha Ribeiro",
    university: "IADE - Faculdade de Design, Tecnologia e Comunicação",
    date: "2025",
    department: "Mestre em Creative Computing and Artificial Intelligence",
  },
  abstract: {
    title: "Abstract",
    content: "Full abstract text here...",
  },
  introduction: {
    title: "Introduction",
    content: [
      "First paragraph...",
      "Second paragraph...",
      {
        type: 'image',
        src: '/images/methodology/page_64_img_1.png',
        alt: 'Figure 1: Transformer model architecture',
        caption: 'Figure 1: Transformer model architecture [5]'
      },
      "Paragraph referencing the figure...",
    ],
  },
  methodology: {
    title: "Methodology",
    content: [
      // Text and images interleaved
    ],
  },
  results: {
    title: "Results",
    content: [
      "Results paragraph 1...",
      "Results paragraph 2...",
    ],
  },
  conclusions: {
    title: "Conclusions",
    content: [
      // Text and optional images
    ],
  },
  downloads: {
    title: "Downloads",
    thesisPdf: "/Tese_fixed_references.pdf",
    presentationPptx: "/Final_Presentation.pptx",
    frameworkGitHub: "https://git.mainet.uk/Jose-Ribeir/An-Adaptive-Query-Routing-Framework.git",
  },
  contact: {
    title: "Contact",
    name: "José Pedro Farinha Ribeiro",
    email: "josepfribeiro@live.com.pt",
    university: "IADE - Faculdade de Design, Tecnologia e Comunicação",
    department: "Mestre em Creative Computing and Artificial Intelligence",
  },
};
```

## Final Checklist

- [x] All PDF sections identified and extracted
- [x] Hero section information complete
- [x] Abstract extracted as single string
- [x] Introduction text and images extracted
- [x] Methodology text and all images extracted
- [x] Results text extracted
- [x] Conclusions text and images extracted
- [x] All images saved to `public/images/methodology/`
- [x] Image paths are correct and relative to public directory
- [x] Images properly placed in content arrays
- [x] Image captions extracted and included
- [x] Text cleaned of artifacts and properly formatted
- [x] TypeScript file syntax is valid
- [x] Content structure matches `ThesisContent` interface
- [x] Contact and download information complete
- [x] File compiles without errors

## Additional Resources

- Existing scripts in `scripts/` directory can be referenced for extraction patterns
- `scripts/extract-pdf-content.ts` shows how to identify sections
- `scripts/map-images.ts` shows how to map images to sections
- `scripts/build-content.ts` shows how to format the final TypeScript file
- `content/thesis-content.ts.backup` may contain previous extraction examples

---

**Note**: This is a comprehensive extraction task. Take time to ensure accuracy, especially for image placement and caption extraction. The quality of the extraction directly impacts the user experience on the webpage.

