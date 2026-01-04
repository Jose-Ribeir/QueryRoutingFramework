import JSZip from 'jszip';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXML = promisify(parseString);

export interface PPTXTextElement {
  text: string;
  x: number; // in EMU
  y: number; // in EMU
  width: number; // in EMU
  height: number; // in EMU
  fontSize?: number;
  fontName?: string;
  color?: string;
}

export interface PPTXSlide {
  slideNumber: number;
  textElements: PPTXTextElement[];
  images: Array<{ name: string; data: Uint8Array }>;
}

export async function parsePPTX(fileBuffer: ArrayBuffer): Promise<PPTXSlide[]> {
  const zip = await JSZip.loadAsync(fileBuffer);
  const slides: PPTXSlide[] = [];

  // Get presentation relationships to find slide list
  const presentationXML = await zip.file('ppt/presentation.xml')?.async('string');
  if (!presentationXML) {
    throw new Error('Could not find presentation.xml');
  }

  const presentation = await parseXML(presentationXML);
  const slideIdLst = presentation['p:presentation']?.['p:sldIdLst']?.[0];
  const slideIds = slideIdLst?.['p:sldId'] || [];

  // Get slide relationships once
  const slideRelXML = await zip.file('ppt/_rels/presentation.xml.rels')?.async('string');
  let relationshipsMap: Map<string, string> = new Map();
  
  if (slideRelXML) {
    const slideRels = await parseXML(slideRelXML);
    const relationships = slideRels?.Relationships?.Relationship || [];
    const relArray = Array.isArray(relationships) ? relationships : [relationships].filter(Boolean);
    
    for (const rel of relArray) {
      const id = rel?.$?.Id || rel?.$.Id;
      const target = rel?.$?.Target || rel?.$.Target;
      if (id && target) {
        relationshipsMap.set(id, target);
      }
    }
  }

  // Parse each slide
  for (let i = 0; i < slideIds.length; i++) {
    const slideId = slideIds[i];
    // Try different ways to access the rId attribute
    const slideRelId = slideId?.$?.rId || slideId?.$.rId || slideId?.rId;
    
    let slidePath: string | null = null;
    
    if (slideRelId && relationshipsMap.has(slideRelId)) {
      // Get slide path from relationships map
      const slideTarget = relationshipsMap.get(slideRelId)!;
      slidePath = slideTarget.startsWith('ppt/') ? slideTarget : `ppt/${slideTarget}`;
    } else {
      // Try alternative: directly construct slide path based on index
      const directPath = `ppt/slides/slide${i + 1}.xml`;
      if (await zip.file(directPath)?.async('string')) {
        slidePath = directPath;
      }
    }
    
    if (!slidePath) {
      console.warn(`Could not find slide file for slide ${i + 1} (rId: ${slideRelId || 'none'})`);
      continue;
    }

    const slideXML = await zip.file(slidePath)?.async('string');
    if (!slideXML) {
      console.warn(`Could not read slide XML at ${slidePath}`);
      continue;
    }

    await processSlide(zip, slideXML, i + 1, slides);
  }

  return slides;
}

async function processSlide(
  zip: JSZip,
  slideXML: string,
  slideNumber: number,
  slides: PPTXSlide[]
) {
  try {
    const slide = await parseXML(slideXML);
    const textElements: PPTXTextElement[] = [];
    const images: Array<{ name: string; data: Uint8Array }> = [];

    // Extract text from slide
    extractTextFromSlide(slide, textElements);
    
    if (textElements.length === 0) {
      console.warn(`Slide ${slideNumber}: No text elements found`);
    } else {
      console.log(`Slide ${slideNumber}: Found ${textElements.length} text elements`);
    }

    // Extract images - try to find slide relationship file
    const slideRelPath = `ppt/slides/_rels/slide${slideNumber}.xml.rels`;
    const slideRelXMLContent = await zip.file(slideRelPath)?.async('string');
    if (slideRelXMLContent) {
      try {
        const slideRelsData = await parseXML(slideRelXMLContent);
        const imageRels = slideRelsData?.Relationships?.Relationship || [];
        const relArray = Array.isArray(imageRels) ? imageRels : [imageRels].filter(Boolean);
        
        for (const rel of relArray) {
          const relType = rel?.$?.Type;
          if (relType?.includes('image')) {
            const target = rel?.$?.Target;
            if (target) {
              const imagePath = target.startsWith('ppt/') ? target : `ppt/${target}`;
              const imageFile = zip.file(imagePath);
              if (imageFile) {
                const imageData = await imageFile.async('uint8array');
                images.push({
                  name: target.split('/').pop() || `image_${images.length + 1}`,
                  data: imageData,
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Error parsing slide relationships for slide ${slideNumber}:`, err);
      }
    }

    slides.push({
      slideNumber,
      textElements,
      images,
    });
  } catch (err) {
    console.error(`Error processing slide ${slideNumber}:`, err);
  }
}


function extractTextFromSlide(slide: any, textElements: PPTXTextElement[], parentX: number = 0, parentY: number = 0) {
  if (!slide) return;

  // Navigate through the slide structure - try different possible structures
  let slideElement = slide['p:sld']?.[0]?.['p:cSld']?.[0]?.['p:spTree']?.[0];
  
  // Alternative structure paths
  if (!slideElement) {
    slideElement = slide['p:sld']?.['p:cSld']?.['p:spTree'];
  }
  if (!slideElement) {
    slideElement = slide['sld']?.[0]?.['cSld']?.[0]?.['spTree']?.[0];
  }
  
  if (!slideElement) {
    // Try to find any shape tree in the slide
    const slideObj = slide['p:sld']?.[0] || slide['sld']?.[0] || slide;
    const cSld = slideObj['p:cSld']?.[0] || slideObj['cSld']?.[0] || slideObj;
    slideElement = cSld['p:spTree']?.[0] || cSld['spTree']?.[0] || cSld;
  }
  
  if (!slideElement) {
    console.warn('Could not find slide element structure');
    return;
  }

  // Process shapes - handle both array and single object cases
  const shapes: any[] = [];
  
  // Add p:sp shapes
  const pSp = slideElement['p:sp'];
  if (pSp) {
    shapes.push(...(Array.isArray(pSp) ? pSp : [pSp]));
  }
  
  // Add p:grpSp shapes
  const pGrpSp = slideElement['p:grpSp'];
  if (pGrpSp) {
    shapes.push(...(Array.isArray(pGrpSp) ? pGrpSp : [pGrpSp]));
  }
  
  // Also try without namespace
  const sp = slideElement['sp'];
  if (sp) {
    shapes.push(...(Array.isArray(sp) ? sp : [sp]));
  }
  
  const grpSp = slideElement['grpSp'];
  if (grpSp) {
    shapes.push(...(Array.isArray(grpSp) ? grpSp : [grpSp]));
  }

  for (const shape of shapes) {
    if (!shape) continue;
    
    // Try different ways to get shape properties
    const spPr = shape['p:spPr']?.[0] || shape['spPr']?.[0] || shape['p:spPr'] || shape['spPr'];
    
    // Get position and size
    let x = parentX;
    let y = parentY;
    let width = 0;
    let height = 0;

    if (spPr) {
      const xfrm = spPr['a:xfrm']?.[0] || spPr['xfrm']?.[0] || spPr['a:xfrm'] || spPr['xfrm'];
      if (xfrm) {
        const off = (Array.isArray(xfrm['a:off']) ? xfrm['a:off'][0] : xfrm['a:off']) ||
                    (Array.isArray(xfrm['off']) ? xfrm['off'][0] : xfrm['off']);
        if (off?.$) {
          x = parseInt(off.$.x || '0', 10);
          y = parseInt(off.$.y || '0', 10);
        }
        
        const ext = (Array.isArray(xfrm['a:ext']) ? xfrm['a:ext'][0] : xfrm['a:ext']) ||
                    (Array.isArray(xfrm['ext']) ? xfrm['ext'][0] : xfrm['ext']);
        if (ext?.$) {
          width = parseInt(ext.$.cx || '0', 10);
          height = parseInt(ext.$.cy || '0', 10);
        }
      }
    }

    // Extract text from text body - try different paths
    const txBody = shape['p:txBody']?.[0] || shape['txBody']?.[0] || shape['p:txBody'] || shape['txBody'];
    if (txBody) {
      const paragraphs = (Array.isArray(txBody['a:p']) ? txBody['a:p'] : (txBody['a:p'] ? [txBody['a:p']] : [])) ||
                         (Array.isArray(txBody['p']) ? txBody['p'] : (txBody['p'] ? [txBody['p']] : []));
      let fullText = '';

      for (const para of paragraphs) {
        if (!para) continue;
        const runs = (Array.isArray(para['a:r']) ? para['a:r'] : (para['a:r'] ? [para['a:r']] : [])) ||
                     (Array.isArray(para['r']) ? para['r'] : (para['r'] ? [para['r']] : []));
        for (const run of runs) {
          if (!run) continue;
          const textNodes = (Array.isArray(run['a:t']) ? run['a:t'] : (run['a:t'] ? [run['a:t']] : [])) ||
                           (Array.isArray(run['t']) ? run['t'] : (run['t'] ? [run['t']] : []));
          for (const textEl of textNodes) {
            if (typeof textEl === 'string') {
              fullText += textEl;
            } else if (textEl && typeof textEl === 'object') {
              if (textEl._) {
                fullText += textEl._;
              } else if (Array.isArray(textEl)) {
                fullText += textEl.join('');
              } else if (textEl.$) {
                // Sometimes text is in attributes
                fullText += '';
              }
            }
          }
        }
        fullText += '\n';
      }

      if (fullText.trim()) {
        // Get text properties
        const firstPara = paragraphs[0];
        const firstRun = firstPara ? ((Array.isArray(firstPara['a:r']) ? firstPara['a:r'][0] : firstPara['a:r']) ||
                                     (Array.isArray(firstPara['r']) ? firstPara['r'][0] : firstPara['r'])) : null;
        const rPr = firstRun?.['a:rPr']?.[0]?.$ || firstRun?.['rPr']?.[0]?.$ || firstRun?.['a:rPr']?.$ || firstRun?.['rPr']?.$ || {};
        
        textElements.push({
          text: fullText.trim(),
          x,
          y,
          width,
          height,
          fontSize: rPr.sz ? parseInt(rPr.sz) * 100 : undefined, // Convert from hundredths of a point
          fontName: rPr.typeface,
          color: rPr.fill ? extractColor(rPr.fill) : undefined,
        });
      }
    }

    // Recursively process grouped shapes
    if (shape['p:grpSp']?.[0]) {
      extractTextFromSlide({ 'p:sld': [{ 'p:cSld': [{ 'p:spTree': [shape['p:grpSp'][0]] }] }] }, textElements, x, y);
    }
  }
}

function extractColor(colorAttr: any): string | undefined {
  if (typeof colorAttr === 'string') {
    // Handle hex colors
    if (colorAttr.startsWith('#')) {
      return colorAttr;
    }
  }
  // For more complex color formats, you'd need to parse the XML structure
  return undefined;
}

