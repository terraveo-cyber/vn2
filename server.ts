import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as pdfParseModule from "pdf-parse";
import { SAMPLE_CLASSICAL_LIBRARY } from "./src/data/classicalBooks.js";
import { detectOrNormalizeLanguage, textToXhtmlParagraphs, splitTextIntoChapters } from "./src/utils/languageDetector.js";

function cleanAndSanitizeText(rawText: string): string {
  if (!rawText) return "";
  return rawText
    .replace(/[\uE000-\uF8FF\uFFF0-\uFFFF]/g, "") // Private Use Area glyph symbols from broken font CMaps
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ") // Unprintable control chars
    .replace(/%PDF-[0-9.]+/gi, "")
    .replace(/\d+\s+\d+\s+obj[\s\S]*?endobj/gi, "")
    .replace(/stream[\s\S]*?endstream/gi, "")
    .replace(/xref[\s\S]*?trailer/gi, "")
    .replace(/startxref[\s\S]*/gi, "")
    .replace(/[ \t]+/g, " ") // Collapse spaces on same line while preserving newlines
    .replace(/(\r?\n){3,}/g, "\n\n")
    .trim();
}

async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
  try {
    let pdfFn: any = (pdfParseModule as any).default || pdfParseModule;
    if (typeof pdfFn !== "function" && typeof (pdfParseModule as any) === "function") {
      pdfFn = pdfParseModule;
    }
    if (typeof pdfFn !== "function") {
      try {
        pdfFn = require("pdf-parse");
      } catch {
        // ignore
      }
    }
    if (typeof pdfFn !== "function" && pdfFn && typeof pdfFn.default === "function") {
      pdfFn = pdfFn.default;
    }
    if (typeof pdfFn === "function") {
      const parsed = await pdfFn(pdfBuffer);
      const rawText = parsed?.text || "";
      const cleaned = cleanAndSanitizeText(rawText);

      // Check ratio of readable words to avoid feeding garbled font symbols to Gemini or output
      const words = cleaned.split(/\s+/).filter(Boolean);
      if (words.length > 5) {
        const readableWords = words.filter(w => /^[\p{L}\p{N}.,;:'"?!\-()]+$/u.test(w) && w.length >= 2);
        if (readableWords.length / words.length < 0.4) {
          console.warn("[PDF Text Extraction] Extracted text layer contains unreadable font glyph symbols. Bypassing text layer in favor of Visual PDF OCR.");
          return "";
        }
      }

      return cleaned;
    }
  } catch (err) {
    console.warn("[PDF Text Extraction Warning]", err);
  }
  return "";
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));

  // Initialize Gemini Client using Vertex AI
  const ai = new GoogleGenAI({
    vertexai: true,
    project: process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "9dcf0bb9-608e-4115-b23a-e9189128a939",
    location: process.env.GCP_LOCATION || "us-central1",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // Helper function to call Gemini with multi-model fallback & exponential retry for rate limits (429)
  const FALLBACK_MODELS = [
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.1-pro-preview",
  ];

  async function callGeminiWithFallback<T>(
    makeCall: (model: string) => Promise<T>,
    maxRetriesPerModel = 1
  ): Promise<T> {
    let lastError: any = null;

    for (const model of FALLBACK_MODELS) {
      let attempt = 0;
      while (attempt <= maxRetriesPerModel) {
        try {
          return await makeCall(model);
        } catch (err: any) {
          lastError = err;

          const isNotFound =
            err?.status === 404 ||
            err?.message?.includes("NOT_FOUND") ||
            err?.message?.includes("no longer available");

          if (isNotFound) {
            console.warn(`[Gemini Model ${model} Not Found / Unavailable] Switching to next model...`);
            break; // Try next model in list
          }

          const isSpendingCap =
            err?.message?.includes("spending cap") ||
            err?.message?.includes("spend cap") ||
            err?.message?.includes("exceeded its monthly spending cap");

          if (isSpendingCap) {
            console.warn(`[Gemini Spending Cap on ${model}] Switching to next fallback model...`);
            break; // Immediately try next fallback model
          }

          const isRateLimit =
            err?.status === 429 ||
            err?.message?.includes("RESOURCE_EXHAUSTED") ||
            err?.message?.includes("429") ||
            err?.message?.includes("quota");

          if (isRateLimit) {
            attempt++;
            const isQuotaExceeded =
              err?.message?.includes("limit: 0") ||
              err?.message?.includes("PerDay") ||
              err?.message?.includes("free_tier_requests");

            if (isQuotaExceeded) {
              console.warn(`[Gemini Quota Exceeded on ${model}] Switching to next model in fallback list...`);
              break; // Switch model immediately
            }

            if (attempt <= maxRetriesPerModel) {
              let delayMs = Math.pow(2, attempt) * 1500;
              const match = err?.message?.match(/retry in ([0-9.]+)s/i);
              if (match && match[1]) {
                const suggestedDelay = Math.ceil(parseFloat(match[1]) * 1000);
                delayMs = Math.min(suggestedDelay + 500, 5000);
              }
              console.warn(`[Gemini Rate Limit on ${model}] Retrying attempt ${attempt}/${maxRetriesPerModel} in ${delayMs}ms...`);
              await new Promise((resolve) => setTimeout(resolve, delayMs));
            } else {
              console.warn(`[Gemini Model ${model} Max Retries Exceeded] Switching to next fallback model...`);
              break;
            }
          } else {
            throw err;
          }
        }
      }
    }

    throw lastError || new Error("All Gemini fallback models exhausted or rate limited.");
  }

  // Robust JSON parser for Gemini responses that strips markdown code blocks and handles raw fallback text
  function parseGeminiJson<T = any>(rawText: string, fallbackExtractor?: (text: string) => T): T {
    if (!rawText || typeof rawText !== "string") {
      return (fallbackExtractor ? fallbackExtractor("") : {}) as T;
    }

    const trimmed = rawText.trim();

    // 1. Strip markdown code fences (```json ... ``` or ```html ... ```)
    const stripped = trimmed
      .replace(/^```(?:json|html|xml|text)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // 2. Direct JSON.parse
    try {
      return JSON.parse(stripped);
    } catch {
      // Continue
    }

    // 3. Extract JSON object/array with regex if surrounding text exists
    const jsonMatch = stripped.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Continue
      }
    }

    // 4. Fallback extractor if Gemini returned raw text/XHTML directly
    if (fallbackExtractor) {
      return fallbackExtractor(stripped);
    }

    return {} as T;
  }

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Search Classical Library Endpoint
  app.get("/api/search-classical-library", (req, res) => {
    const query = (req.query.q as string || "").toLowerCase().trim();
    const lang = (req.query.lang as string || "").toLowerCase().trim();

    let results = SAMPLE_CLASSICAL_LIBRARY;

    if (lang && lang !== "all" && lang !== "auto") {
      results = results.filter((item) => item.sourceLanguage === lang);
    }

    if (query) {
      results = results.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.author.toLowerCase().includes(query) ||
          item.era.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    res.json({ results });
  });

  // Tag-Preserving Translation Endpoint
  app.post("/api/translate", async (req, res) => {
    try {
      const {
        originalXhtml,
        sourceLanguage = "latin",
        authorVoiceStyle = "modern_eloquent",
        preserveTags = true,
        preserveCssClasses = true,
        contextualToneNotes = "",
      } = req.body;

      if (!originalXhtml || typeof originalXhtml !== "string") {
        return res.status(400).json({ error: "originalXhtml string is required." });
      }

      const voiceDescriptions: Record<string, string> = {
        faithful_scholarly:
          "Provide a rigorous scholarly academic translation with high precision, keeping the original rhetorical rhythm, syntax weight, and exact term equivalences.",
        modern_eloquent:
          "Translate into clean, natural, fluid Modern English that flows smoothly for contemporary readers while preserving the original author's dignity, intellectual gravity, and literary elegance.",
        literal_literary:
          "Follow a close line-by-line word order and literal structural translation, reflecting the precise phrase construction of the original manuscript.",
        victorian_classic:
          "Render in a classic 19th-century Victorian/Regency English literary register (elevated vocabulary, formal sentence cadence).",
      };

      const voiceGuide = voiceDescriptions[authorVoiceStyle] || voiceDescriptions.modern_eloquent;

      const systemInstruction = `You are a master philologist and ebook translation engine specializing in translating historical manuscripts and classical literature from Archaic Latin, Ancient Greek, and French (16th-19th Century) to Modern English.

CRITICAL MANDATES & CONSTRAINTS:
1. ABSOLUTELY DO NOT SUMMARIZE. Perform a full, sentence-by-sentence, authentic translation of the entire input text for a reader.
2. STRICT TAG & CSS CLASS PRESERVATION:
   - You MUST leave ALL HTML / XHTML tags (<p>, <img>, <image>, <figure>, <figcaption>, <svg>, <span class="...">, <h1>-<h6>, <em>, <i>, <blockquote class="...">, <cite>, <ul/ol/li>, <strong class="...">, <div id="...">, etc.) EXACTLY in their original structural positions.
   - DO NOT alter, remove, or delete any image tags (<img>, <image>, <figure>, <figcaption>, <svg>) or their image source attributes (src, alt, href, xlink:href, class, id, style).
   - Translate ONLY the inner text content between the HTML tags or inside figure captions / alt texts.
3. AUTHOR VOICE & AUTHENTICITY:
   - Preserve the true authenticity of the author, their writing style, tone, and sentence cadence.
   - ${voiceGuide}
   - ${contextualToneNotes ? `Additional tone instruction: ${contextualToneNotes}` : ""}
4. GLOSSARY & NOTES:
   - Extract up to 3 notable archaic terms, philosophical concepts, or historical references that benefit from an explanatory note.

Respond strictly in valid JSON matching the requested schema.`;

      const prompt = `Source Language: ${sourceLanguage}
XHTML Input Content to Translate:
\`\`\`html
${originalXhtml}
\`\`\`

Translate the text content inside the HTML markup into Modern English while keeping ALL HTML tags, CSS classes, and attributes completely intact. Return the result in JSON format.`;

      const response = await callGeminiWithFallback((model) =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                translatedXhtml: {
                  type: Type.STRING,
                  description: "The complete translated XHTML with all original HTML tags, IDs, and CSS classes preserved.",
                },
                originalWordCount: {
                  type: Type.INTEGER,
                  description: "Estimated word count of the original input text.",
                },
                translatedWordCount: {
                  type: Type.INTEGER,
                  description: "Word count of the translated English output text.",
                },
                glossaryNotes: {
                  type: Type.ARRAY,
                  description: "Key archaic terms, idioms, or historical glosses.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING },
                      translation: { type: Type.STRING },
                      note: { type: Type.STRING },
                    },
                    required: ["term", "translation", "note"],
                  },
                },
              },
              required: ["translatedXhtml", "originalWordCount", "translatedWordCount"],
            },
          },
        })
      );

      const responseText = response.text || "";
      const data = parseGeminiJson(responseText, (raw) => {
        const cleanContent = raw.startsWith("<")
          ? raw
          : raw.split(/\n\s*\n+/).map((p) => `<p>${p.trim()}</p>`).join("\n");
        return {
          translatedXhtml: cleanContent || originalXhtml,
          originalWordCount: originalXhtml.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length,
          translatedWordCount: (cleanContent || originalXhtml).replace(/<[^>]*>/g, " ").trim().split(/\s+/).length,
          glossaryNotes: [],
        };
      });

      return res.json({
        translatedXhtml: data.translatedXhtml || originalXhtml,
        originalWordCount: data.originalWordCount || originalXhtml.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length,
        translatedWordCount: data.translatedWordCount || (data.translatedXhtml ? data.translatedXhtml.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length : 0),
        glossaryNotes: data.glossaryNotes || [],
      });
    } catch (err: any) {
      console.error("[/api/translate Error]", err);
      return res.status(500).json({
        error: "Translation failed",
        message: err.message || "An unexpected error occurred during translation.",
      });
    }
  });

  // Dictionary Lookup Endpoint (Google / Gemini English Lookup)
  app.post("/api/dictionary-lookup", async (req, res) => {
    try {
      const { word, context = "", sourceLanguage = "latin" } = req.body;

      if (!word || typeof word !== "string") {
        return res.status(400).json({ error: "Word parameter is required." });
      }

      const prompt = `You are a philological dictionary and historical encyclopedia engine.
Search and provide an English dictionary definition and philological analysis for the selected text: "${word}".
Source Language / Context: ${sourceLanguage} (Context phrase: "${context}")

REQUIRED OUTPUT FORMAT (JSON):
- term: string (exact term or normalized form)
- englishDefinition: string (clear English definition and explanation)
- partOfSpeech: string (e.g. Noun, Verb, Foreign Phrase, Historical Figure, Philosophical Term)
- etymology: string (origin and root words)
- contextualNuance: string (how this term functions in classical Latin/Greek/French literature)
- historicalCharacterInfo: optional string (if this refers to or relates to a historical figure, give key historical dates and significance)`;

      const response = await callGeminiWithFallback((model) =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                englishDefinition: { type: Type.STRING },
                partOfSpeech: { type: Type.STRING },
                etymology: { type: Type.STRING },
                contextualNuance: { type: Type.STRING },
                historicalCharacterInfo: { type: Type.STRING },
              },
              required: ["term", "englishDefinition", "partOfSpeech", "etymology", "contextualNuance"],
            },
          },
        })
      );

      const data = parseGeminiJson(response.text || "{}");
      return res.json(data);
    } catch (err: any) {
      console.error("[/api/dictionary-lookup Error]", err);
      return res.status(500).json({
        error: "Dictionary lookup failed",
        message: err.message || "Failed to look up dictionary definition.",
      });
    }
  });

  // Auto-Detect & Suggest Annotations / Footnotes Endpoint
  app.post("/api/suggest-annotations", async (req, res) => {
    try {
      const { xhtmlContent, chapterTitle = "Chapter", bookTitle = "Book", sourceLanguage = "latin", era = "" } = req.body;

      if (!xhtmlContent || typeof xhtmlContent !== "string") {
        return res.status(400).json({ error: "xhtmlContent is required." });
      }

      // Strip HTML tags for clean text analysis
      const plainText = xhtmlContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      const sampleText = plainText.substring(0, 15000); // sample up to 15,000 chars

      const prompt = `You are a world-class philologist, historian, and classical annotator.
TASK:
Analyze the provided text passage from "${bookTitle}" (${chapterTitle}, Language: ${sourceLanguage}, Era: ${era}).
Automatically identify and extract key terms, historical figures, geographical places, historical events, classical idioms, and specialized vocabulary that warrant scholarly footnotes, dictionary definitions, or historical annotations.

PASSAGE TEXT:
"""
${sampleText}
"""

INSTRUCTIONS:
1. Identify 8 to 15 key entities (Names/Historical Figures, Geographical Places, Historical Events, Classical Vocabulary/Terms, Foreign Idioms).
2. For each item, classify into one of the categories:
   - "Historical Figure" (type: "historical_character")
   - "Geographical Place" (type: "footnote")
   - "Historical Event" (type: "footnote")
   - "Classical Term" (type: "dictionary")
   - "Foreign Idiom" (type: "foreign_idiom")
3. Provide a clear, concise English definition or explanation.
4. Provide historical context, dates, significance, or geographic location details.
5. Provide the exact text phrase as it appears in the passage (selectedText).

Return valid JSON matching the schema.`;

      const response = await callGeminiWithFallback((model) =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                suggestions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      selectedText: { type: Type.STRING },
                      type: { type: Type.STRING },
                      category: { type: Type.STRING },
                      explanationOrDefinition: { type: Type.STRING },
                      historicalDetails: { type: Type.STRING },
                    },
                    required: ["title", "selectedText", "type", "category", "explanationOrDefinition"],
                  },
                },
              },
              required: ["suggestions"],
            },
          },
        })
      );

      const data = parseGeminiJson(response.text || "{}");
      return res.json({ suggestions: data.suggestions || [] });
    } catch (err: any) {
      console.error("[/api/suggest-annotations Error]", err);
      return res.status(500).json({
        error: "Suggest annotations failed",
        message: err.message || "Failed to generate annotation suggestions.",
      });
    }
  });

  // Fetch Online Book URL Endpoint
  app.post("/api/fetch-book-url", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL is required." });
      }

      let fetchedHtml = "";
      try {
        const fetchRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 VerbaNova/2.4" } });
        if (fetchRes.ok) {
          fetchedHtml = await fetchRes.text();
        }
      } catch (e) {
        console.log("Direct URL fetch failed, using AI parser on link meta:", e);
      }

      const prompt = `Analyze this online ebook link / content from Gutenberg or digital manuscript archives:
URL: ${url}
${fetchedHtml ? `HTML Snippet (first 2000 chars):\n${fetchedHtml.substring(0, 2000)}` : "Generate a classical book project structure based on the URL reference."}

Extract or create a structured Ebook Project with:
- title: string
- author: string
- sourceLanguage: 'latin' | 'greek' | 'french' | 'auto'
- era: string
- description: string
- chapters: Array of { title: string, originalXhtml: string }

Respond in JSON matching schema.`;

      const response = await callGeminiWithFallback((model) =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                author: { type: Type.STRING },
                sourceLanguage: { type: Type.STRING },
                era: { type: Type.STRING },
                description: { type: Type.STRING },
                chapters: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      originalXhtml: { type: Type.STRING },
                    },
                    required: ["title", "originalXhtml"],
                  },
                },
              },
              required: ["title", "author", "sourceLanguage", "era", "description", "chapters"],
            },
          },
        })
      );

      const data = parseGeminiJson(response.text || "{}");
      return res.json(data);
    } catch (err: any) {
      console.error("[/api/fetch-book-url Error]", err);
      return res.status(500).json({
        error: "Failed to fetch book from link",
        message: err.message || "Could not retrieve online file.",
      });
    }
  });

  // PDF Document Parsing Endpoint
  app.post("/api/parse-pdf", async (req, res) => {
    try {
      const { pdfBase64, fileName = "Document.pdf" } = req.body;

      if (!pdfBase64 || typeof pdfBase64 !== "string") {
        return res.status(400).json({ error: "pdfBase64 is required." });
      }

      const cleanBase64 = pdfBase64.replace(/^data:[^;]+;base64,/, "").trim();
      const pdfBuffer = Buffer.from(cleanBase64, "base64");

      // Extract text directly using pdf-parse engine
      const extractedText = await extractPdfText(pdfBuffer);
      const hasExtractedText = extractedText.length > 20;

      const prompt = `You are a world-class classical document transcription engine and Philological OCR parser.
TASK:
Analyze the attached PDF file ("${fileName}") and transcribe its entire text content accurately into structured XHTML paragraphs.

${hasExtractedText ? `EXTRACTED REFERENCE TEXT:\n"""\n${extractedText.substring(0, 30000)}\n"""\n` : ''}

INSTRUCTIONS:
1. Visually transcribe and structure ALL text content accurately into semantic XHTML tags (<p>, <h1>, <h2>, <h3>, <blockquote>, <ul/ol/li>). Wrap EVERY paragraph inside a separate <p> tag. Do NOT output all text on a single line.
2. Do NOT output raw PDF binary tokens (%PDF-1.x, obj, stream, etc.), font glyph symbols (e.g. Private Use Area symbols), or unprintable characters.
3. Group text into logical chapters or sections. If the PDF contains distinct chapters (e.g. Chapitre I, Chapitre II, Chapter 1, etc.), divide them into separate chapter items in the chapters array.
4. Detect the primary source language accurately ('french', 'latin', 'greek', or 'auto'). Examine text vocabulary: for French (e.g. 'le', 'la', 'les', 'des', 'du', 'et', 'est', 'dans', 'pour', 'que', 'chapitre'), set sourceLanguage to "french".
5. Identify book title, author, and historical era if present.

Return valid JSON response matching the schema.`;

      let responseText = "";
      try {
        const response = await callGeminiWithFallback((model) =>
          ai.models.generateContent({
            model,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: cleanBase64,
                  },
                },
                { text: prompt },
              ],
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  author: { type: Type.STRING },
                  sourceLanguage: { 
                    type: Type.STRING,
                    description: "Primary language of text. Must be 'french', 'latin', 'greek', or 'auto'."
                  },
                  era: { type: Type.STRING },
                  description: { type: Type.STRING },
                  chapters: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        originalXhtml: { type: Type.STRING, description: "Structured XHTML paragraphs (<p>, <h1>, etc.) for this chapter." },
                      },
                      required: ["title", "originalXhtml"],
                    },
                  },
                },
                required: ["title", "chapters", "sourceLanguage"],
              },
            },
          })
        );
        responseText = response.text || "";
      } catch (geminiErr) {
        console.warn("[Gemini PDF Parse Warning]", geminiErr);
      }

      let data: any = {};
      if (responseText) {
        data = parseGeminiJson(responseText);
      }

      // If Gemini returned valid chapters, format into clean paragraphs & detect language
      if (data.chapters && Array.isArray(data.chapters) && data.chapters.length > 0) {
        const sanitizedChapters = data.chapters.map((ch: any, idx: number) => {
          let cleanContent = textToXhtmlParagraphs(ch.originalXhtml || "");

          return {
            title: ch.title || `Chapter ${idx + 1}`,
            originalXhtml: cleanContent || '<p>Text transcribed from PDF document.</p>'
          };
        });

        const fullSampleText = sanitizedChapters.map(c => c.originalXhtml).join(' ');
        const resolvedLang = detectOrNormalizeLanguage(data.sourceLanguage, fullSampleText);

        return res.json({
          title: data.title || fileName.replace(/\.[^/.]+$/, ''),
          author: data.author || 'Classical Author',
          sourceLanguage: resolvedLang,
          era: data.era || 'PDF Digitized Edition',
          description: data.description || `Digitized PDF document: ${fileName}`,
          chapters: sanitizedChapters
        });
      }

      // FALLBACK: If Gemini API was unavailable, but pdf-parse extracted text
      if (hasExtractedText) {
        const docTitle = fileName.replace(/\.[^/.]+$/, '');
        const resolvedLang = detectOrNormalizeLanguage(undefined, extractedText);
        const rawChapters = splitTextIntoChapters(extractedText, docTitle);

        return res.json({
          title: docTitle,
          author: 'Classical Author',
          sourceLanguage: resolvedLang,
          era: 'PDF Digitized Document',
          description: `Extracted text from ${fileName}`,
          chapters: rawChapters.map(ch => ({
            title: ch.title,
            originalXhtml: textToXhtmlParagraphs(ch.originalXhtml)
          }))
        });
      }

      return res.status(500).json({ error: "Could not extract text from PDF document." });
    } catch (err: any) {
      console.error("[/api/parse-pdf Error]", err);
      return res.status(500).json({
        error: "PDF parsing failed",
        message: err.message || "Could not parse PDF document.",
      });
    }
  });

  // Semantic OCR Manuscript Scan Endpoint
  app.post("/api/ocr-scan", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/jpeg", targetLanguage = "latin" } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "imageBase64 is required." });
      }

      const cleanBase64Data = imageBase64.replace(/^data:[^;]+;base64,/, "").trim();

      const prompt = `You are a world-renowned paleographer and semantic OCR digitization expert specializing in historical manuscripts and literature in Archaic Latin, Ancient/Classical Greek, and 17th-19th Century French.

TASK:
Analyze this manuscript/book scan document (${targetLanguage.toUpperCase()}).
1. Perform Semantic Optical Character Recognition (OCR) specifically tuned to recognize and interpret nuances in archaic Latin, Greek, and 17th-19th century French typography (e.g. long 's' ſ, ligatures, accent marks, diacritics, uncontracted verb forms, and manuscript contractions).
2. Transcribe the original language text into clean XHTML, preserving original formatting, headings, paragraphs, dropcaps (<span class="dropcap">), blockquotes, and verse breaks. ABSOLUTELY DO NOT output font glyph symbols, Private Use Area symbols, or PDF stream markers.
3. Provide a semantic English translation that captures the author's unique voice, sentence structure, and subtle rhetorical nuances, rather than performing a literal word-for-word translation.
4. Maintain original formatting and stylesheet class structure throughout.

Return valid JSON response matching the schema.`;

      const response = await callGeminiWithFallback((model) =>
        ai.models.generateContent({
          model,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64Data,
                },
              },
              { text: prompt },
            ],
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                detectedLanguage: { type: Type.STRING },
                extractedXhtml: { type: Type.STRING },
                semanticEnglishTranslation: { type: Type.STRING },
                confidenceScore: { type: Type.NUMBER },
                paleographyNotes: { type: Type.STRING },
              },
              required: ["detectedLanguage", "extractedXhtml", "semanticEnglishTranslation"],
            },
          },
        })
      );

      const responseText = response.text || "";
      const data = parseGeminiJson(responseText);

      if (data.extractedXhtml) {
        data.extractedXhtml = cleanAndSanitizeText(data.extractedXhtml);
      }

      return res.json(data);
    } catch (err: any) {
      console.error("[/api/ocr-scan Error]", err);
      return res.status(500).json({
        error: "Semantic OCR scan failed",
        message: err.message || "Could not extract text from manuscript image.",
      });
    }
  });

  // Vite development or static production setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ebook Translator Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
