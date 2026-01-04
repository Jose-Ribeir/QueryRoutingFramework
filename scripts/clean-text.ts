// Text cleaning utilities for PDF extraction

export function cleanText(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Remove common PDF artifacts
  // Remove page markers like "- i -", "- ii -", etc.
  cleaned = cleaned.replace(/^-\s*[ivxlcdm]+\s*-$/gim, '');
  cleaned = cleaned.replace(/^-+\s*[0-9]+\s*-+$/gim, '');
  
  // Remove table of contents patterns
  cleaned = cleaned.replace(/^\d+\s+(?:Abstract|Resumo|Introduction|Methodology|Results|Conclusion|Acknowledgments?)\d+$/gim, '');
  cleaned = cleaned.replace(/Contents?\n[\s\S]*?(?=\n\n|\n\w)/gi, '');
  
  // Remove header/footer patterns (MOD-195.IADEVO2, dates, etc.)
  cleaned = cleaned.replace(/MOD-\d+\.IAD[EVO\d]+/gi, '');
  cleaned = cleaned.replace(/\d{2}-\d{2}-\d{4}/g, '');
  
  // Remove page numbers that appear on their own line
  cleaned = cleaned.replace(/^\d+$\n/gm, '');
  
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  
  // Remove lines that are just dots (table of contents formatting)
  cleaned = cleaned.replace(/^[.\s]+$/gm, '');
  
  // Clean up section headers that appear in body text
  cleaned = cleaned.replace(/^(?:Abstract|ABSTRACT|Resumo|RESUMO|Introduction|INTRODUCTION|Methodology|METHODOLOGY|Results|RESULTS|Conclusion|CONCLUSION|Conclusões?|Conclusoes?)\s*$/gim, '');
  
  // Remove "List of Figures" and similar lists
  cleaned = cleaned.replace(/List of (Figures|Tables|Equations?)[\s\S]*?(?=\n\n|\n[A-Z])/gi, '');
  
  // Remove keywords section if it appears in abstract
  cleaned = cleaned.replace(/Keywords?\s*\n[\s\S]*?(?=\n\n|\nabstract)/gi, '');
  
  // Remove "Figure X:" patterns that might be in wrong places (keep actual captions)
  // This is tricky, so we'll be conservative
  
  return cleaned.trim();
}

export function cleanAbstractText(text: string): string {
  let cleaned = cleanText(text);
  
  // Remove "resumo" header if present
  cleaned = cleaned.replace(/^resumo\s*\n/gi, '');
  cleaned = cleaned.replace(/^abstract\s*\n/gi, '');
  
  // Remove keywords from abstract
  cleaned = cleaned.replace(/Keywords?\s*\n[\s\S]*$/gi, '');
  
  // Remove page markers more aggressively
  cleaned = cleaned.replace(/-\s*[ivxlcdm]+\s*-/g, '');
  cleaned = cleaned.replace(/-\s*\d+\s*-/g, '');
  
  // Combine multiple newlines
  cleaned = cleaned.replace(/\n{2,}/g, '\n\n');
  
  return cleaned.trim();
}

export function removeTableOfContents(text: string): string {
  // Remove table of contents - look for patterns like "1 Abstract2"
  let cleaned = text;
  
  // Remove numbered list patterns that are TOC
  cleaned = cleaned.replace(/^\d+\s+(?:Abstract|Resumo|Introduction|Methodology|Results|Conclusion|Future work|Acknowledgments?|State-of-the-Art|Background)\d+$/gim, '');
  
  // Remove subsection TOC entries (like "4.1 Motivation")
  cleaned = cleaned.replace(/^\d+\.\d+\s*[\w\s.]+\.\s*\.+\s*\d+$/gm, '');
  
  // Remove "Contents" header and everything until next major section
  const contentsMatch = cleaned.match(/Contents?\s*\n([\s\S]*?)(?=\n\s*(?:Abstract|Resumo|Introduction|4\s+Introduction|\d+\s+Introduction|Keywords?|abstract|resumo))/);
  if (contentsMatch) {
    cleaned = cleaned.replace(contentsMatch[0], '');
  }
  
  return cleaned;
}

export function splitIntoParagraphs(text: string): string[] {
  if (!text) return [];
  
  // Split by double newlines first
  let paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
  
  // Further split very long paragraphs
  const result: string[] = [];
  for (const para of paragraphs) {
    if (para.length > 800) {
      // Try to split on sentence boundaries
      const sentences = para.match(/[^.!?]+[.!?]+(?:\s+|$)/g) || [para];
      let current = '';
      for (const sentence of sentences) {
        if (current.length + sentence.length > 600 && current.length > 0) {
          result.push(current.trim());
          current = sentence;
        } else {
          current += sentence;
        }
      }
      if (current.trim().length > 0) {
        result.push(current.trim());
      }
    } else {
      result.push(para);
    }
  }
  
  return result.filter(p => p.length > 10); // Remove very short fragments
}

