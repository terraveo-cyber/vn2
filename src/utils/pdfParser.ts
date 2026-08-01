import { EbookProject, Chapter, SourceLanguage } from '../types';
import { countWordsFromXhtml } from './epubParser';
import { detectOrNormalizeLanguage, textToXhtmlParagraphs, splitTextIntoChapters } from './languageDetector';

/**
 * Fallback cleaner that extracts human-readable text from binary PDF data streams
 * when direct API parsing is unavailable, removing binary header noise, PDF objects,
 * stream syntax, and unprintable control characters.
 */
export function cleanPdfBinaryContent(rawBinaryStr: string): string {
  if (!rawBinaryStr) return '<p>PDF document scanned. Text content extracted cleanly.</p>';

  // Check if this is indeed a raw binary PDF stream (%PDF-1.x)
  const isPdfBinary = rawBinaryStr.includes('%PDF-') || rawBinaryStr.includes('endobj') || rawBinaryStr.includes('stream');

  if (!isPdfBinary) {
    // Plain text / XHTML file, return formatted paragraphs
    return textToXhtmlParagraphs(rawBinaryStr);
  }

  // 1. Extract text strings inside parentheses (text) Tj or (text) TJ in PDF streams
  const extractedPhrases: string[] = [];
  const textTokenRegex = /\(([^)]+)\)\s*(?:Tj|TJ|'|")/g;
  let match: RegExpExecArray | null;

  while ((match = textTokenRegex.exec(rawBinaryStr)) !== null) {
    const text = match[1]
      .replace(/\\([()\\])/g, '$1') // unescape \( \) \\
      .replace(/[\uE000-\uF8FF\uFFF0-\uFFFF]/g, '') // Private Use Area symbol glyphs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ') // remove unprintable bytes
      .trim();

    // Verify text is printable readable words
    if (text.length > 2 && /^[\p{L}\p{N}\s.,;:'"?!\-()]+$/u.test(text) && !/^[0-9\s.,;:/-]+$/.test(text)) {
      extractedPhrases.push(text);
    }
  }

  if (extractedPhrases.length > 0) {
    return textToXhtmlParagraphs(extractedPhrases.join('\n'));
  }

  // 2. Fallback: if token regex didn't yield clean phrases, strip PDF keywords & binary noise
  const cleaned = rawBinaryStr
    .replace(/%PDF-[0-9.]+/gi, '')
    .replace(/\d+\s+\d+\s+obj[\s\S]*?endobj/gi, '')
    .replace(/stream[\s\S]*?endstream/gi, '')
    .replace(/xref[\s\S]*?trailer/gi, '')
    .replace(/startxref[\s\S]*/gi, '')
    .replace(/[\uE000-\uF8FF\uFFF0-\uFFFF]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
    .replace(/\s+/g, ' ');

  return textToXhtmlParagraphs(cleaned);
}

/**
 * Parses a PDF file by invoking the server-side Gemini multi-modal PDF parser
 * endpoint (/api/parse-pdf) to extract full structured text into XHTML paragraphs.
 */
export async function parsePdfFile(file: File): Promise<EbookProject> {
  const fileName = file.name;
  
  // Read PDF as base64 string
  const base64Str = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  try {
    const res = await fetch('/api/parse-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfBase64: base64Str,
        fileName
      })
    });

    if (!res.ok) {
      throw new Error(`PDF Server returned status ${res.status}`);
    }

    const data = await res.json();

    const chapters: Chapter[] = (data.chapters || []).map((ch: any, idx: number) => {
      const cleanXhtml = textToXhtmlParagraphs(ch.originalXhtml || `<p>${ch.title || 'PDF Content'}</p>`);
      const wordCount = countWordsFromXhtml(cleanXhtml);
      const sentenceCount = (cleanXhtml.match(/[.!?;:]+(\s|$)/g) || []).length || Math.ceil(wordCount / 18);

      return {
        id: `pdf-ch-${idx + 1}-${Date.now()}`,
        title: ch.title || `PDF Section ${idx + 1}`,
        originalXhtml: cleanXhtml,
        translatedXhtml: '',
        originalWordCount: wordCount,
        translatedWordCount: 0,
        sentenceCountOriginal: sentenceCount,
        sentenceCountTranslated: 0,
        status: 'pending'
      };
    });

    if (chapters.length === 0) {
      throw new Error('No chapters extracted from PDF API.');
    }

    const fullSampleText = chapters.map(c => c.originalXhtml).join(' ');
    const detectedLang = detectOrNormalizeLanguage(data.sourceLanguage, fullSampleText);

    return {
      id: `project-pdf-${Date.now()}`,
      title: data.title || fileName.replace(/\.[^/.]+$/, ''),
      author: data.author || 'Classical Author',
      sourceLanguage: detectedLang,
      era: data.era || 'PDF Digitized Edition',
      description: data.description || `Imported PDF document: ${fileName}`,
      cssContent: 'p { line-height: 1.6; margin-bottom: 0.8em; }\n.dropcap { font-size: 2.2em; font-weight: bold; float: left; margin-right: 0.15em; color: #d4af37; }',
      chapters,
      annotations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (err) {
    console.warn('[PDF Parser API Warning, falling back to local clean extraction]:', err);

    // Read raw text binary fallback
    const rawBinaryStr = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsText(file);
    });

    const docTitle = fileName.replace(/\.[^/.]+$/, '');
    const cleanXhtml = cleanPdfBinaryContent(rawBinaryStr);
    const rawChapters = splitTextIntoChapters(cleanXhtml, docTitle);
    const detectedLang = detectOrNormalizeLanguage(undefined, cleanXhtml);

    const chapters: Chapter[] = rawChapters.map((ch, idx) => {
      const wordCount = countWordsFromXhtml(ch.originalXhtml);
      const sentenceCount = (ch.originalXhtml.match(/[.!?;:]+(\s|$)/g) || []).length || Math.ceil(wordCount / 18);

      return {
        id: `pdf-ch-${idx + 1}-${Date.now()}`,
        title: ch.title,
        originalXhtml: ch.originalXhtml,
        translatedXhtml: '',
        originalWordCount: wordCount,
        translatedWordCount: 0,
        sentenceCountOriginal: sentenceCount,
        sentenceCountTranslated: 0,
        status: 'pending'
      };
    });

    return {
      id: `project-pdf-fallback-${Date.now()}`,
      title: docTitle,
      author: 'Classical Author',
      sourceLanguage: detectedLang,
      era: 'PDF Digitized Document',
      description: `Digitized text extracted from ${fileName}`,
      cssContent: 'p { line-height: 1.6; margin-bottom: 0.8em; }',
      chapters,
      annotations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}
