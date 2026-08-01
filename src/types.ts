export type SourceLanguage = 'latin' | 'greek' | 'french' | 'auto';

export type AuthorVoiceStyle = 
  | 'faithful_scholarly'  // High academic precision, preserving original rhetorical rhythm
  | 'modern_eloquent'     // Accessible modern English while retaining literary elegance
  | 'literal_literary'    // Close line-by-line fidelity to word placement
  | 'victorian_classic';  // 19th century classic English literary style

export interface Chapter {
  id: string;
  title: string;
  originalXhtml: string;
  translatedXhtml: string;
  originalWordCount: number;
  translatedWordCount: number;
  sentenceCountOriginal: number;
  sentenceCountTranslated: number;
  status: 'pending' | 'translating' | 'completed' | 'error';
  errorMessage?: string;
  glossaryNotes?: Array<{ term: string; translation: string; note: string }>;
}

export interface BookAnnotation {
  id: string;
  selectedText: string;
  pane: 'source' | 'target';
  chapterId: string;
  chapterTitle: string;
  type: 'dictionary' | 'footnote' | 'historical_character' | 'foreign_idiom' | 'custom_note';
  title: string;
  explanationOrDefinition: string;
  historicalDetails?: string;
  createdAt: string;
}

export interface EbookProject {
  id: string;
  title: string;
  author: string;
  sourceLanguage: SourceLanguage;
  era: string;
  description: string;
  cssContent: string;
  chapters: Chapter[];
  annotations?: BookAnnotation[];
  images?: Record<string, string>; // Key: image relative path or filename, Value: base64 Data URI
  createdAt: string;
  updatedAt: string;
}

export interface TranslationOptions {
  sourceLanguage: SourceLanguage;
  authorVoiceStyle: AuthorVoiceStyle;
  preserveTags: boolean;
  preserveCssClasses: boolean;
  includeGlossaryNotes: boolean;
  sentenceFidelity: boolean;
  contextualToneNotes?: string;
}

export interface TextEdition {
  editionType: 'original_first' | 'author_revised_latest';
  editionTitle: string;
  year: string;
  publisher: string;
  authorInputNotes: string;
  authenticityScore: number; // e.g. 99%
  variantsCount: number;
  chapters: Array<{
    title: string;
    originalXhtml: string;
    textualNotes?: string[];
  }>;
}

export interface ClassicalBookSearchResult {
  id: string;
  title: string;
  author: string;
  sourceLanguage: SourceLanguage;
  era: string;
  sourceLibrary: 'Gallica (BnF)' | 'Perseus Digital Library' | 'Project Gutenberg' | 'Wikisource Classical';
  description: string;
  coverStyle: string;
  originalEdition: TextEdition;
  latestAuthorRevisedEdition: TextEdition;
  chapters: Array<{
    title: string;
    originalXhtml: string;
  }>;
}

export interface WordCountReport {
  bookTitle: string;
  author: string;
  sourceLanguage: SourceLanguage;
  totalOriginalWords: number;
  totalTranslatedWords: number;
  overallWordCountDelta: number; // percentage
  overallWordCountDiff: number; // raw difference
  totalOriginalSentences: number;
  totalTranslatedSentences: number;
  chapterReports: Array<{
    chapterId: string;
    chapterTitle: string;
    originalWords: number;
    translatedWords: number;
    diff: number;
    deltaPercent: number;
    originalSentences: number;
    translatedSentences: number;
  }>;
}

export interface BatchChapterResult {
  chapterId: string;
  chapterTitle: string;
  status: 'completed' | 'error';
  originalWordCount: number;
  translatedWordCount: number;
  attemptsUsed: number;
  errorMessage?: string;
}

export interface BatchTranslationSummary {
  totalChapters: number;
  successfulCount: number;
  failedCount: number;
  chapterResults: BatchChapterResult[];
  completedAt: string;
}

export interface ActiveOperationProgress {
  id: string;
  type: 'translation' | 'download';
  title: string;
  detail: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  sectionTitle?: string;
  sectionProgressPercent?: number;
  isFinished: boolean;
  format?: string;
  startedAt: string;
}

export interface OperationStartedNotice {
  id: string;
  title: string;
  message: string;
  type: 'translation' | 'download';
  timestamp: string;
}

