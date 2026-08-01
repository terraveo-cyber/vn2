import JSZip from 'jszip';
import { EbookProject, Chapter, SourceLanguage } from '../types';
import { textToXhtmlParagraphs } from './languageDetector';

/**
 * Sanitizes XHTML string so that <style>, <script>, <head>, and outer document tags
 * are stripped, ensuring ONLY the text/content to be translated and clean HTML body structure is displayed.
 */
export function sanitizeXhtmlForPreview(rawHtml: string): { cleanXhtml: string; extractedCss: string } {
  if (!rawHtml) return { cleanXhtml: '', extractedCss: '' };

  let extractedCss = '';

  // Extract <style> tag contents
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = styleRegex.exec(rawHtml)) !== null) {
    if (match[1]) {
      extractedCss += match[1] + '\n';
    }
  }

  // Strip unprintable control characters, Private Use Area symbol glyphs, and PDF stream markers
  let clean = rawHtml
    .replace(/[\uE000-\uF8FF\uFFF0-\uFFFF]/g, '') // Private Use Area glyph symbols from broken PDF fonts
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
    .replace(/%PDF-[0-9.]+/gi, '')
    .replace(/\d+\s+\d+\s+obj[\s\S]*?endobj/gi, '')
    .replace(/stream[\s\S]*?endstream/gi, '')
    .replace(/xref[\s\S]*?trailer/gi, '')
    .replace(/startxref[\s\S]*/gi, '')
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<\/?html[^>]*>/gi, '')
    .replace(/<\/?body[^>]*>/gi, '')
    .trim();

  clean = textToXhtmlParagraphs(clean);

  return { cleanXhtml: clean, extractedCss };
}

/**
 * Calculates word count by stripping HTML tags
 */
export function countWordsFromXhtml(xhtml: string): number {
  const text = xhtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(/\s+/).length : 0;
}

/**
 * Unpacks an EPUB file (PKZIP archive), parses container.xml & content.opf,
 * extracts document metadata, CSS stylesheets, and chapter XHTML spine files.
 */
export async function parseEpubFile(file: File): Promise<EbookProject> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Locate META-INF/container.xml
  const containerFile = zip.file('META-INF/container.xml');
  if (!containerFile) {
    throw new Error('Invalid EPUB file: META-INF/container.xml not found.');
  }

  const containerXmlStr = await containerFile.async('string');
  const parser = new DOMParser();
  const containerDoc = parser.parseFromString(containerXmlStr, 'application/xml');

  const rootfileEl = containerDoc.querySelector('rootfile');
  const opfPath = rootfileEl?.getAttribute('full-path') || 'OEBPS/content.opf';

  // 2. Read OPF Package File
  const opfFile = zip.file(opfPath);
  if (!opfFile) {
    throw new Error(`Invalid EPUB file: ${opfPath} not found in zip archive.`);
  }

  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
  const opfXmlStr = await opfFile.async('string');
  const opfDoc = parser.parseFromString(opfXmlStr, 'application/xml');

  // 3. Extract Document Metadata
  const title = opfDoc.querySelector('title, dc\\:title')?.textContent?.trim() || file.name.replace(/\.[^/.]+$/, '');
  const author = opfDoc.querySelector('creator, dc\\:creator')?.textContent?.trim() || 'Classical Author';
  const languageRaw = opfDoc.querySelector('language, dc\\:language')?.textContent?.trim() || 'la';
  const publisher = opfDoc.querySelector('publisher, dc\\:publisher')?.textContent?.trim() || 'Illuminated Adaptive E-Works';
  const description = opfDoc.querySelector('description, dc\\:description')?.textContent?.trim() || `Uploaded EPUB edition of ${title}`;

  // Detect source language from metadata or default to latin
  let sourceLanguage: SourceLanguage = 'latin';
  if (languageRaw.toLowerCase().startsWith('gr') || languageRaw.toLowerCase().startsWith('el')) {
    sourceLanguage = 'greek';
  } else if (languageRaw.toLowerCase().startsWith('fr')) {
    sourceLanguage = 'french';
  } else if (languageRaw.toLowerCase().startsWith('la')) {
    sourceLanguage = 'latin';
  } else {
    sourceLanguage = 'auto';
  }

  // 4. Build Manifest items map (id -> href, media-type)
  const manifestItems: Record<string, { href: string; mediaType: string }> = {};
  const itemEls = opfDoc.querySelectorAll('manifest > item');
  itemEls.forEach(item => {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    const mediaType = item.getAttribute('media-type');
    if (id && href) {
      manifestItems[id] = { href: opfDir + href, mediaType: mediaType || '' };
    }
  });

  // 4b. Extract All Image Assets from Zip Archive
  const projectImages: Record<string, string> = {};

  const zipFileNames = Object.keys(zip.files);
  for (const zipPath of zipFileNames) {
    const zipFile = zip.files[zipPath];
    if (!zipFile || zipFile.dir) continue;

    const lowerPath = zipPath.toLowerCase();
    const isImageExt = /\.(png|jpe?g|gif|svg|webp|bmp|ico)$/i.test(lowerPath);

    let mediaType = '';
    for (const item of Object.values(manifestItems)) {
      if (item.href === zipPath || item.href === opfDir + zipPath || zipPath.endsWith(item.href)) {
        if (item.mediaType && item.mediaType.startsWith('image/')) {
          mediaType = item.mediaType;
          break;
        }
      }
    }

    if (!mediaType && isImageExt) {
      if (lowerPath.endsWith('.png')) mediaType = 'image/png';
      else if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) mediaType = 'image/jpeg';
      else if (lowerPath.endsWith('.gif')) mediaType = 'image/gif';
      else if (lowerPath.endsWith('.svg')) mediaType = 'image/svg+xml';
      else if (lowerPath.endsWith('.webp')) mediaType = 'image/webp';
      else mediaType = 'image/jpeg';
    }

    if (mediaType) {
      try {
        let dataUrl = '';
        if (mediaType === 'image/svg+xml') {
          const svgStr = await zipFile.async('string');
          dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
        } else {
          const base64Data = await zipFile.async('base64');
          dataUrl = `data:${mediaType};base64,${base64Data}`;
        }

        const filename = zipPath.split('/').pop() || zipPath;
        projectImages[zipPath] = dataUrl;
        projectImages[`images/${filename}`] = dataUrl;
        projectImages[filename] = dataUrl;
        if (opfDir && zipPath.startsWith(opfDir)) {
          projectImages[zipPath.substring(opfDir.length)] = dataUrl;
        }
      } catch (err) {
        console.warn(`[Image Extraction] Failed to extract ${zipPath}`, err);
      }
    }
  }

  // 5. Extract CSS stylesheets
  let combinedCss = 'body { font-family: serif; line-height: 1.6; padding: 1em; }\n';
  for (const item of Object.values(manifestItems)) {
    if (item.mediaType === 'text/css' || item.href.endsWith('.css')) {
      const cssFile = zip.file(item.href) || zip.file(item.href.replace(/^OEBPS\//, ''));
      if (cssFile) {
        const cssStr = await cssFile.async('string');
        combinedCss += `/* ${item.href} */\n` + cssStr + '\n';
      }
    }
  }

  // 6. Extract Spine Reading Order
  const spineItemrefs = opfDoc.querySelectorAll('spine > itemref');
  const chapters: Chapter[] = [];

  for (let idx = 0; idx < spineItemrefs.length; idx++) {
    const idref = spineItemrefs[idx].getAttribute('idref');
    if (!idref || !manifestItems[idref]) continue;

    const chapterHref = manifestItems[idref].href;
    const chapterFile = zip.file(chapterHref) || zip.file(chapterHref.replace(/^OEBPS\//, ''));

    if (chapterFile) {
      const rawXhtml = await chapterFile.async('string');
      const { cleanXhtml, extractedCss } = sanitizeXhtmlForPreview(rawXhtml);

      if (extractedCss) {
        combinedCss += extractedCss + '\n';
      }

      // Resolve relative image URLs in XHTML using extracted projectImages
      let processedXhtml = cleanXhtml;
      processedXhtml = processedXhtml.replace(
        /(<img[^>]+src=["'])([^"']*)(["'][^>]*>)/gi,
        (_match, p1, src, p3) => {
          if (src.startsWith('data:')) return `${p1}${src}${p3}`;
          const filename = src.split('/').pop() || src;
          const cleanSrc = src.replace(/^\.\.\//, '').replace(/^\.\//, '');
          const matchedDataUrl = projectImages[src] || projectImages[cleanSrc] || projectImages[filename] || projectImages[`images/${filename}`];
          if (matchedDataUrl) {
            return `${p1}${matchedDataUrl}${p3}`;
          }
          return `${p1}${src}${p3}`;
        }
      );

      processedXhtml = processedXhtml.replace(
        /(<image[^>]+(?:href|xlink:href)=["'])([^"']*)(["'][^>]*>)/gi,
        (_match, p1, src, p3) => {
          if (src.startsWith('data:')) return `${p1}${src}${p3}`;
          const filename = src.split('/').pop() || src;
          const cleanSrc = src.replace(/^\.\.\//, '').replace(/^\.\//, '');
          const matchedDataUrl = projectImages[src] || projectImages[cleanSrc] || projectImages[filename] || projectImages[`images/${filename}`];
          if (matchedDataUrl) {
            return `${p1}${matchedDataUrl}${p3}`;
          }
          return `${p1}${src}${p3}`;
        }
      );

      // Try extracting title from <h1-3> or chapter name
      let chTitle = `Chapter ${idx + 1}`;
      const headingMatch = processedXhtml.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
      if (headingMatch && headingMatch[1]) {
        chTitle = headingMatch[1].replace(/<[^>]*>/g, '').trim() || chTitle;
      }

      const wordCount = countWordsFromXhtml(processedXhtml);
      const sentenceCount = (processedXhtml.match(/[.!?;:]+(\s|$)/g) || []).length || Math.ceil(wordCount / 18);

      chapters.push({
        id: `epub-ch-${idx + 1}-${Date.now()}`,
        title: chTitle,
        originalXhtml: processedXhtml,
        translatedXhtml: '',
        originalWordCount: wordCount,
        translatedWordCount: 0,
        sentenceCountOriginal: sentenceCount,
        sentenceCountTranslated: 0,
        status: 'pending'
      });
    }
  }

  // Fallback if no chapters found in spine
  if (chapters.length === 0) {
    chapters.push({
      id: `epub-ch-1-${Date.now()}`,
      title: title || 'Main Text',
      originalXhtml: `<h1 class="chapter-title">${title}</h1>\n<p>Extracted EPUB content.</p>`,
      translatedXhtml: '',
      originalWordCount: 10,
      translatedWordCount: 0,
      sentenceCountOriginal: 1,
      sentenceCountTranslated: 0,
      status: 'pending'
    });
  }

  return {
    id: `project-epub-${Date.now()}`,
    title,
    author,
    sourceLanguage,
    era: 'EPUB Imported Edition',
    description,
    cssContent: combinedCss,
    chapters,
    annotations: [],
    images: projectImages,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
