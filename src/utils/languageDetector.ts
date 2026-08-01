import { SourceLanguage } from '../types';

/**
 * Normalizes and detects the primary source language ('french', 'latin', 'greek', 'auto')
 * by examining both the provided language tag and inspecting actual vocabulary in the text.
 */
export function detectOrNormalizeLanguage(detectedLang?: string, sampleText?: string): SourceLanguage {
  const langLower = (detectedLang || '').toLowerCase().trim();

  // Direct string checks
  if (langLower.includes('french') || langLower.includes('français') || langLower.includes('francais') || langLower === 'fr') {
    return 'french';
  }
  if (langLower.includes('greek') || langLower.includes('ελλην') || langLower === 'el' || langLower === 'gr') {
    return 'greek';
  }
  if (langLower.includes('latin') || langLower.includes('latina') || langLower === 'la') {
    return 'latin';
  }

  // Automatic heuristic check on sample text if provided
  if (sampleText && sampleText.length > 20) {
    const textClean = sampleText.replace(/<[^>]*>/g, ' ').toLowerCase();

    // Check Greek characters range (\u0370-\u03FF, \u1F00-\u1FFF)
    if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(sampleText)) {
      return 'greek';
    }

    // French indicators: French articles, prepositions, pronouns, accents, and contractions
    const frenchMatches = textClean.match(/\b(le|la|les|des|du|en|et|est|que|qui|dans|pour|pas|sur|avec|sont|aux|ce|cette|plus|mais|ou|ne|par|se|une|un|chapitre|dianes|dumas|hugo|d|l|qu|c|n|s|m|t)\b/g);
    const frenchAccents = textClean.match(/[éèêàçùôîœæ]/g);
    const frenchScore = (frenchMatches ? frenchMatches.length : 0) + (frenchAccents ? frenchAccents.length * 2 : 0);

    // Latin indicators: Common Latin words
    const latinMatches = textClean.match(/\b(cum|quod|fuit|sunt|eius|atque|neque|tamen|etiam|magis|posset|habere|regis|pater|omnes|dicit|autem|enim|fuisse|omnia|quae|tam|caput|liber)\b/g);
    const latinScore = latinMatches ? latinMatches.length : 0;

    if (frenchScore > 3 && frenchScore > latinScore) {
      return 'french';
    }
    if (latinScore > 3 && latinScore > frenchScore) {
      return 'latin';
    }
  }

  if (langLower === 'auto') return 'auto';

  // Default if text has French accents
  if (sampleText && /[éèêàçùôî]/.test(sampleText)) {
    return 'french';
  }

  return 'french';
}

/**
 * Cleans raw text while preserving line breaks and paragraph spacing.
 */
export function cleanAndSanitizeText(rawText: string): string {
  if (!rawText) return "";
  return rawText
    .replace(/[\uE000-\uF8FF\uFFF0-\uFFFF]/g, "") // Private Use Area glyph symbols
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ") // Unprintable control chars
    .replace(/%PDF-[0-9.]+/gi, "")
    .replace(/\d+\s+\d+\s+obj[\s\S]*?endobj/gi, "")
    .replace(/stream[\s\S]*?endstream/gi, "")
    .replace(/xref[\s\S]*?trailer/gi, "")
    .replace(/startxref[\s\S]*/gi, "")
    .replace(/[ \t]+/g, " ") // Collapse multiple spaces on a line, but keep \n
    .replace(/(\r?\n){3,}/g, "\n\n") // Max 2 consecutive newlines
    .trim();
}

/**
 * Ensures text or XHTML is properly structured into formatted <p> paragraphs,
 * breaking up large unbroken walls of text.
 */
export function textToXhtmlParagraphs(text: string): string {
  if (!text) return "<p>Document content empty.</p>";

  // Unescape any escaped HTML tags (e.g. &lt;p&gt; -> <p>)
  let unescaped = text
    .replace(/&lt;([a-zA-Z1-6\/]+)&gt;/g, "<$1>")
    .replace(/&amp;/g, "&");

  // If text already has multiple HTML block tags, return it cleaned
  if (/<(p|h[1-6]|div|blockquote|ul|ol|section|figure|figcaption|img|image|svg)\b/i.test(unescaped)) {
    return unescaped.trim();
  }

  // Remove single line HTML tags if invalid
  const plainText = unescaped.replace(/<[^>]*>/g, "").trim();

  // Split text by double newlines or multiple newlines
  const blocks = plainText
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length > 1) {
    return blocks.map((b) => `<p>${b}</p>`).join("\n");
  }

  // If single block, check if single newlines exist
  const lines = plainText.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    const grouped: string[] = [];
    let currentPara: string[] = [];

    for (const line of lines) {
      currentPara.push(line);
      if (line.endsWith(".") || line.endsWith("!") || line.endsWith("?") || currentPara.length >= 4) {
        grouped.push(`<p>${currentPara.join(" ")}</p>`);
        currentPara = [];
      }
    }
    if (currentPara.length > 0) {
      grouped.push(`<p>${currentPara.join(" ")}</p>`);
    }
    return grouped.join("\n");
  }

  // Fallback for massive single line of text: chunk into ~350 character sentence paragraphs
  const sentences = plainText.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [plainText];
  const paras: string[] = [];
  let currentP = "";

  for (const sentence of sentences) {
    currentP += sentence + " ";
    if (currentP.length >= 350) {
      paras.push(`<p>${currentP.trim()}</p>`);
      currentP = "";
    }
  }
  if (currentP.trim()) {
    paras.push(`<p>${currentP.trim()}</p>`);
  }

  return paras.length > 0 ? paras.join("\n") : `<p>${plainText}</p>`;
}

/**
 * Automatically splits monolithic text into chapters if chapter titles exist.
 */
export function splitTextIntoChapters(fullText: string, defaultTitle: string): { title: string; originalXhtml: string }[] {
  const chapterMarkerRegex = /(?:^|\n|<p>|<h[1-6]>)\s*((?:CHAPITRE|CHAPTER|Chapitre|Chapter|LIVRE|BOOK|PARTIE|PART)\s+[0-9IVXLCDM]+[^\n<]*)(?:<\/p>|<\/h[1-6]>|\n|$)/gi;

  const matches = Array.from(fullText.matchAll(chapterMarkerRegex));

  if (matches.length >= 2) {
    const chapters: { title: string; originalXhtml: string }[] = [];

    const firstIndex = matches[0].index || 0;
    if (firstIndex > 100) {
      const introText = fullText.substring(0, firstIndex).trim();
      if (introText) {
        chapters.push({
          title: 'Front Matter / Introduction',
          originalXhtml: textToXhtmlParagraphs(introText)
        });
      }
    }

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const startPos = match.index || 0;
      const endPos = i < matches.length - 1 ? (matches[i + 1].index || fullText.length) : fullText.length;

      const rawTitle = match[1] ? match[1].replace(/<[^>]*>/g, '').trim() : `${defaultTitle} - Section ${i + 1}`;
      const rawContent = fullText.substring(startPos, endPos).trim();

      chapters.push({
        title: rawTitle,
        originalXhtml: textToXhtmlParagraphs(rawContent)
      });
    }

    return chapters;
  }

  return [{
    title: defaultTitle,
    originalXhtml: textToXhtmlParagraphs(fullText)
  }];
}
