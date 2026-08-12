import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { StudioEditor } from './components/StudioEditor';
import { ClassicalLibrary } from './components/ClassicalLibrary';
import { ManuscriptOcrScan } from './components/ManuscriptOcrScan';
import { WordCountReportView } from './components/WordCountReportView';
import { AnnotationsView } from './components/AnnotationsView';
import { ExportEbookModal } from './components/ExportEbookModal';
import { TranslationSummaryModal } from './components/TranslationSummaryModal';
import { StartOperationOverlay } from './components/StartOperationOverlay';
import { ActiveProgressStatusBar } from './components/ActiveProgressStatusBar';
import { IlluminatedLogo } from './components/IlluminatedLogo';
import { INITIAL_PROJECT } from './data/classicalBooks';
import { 
  EbookProject, 
  TranslationOptions, 
  BatchChapterResult, 
  BatchTranslationSummary,
  ActiveOperationProgress,
  OperationStartedNotice
} from './types';
import { 
  getBackupPoints, 
  pushBackupPoint, 
  clearAllBackupPoints, 
  BackupPoint 
} from './utils/sessionCache';
import { RestoreBackupModal } from './components/RestoreBackupModal';
import { ContactDirectoryModal } from './components/ContactDirectoryModal';
import { MancalaSolver } from './components/MancalaSolver';
import { HardDrive, RotateCcw, X, Check, Save, Mail, Globe, ExternalLink, Smartphone, Wrench, PenTool, Accessibility, BookOpen } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'editor' | 'library' | 'ocr' | 'analytics' | 'annotations' | 'mancala'>('editor');
  const [project, setProject] = useState<EbookProject>(INITIAL_PROJECT);
  
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translatingChapterId, setTranslatingChapterId] = useState<string | null>(null);

  // Pause / Resume state for Batch Translation
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const pauseResolverRef = useRef<(() => void) | null>(null);

  const handlePauseTranslation = () => {
    setIsPaused(true);
    isPausedRef.current = true;
  };

  const handleResumeTranslation = () => {
    setIsPaused(false);
    isPausedRef.current = false;
    if (pauseResolverRef.current) {
      pauseResolverRef.current();
      pauseResolverRef.current = null;
    }
  };

  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // 5 Backup Points & Session Cache State
  const [backupPoints, setBackupPoints] = useState<BackupPoint[]>([]);
  const [showRestoreModal, setShowRestoreModal] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [restoredNotice, setRestoredNotice] = useState<string | null>(null);
  const isInitialMount = useRef<boolean>(true);

  // Active Progress & Operation Started Notice Overlay
  const [startNotice, setStartNotice] = useState<OperationStartedNotice | null>(null);
  const [activeProgress, setActiveProgress] = useState<ActiveOperationProgress | null>(null);

  // Batch Translation Summary modal state
  const [batchSummary, setBatchSummary] = useState<BatchTranslationSummary | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [currentOptions, setCurrentOptions] = useState<TranslationOptions>({
    sourceLanguage: 'latin',
    authorVoiceStyle: 'modern_eloquent',
    preserveTags: true,
    preserveCssClasses: true,
    includeGlossaryNotes: true,
    sentenceFidelity: true,
  });

  const handleStartDownload = (format: string, fileName: string) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    setStartNotice({
      id: `dl-notice-${Date.now()}`,
      title: 'Ebook Download Initiated',
      message: `Compiling ${format.toUpperCase()} ebook edition "${fileName}". Packaging chapter manifests, CSS styles, and annotations...`,
      type: 'download',
      timestamp: timeNow,
    });

    setActiveProgress({
      id: `dl-prog-${Date.now()}`,
      type: 'download',
      title: `Exporting ${format.toUpperCase()} Ebook`,
      detail: `Generated file "${fileName}" delivered to your browser downloads folder.`,
      currentStep: 1,
      totalSteps: 1,
      completedSteps: 1,
      failedSteps: 0,
      isFinished: true,
      startedAt: timeNow,
    });
  };

  // On Mount: Rehydrate state from latest of up to 5 Backup Points
  useEffect(() => {
    const points = getBackupPoints();
    setBackupPoints(points);
    if (points.length > 0) {
      const latest = points[0];
      setProject(latest.project);
      if (latest.activeTab) setActiveTab(latest.activeTab);
      if (latest.currentOptions) setCurrentOptions(latest.currentOptions);
      if (latest.batchSummary) setBatchSummary(latest.batchSummary);

      const timeFormatted = new Date(latest.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedAt(timeFormatted);
      setRestoredNotice(`Active session rehydrated from Backup Point #1 (${timeFormatted})`);
    } else {
      // Save initial backup point #1
      const initialPoints = pushBackupPoint(INITIAL_PROJECT, 'editor', 'Initial Classical Book Loaded', true);
      setBackupPoints(initialPoints);
    }
  }, []);

  // Auto-save into rolling 5 backup points cache whenever project, activeTab, or currentOptions change (debounced 1.5s)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const updated = pushBackupPoint(project, activeTab, 'Auto-Saved Session Point', true, currentOptions, batchSummary);
      setBackupPoints(updated);
      if (updated.length > 0) {
        const timeFormatted = new Date(updated[0].savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSavedAt(timeFormatted);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [project, activeTab, currentOptions, batchSummary]);

  // Manual Session Snapshot Save (Pushes a distinct Manual Backup Point to 5-slot ring buffer)
  const handleSaveSnapshot = () => {
    const translatedCount = project.chapters.filter(c => c.status === 'completed' || !!c.translatedXhtml).length;
    const label = `Manual Checkpoint (${translatedCount}/${project.chapters.length} translated)`;
    const updated = pushBackupPoint(project, activeTab, label, false, currentOptions, batchSummary);
    setBackupPoints(updated);
    if (updated.length > 0) {
      const timeFormatted = new Date(updated[0].savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedAt(timeFormatted);
      setRestoredNotice(`New manual backup point recorded at ${timeFormatted} (Total stored points: ${updated.length}/5)`);
    }
  };

  // Open Restore Selector Modal
  const handleOpenRestoreModal = () => {
    const points = getBackupPoints();
    setBackupPoints(points);
    setShowRestoreModal(true);
  };

  // Restore specific Backup Point selected by user
  const handleSelectRestorePoint = (point: BackupPoint) => {
    setProject(point.project);
    if (point.activeTab) setActiveTab(point.activeTab);
    if (point.currentOptions) setCurrentOptions(point.currentOptions);
    if (point.batchSummary) setBatchSummary(point.batchSummary);

    const timeFormatted = new Date(point.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSavedAt(timeFormatted);
    setShowRestoreModal(false);
    setRestoredNotice(`Project successfully restored to "${point.label || 'Selected Point'}" saved at ${timeFormatted}`);
  };

  // Clear all backup points
  const handleClearBackupPoints = () => {
    clearAllBackupPoints();
    setBackupPoints([]);
    setLastSavedAt(null);
    setShowRestoreModal(false);
    setRestoredNotice('Cleared all backup restore points history.');
  };

  // Clear Active Document (Clears source pane, book chapters, and active project)
  const handleClearActiveDocument = () => {
    setProject({
      id: `project-empty-${Date.now()}`,
      title: 'No Active Document',
      author: 'None',
      sourceLanguage: 'french',
      era: 'N/A',
      description: 'No active document loaded. Upload an EPUB, PDF, TXT, or select a manuscript from the Classical Library.',
      cssContent: 'p { line-height: 1.6; margin-bottom: 0.8em; }',
      chapters: [],
      annotations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setBatchSummary(null);
    setActiveProgress(null);
    setStartNotice({
      id: `clear-notice-${Date.now()}`,
      title: 'Active Document Cleared',
      message: 'Cleared active document, source pane text, and book chapter list.',
      type: 'info',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
  };

  // Calls server-side Gemini translation route with automatic client-side retries (up to 3 times with exponential backoff)
  const handleTranslateChapter = async (
    chapterId: string, 
    options: TranslationOptions,
    overallBatchContext?: { currentStep: number; totalSteps: number; completedSteps: number }
  ): Promise<BatchChapterResult | null> => {
    const chapter = project.chapters.find((c) => c.id === chapterId);
    if (!chapter) return null;

    setCurrentOptions(options);
    setIsTranslating(true);
    setTranslatingChapterId(chapterId);

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setStartNotice({
      id: `notice-trans-${chapterId}-${Date.now()}`,
      title: 'Translation Operation Started',
      message: `Translating "${chapter.title}" using Gemini 3.6 Engine. Preserving XHTML structure, CSS classes, and semantic glossary notes...`,
      type: 'translation',
      timestamp: timeNow,
    });

    const initialCurrentStep = overallBatchContext?.currentStep || 1;
    const initialTotalSteps = overallBatchContext?.totalSteps || 1;
    const initialCompletedSteps = overallBatchContext?.completedSteps || 0;

    setActiveProgress({
      id: `prog-${chapterId}`,
      type: 'translation',
      title: `Translating: ${chapter.title}`,
      detail: `Connecting to Gemini 3.6 Engine & parsing classical ${options.sourceLanguage.toUpperCase()} text...`,
      currentStep: initialCurrentStep,
      totalSteps: initialTotalSteps,
      completedSteps: initialCompletedSteps,
      failedSteps: 0,
      sectionTitle: chapter.title,
      sectionProgressPercent: 15,
      isFinished: false,
      startedAt: timeNow,
      startTimestamp: Date.now(),
    });

    // Update status to translating
    setProject((prev) => ({
      ...prev,
      chapters: prev.chapters.map((c) =>
        c.id === chapterId ? { ...c, status: 'translating', errorMessage: undefined } : c
      ),
    }));

    // Smooth ticker for sectionProgressPercent
    let currentPercent = 15;
    const ticker = setInterval(() => {
      if (currentPercent < 90) {
        currentPercent += Math.floor(Math.random() * 8) + 5;
        if (currentPercent > 90) currentPercent = 90;
        setActiveProgress((prev) => prev ? {
          ...prev,
          sectionTitle: chapter.title,
          sectionProgressPercent: currentPercent,
          detail: `Translating "${chapter.title}" (${currentPercent}%)...`
        } : null);
      }
    }, 400);

    const maxRetries = 3;
    let attempt = 0;
    let lastErrorMsg = '';

    while (attempt <= maxRetries) {
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalXhtml: chapter.originalXhtml,
            sourceLanguage: options.sourceLanguage,
            authorVoiceStyle: options.authorVoiceStyle,
            preserveTags: options.preserveTags,
            preserveCssClasses: options.preserveCssClasses,
            contextualToneNotes: options.contextualToneNotes,
          }),
        });

        if (!response.ok) {
          const resText = await response.text().catch(() => '');
          let errorMsg = `Server returned status ${response.status}`;
          try {
            const errJson = JSON.parse(resText);
            if (errJson.message || errJson.error) {
              errorMsg = errJson.message || errJson.error;
            }
          } catch {
            if (resText.includes('<title>')) {
              const match = resText.match(/<title>(.*?)<\/title>/i);
              if (match) errorMsg = `Server error (${response.status}): ${match[1]}`;
            }
          }
          throw new Error(errorMsg);
        }

        const resText = await response.text();
        let data: any;
        try {
          data = JSON.parse(resText);
        } catch {
          if (resText.trim().startsWith('<')) {
            data = {
              translatedXhtml: resText,
              originalWordCount: chapter.originalXhtml.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length,
              translatedWordCount: resText.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length,
              glossaryNotes: [],
            };
          } else {
            throw new Error('Received non-JSON response from server during translation.');
          }
        }
        clearInterval(ticker);

        setProject((prev) => ({
          ...prev,
          chapters: prev.chapters.map((c) =>
            c.id === chapterId
              ? {
                  ...c,
                  translatedXhtml: data.translatedXhtml,
                  originalWordCount: data.originalWordCount,
                  translatedWordCount: data.translatedWordCount,
                  sentenceCountOriginal: (chapter.originalXhtml.match(/[.!?;:]+(\s|$)/g) || []).length || Math.ceil(data.originalWordCount / 18),
                  sentenceCountTranslated: (data.translatedXhtml.match(/[.!?;:]+(\s|$)/g) || []).length || Math.ceil(data.translatedWordCount / 20),
                  status: 'completed',
                  errorMessage: undefined,
                  glossaryNotes: data.glossaryNotes || [],
                }
              : c
          ),
        }));

        setIsTranslating(false);
        setTranslatingChapterId(null);

        setActiveProgress((prev) => prev ? {
          ...prev,
          sectionTitle: chapter.title,
          sectionProgressPercent: 100,
          detail: `Successfully completed translation for "${chapter.title}".`,
          completedSteps: prev.completedSteps + (overallBatchContext ? 0 : 1),
          isFinished: !overallBatchContext,
        } : null);

        return {
          chapterId,
          chapterTitle: chapter.title,
          status: 'completed',
          originalWordCount: data.originalWordCount || chapter.originalWordCount,
          translatedWordCount: data.translatedWordCount || 0,
          attemptsUsed: attempt + 1,
        };
      } catch (err: any) {
        lastErrorMsg = err.message || 'Translation failed';
        
        const isSpendCapError = 
          lastErrorMsg.toLowerCase().includes('spending cap') || 
          lastErrorMsg.toLowerCase().includes('resource_exhausted') ||
          lastErrorMsg.toLowerCase().includes('spend cap') ||
          lastErrorMsg.toLowerCase().includes('quota');

        attempt++;

        if (isSpendCapError) {
          console.warn(`[Client Translation] Spending cap / quota error detected for chapter "${chapter.title}". Aborting retries.`);
          break;
        }

        if (attempt <= maxRetries) {
          const delayMs = attempt * 3000;
          console.warn(`[Client Retry ${attempt}/${maxRetries}] Chapter ${chapter.title} failed: ${lastErrorMsg}. Retrying in ${delayMs}ms...`);
          
          setActiveProgress((prev) => prev ? {
            ...prev,
            sectionTitle: chapter.title,
            sectionProgressPercent: Math.max(15, currentPercent - 20),
            detail: `[Retry ${attempt}/${maxRetries}] Chapter "${chapter.title}" delayed: ${lastErrorMsg}...`,
          } : null);

          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    clearInterval(ticker);
    console.error(`[Persistent Error] Chapter ${chapter.title} failed after ${maxRetries + 1} attempts: ${lastErrorMsg}`);

    setProject((prev) => ({
      ...prev,
      chapters: prev.chapters.map((c) =>
        c.id === chapterId
          ? {
              ...c,
              status: 'error',
              errorMessage: `[Failed after ${maxRetries + 1} attempts]: ${lastErrorMsg}`,
            }
          : c
      ),
    }));

    setIsTranslating(false);
    setTranslatingChapterId(null);

    setActiveProgress((prev) => prev ? {
      ...prev,
      sectionTitle: chapter.title,
      sectionProgressPercent: 0,
      detail: `Persistent error translating "${chapter.title}": ${lastErrorMsg}`,
      failedSteps: prev.failedSteps + 1,
      isFinished: !overallBatchContext,
    } : null);

    return {
      chapterId,
      chapterTitle: chapter.title,
      status: 'error',
      originalWordCount: chapter.originalWordCount,
      translatedWordCount: 0,
      attemptsUsed: maxRetries + 1,
      errorMessage: lastErrorMsg,
    };
  };

  // Translates all or selected chapters sequentially, skipping completed chapters on resume
  const handleTranslateAllChapters = async (
    options: TranslationOptions, 
    targetChapterIds?: string[], 
    forceRetranslate: boolean = false
  ) => {
    setCurrentOptions(options);
    setIsTranslating(true);
    setIsPaused(false);
    isPausedRef.current = false;
    setTranslatingChapterId(null);

    const candidateChapters = (targetChapterIds && targetChapterIds.length > 0)
      ? project.chapters.filter((c) => targetChapterIds.includes(c.id))
      : project.chapters;

    const totalChaptersInScope = candidateChapters.length;
    const alreadyCompletedChapters = candidateChapters.filter(c => c.status === 'completed' && !!c.translatedXhtml);
    const alreadyCompletedCount = alreadyCompletedChapters.length;

    // Skip already completed chapters unless forceRetranslate is requested
    const chaptersToTranslate = forceRetranslate 
      ? candidateChapters 
      : candidateChapters.filter(c => c.status !== 'completed' || !c.translatedXhtml);

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (chaptersToTranslate.length === 0) {
      // All chapters are already completed!
      setIsTranslating(false);

      setStartNotice({
        id: `notice-complete-${Date.now()}`,
        title: 'All Chapters Already Translated',
        message: `All ${totalChaptersInScope} chapter(s) in "${project.title}" are already fully translated! Use "Force Re-translate" if you wish to re-process them.`,
        type: 'translation',
        timestamp: timeNow,
      });

      setActiveProgress({
        id: `prog-complete-${Date.now()}`,
        type: 'translation',
        title: `Completed Manuscript: ${project.title}`,
        detail: `All ${totalChaptersInScope} chapter(s) are already translated (100% complete).`,
        currentStep: totalChaptersInScope,
        totalSteps: totalChaptersInScope,
        completedSteps: totalChaptersInScope,
        failedSteps: 0,
        sectionTitle: 'All Chapters Complete',
        sectionProgressPercent: 100,
        isFinished: true,
        startedAt: timeNow,
      });

      setShowSummaryModal(true);
      return;
    }

    setStartNotice({
      id: `notice-batch-${Date.now()}`,
      title: alreadyCompletedCount > 0 ? 'Resuming Book Translation' : 'Batch Translation Started',
      message: alreadyCompletedCount > 0
        ? `Resuming translation for "${project.title}". Skipping ${alreadyCompletedCount} completed chapter(s), translating ${chaptersToTranslate.length} remaining section(s)...`
        : `Translating ${chaptersToTranslate.length} section(s) sequentially with Gemini 3.6 Engine...`,
      type: 'translation',
      timestamp: timeNow,
    });

    setActiveProgress({
      id: `prog-batch-${Date.now()}`,
      type: 'translation',
      title: alreadyCompletedCount > 0 
        ? `Resuming Translation (${alreadyCompletedCount}/${totalChaptersInScope} Completed)` 
        : `Batch Translating ${totalChaptersInScope} Section(s) — ${project.title}`,
      detail: `Starting Section "${chaptersToTranslate[0]?.title}"...`,
      currentStep: alreadyCompletedCount + 1,
      totalSteps: totalChaptersInScope,
      completedSteps: alreadyCompletedCount,
      failedSteps: 0,
      sectionTitle: chaptersToTranslate[0]?.title,
      sectionProgressPercent: 10,
      isFinished: false,
      startedAt: timeNow,
      startTimestamp: Date.now(),
    });

    const chapterResults: BatchChapterResult[] = [];

    for (let i = 0; i < chaptersToTranslate.length; i++) {
      const chapter = chaptersToTranslate[i];

      // Check pause
      if (isPausedRef.current) {
        setActiveProgress((prev) => prev ? {
          ...prev,
          detail: `[PAUSED at Section ${alreadyCompletedCount + i + 1} of ${totalChaptersInScope}: "${chapter.title}"] Click "Resume Translation" to continue...`,
        } : null);

        await new Promise<void>((resolve) => {
          pauseResolverRef.current = resolve;
        });
      }

      setTranslatingChapterId(chapter.id);

      const currentCompletedSoFar = alreadyCompletedCount + chapterResults.filter(r => r.status === 'completed').length;
      const currentFailedSoFar = chapterResults.filter(r => r.status === 'error').length;

      setActiveProgress((prev) => prev ? {
        ...prev,
        currentStep: alreadyCompletedCount + i + 1,
        completedSteps: currentCompletedSoFar,
        failedSteps: currentFailedSoFar,
        sectionTitle: chapter.title,
        sectionProgressPercent: 15,
        detail: `[Overall Chapter ${alreadyCompletedCount + i + 1} of ${totalChaptersInScope}] Translating "${chapter.title}"...`,
      } : null);

      const result = await handleTranslateChapter(chapter.id, options, {
        currentStep: alreadyCompletedCount + i + 1,
        totalSteps: totalChaptersInScope,
        completedSteps: currentCompletedSoFar
      });

      if (result) {
        chapterResults.push(result);
      }

      const updatedCompleted = alreadyCompletedCount + chapterResults.filter(r => r.status === 'completed').length;
      const updatedFailed = chapterResults.filter(r => r.status === 'error').length;

      setActiveProgress((prev) => prev ? {
        ...prev,
        completedSteps: updatedCompleted,
        failedSteps: updatedFailed,
      } : null);

      // Throttle delay between chapters
      if (i < chaptersToTranslate.length - 1) {
        if (isPausedRef.current) {
          setActiveProgress((prev) => prev ? {
            ...prev,
            detail: `[PAUSED before Section ${alreadyCompletedCount + i + 2} of ${totalChaptersInScope}] Click "Resume Translation" to continue...`,
          } : null);

          await new Promise<void>((resolve) => {
            pauseResolverRef.current = resolve;
          });
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    setIsTranslating(false);
    setIsPaused(false);
    isPausedRef.current = false;
    setTranslatingChapterId(null);

    const successfulCountInBatch = chapterResults.filter((r) => r.status === 'completed').length;
    const failedCountInBatch = chapterResults.filter((r) => r.status === 'error').length;
    const totalSuccessfulAll = alreadyCompletedCount + successfulCountInBatch;

    setActiveProgress((prev) => prev ? {
      ...prev,
      currentStep: totalChaptersInScope,
      completedSteps: totalSuccessfulAll,
      failedSteps: failedCountInBatch,
      sectionProgressPercent: 100,
      isFinished: true,
      detail: `Batch translation complete! ${totalSuccessfulAll} of ${totalChaptersInScope} chapters translated.`,
    } : null);

    const summary: BatchTranslationSummary = {
      totalChapters: totalChaptersInScope,
      successfulCount: totalSuccessfulAll,
      failedCount: failedCountInBatch,
      chapterResults,
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setBatchSummary(summary);
    setShowSummaryModal(true);
  };


  // Retry all failed chapters
  const handleRetryFailedChapters = async () => {
    if (!currentOptions) return;
    setShowSummaryModal(false);
    setIsTranslating(true);

    const failedChapters = project.chapters.filter((c) => c.status === 'error' || !c.translatedXhtml);
    const updatedResults = [...(batchSummary?.chapterResults || [])];

    for (let i = 0; i < failedChapters.length; i++) {
      const chapter = failedChapters[i];
      setTranslatingChapterId(chapter.id);

      const result = await handleTranslateChapter(chapter.id, currentOptions);
      if (result) {
        const idx = updatedResults.findIndex((r) => r.chapterId === chapter.id);
        if (idx >= 0) {
          updatedResults[idx] = result;
        } else {
          updatedResults.push(result);
        }
      }

      if (i < failedChapters.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    setIsTranslating(false);
    setTranslatingChapterId(null);

    const successfulCount = updatedResults.filter((r) => r.status === 'completed').length;
    const failedCount = updatedResults.filter((r) => r.status === 'error').length;

    setBatchSummary({
      totalChapters: updatedResults.length,
      successfulCount,
      failedCount,
      chapterResults: updatedResults,
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    setShowSummaryModal(true);
  };

  // Single chapter retry from modal
  const handleRetrySingleChapterFromModal = async (chapterId: string) => {
    setShowSummaryModal(false);
    await handleTranslateChapter(chapterId, currentOptions);

    // Refresh batch summary
    if (batchSummary) {
      const updatedChapter = project.chapters.find((c) => c.id === chapterId);
      const updatedResults = batchSummary.chapterResults.map((r) => {
        if (r.chapterId === chapterId) {
          return {
            ...r,
            status: (updatedChapter?.status === 'completed' ? 'completed' : 'error') as 'completed' | 'error',
            errorMessage: updatedChapter?.errorMessage,
            translatedWordCount: updatedChapter?.translatedWordCount || 0,
          };
        }
        return r;
      });

      setBatchSummary({
        ...batchSummary,
        successfulCount: updatedResults.filter((r) => r.status === 'completed').length,
        failedCount: updatedResults.filter((r) => r.status === 'error').length,
        chapterResults: updatedResults,
      });
    }
    setShowSummaryModal(true);
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#e0e0e0] flex flex-col font-sans selection:bg-[#d4af37] selection:text-black">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        project={project}
        setProject={setProject}
        onOpenExportModal={() => setShowExportModal(true)}
        lastSavedAt={lastSavedAt}
        onSaveSnapshot={handleSaveSnapshot}
        onOpenRestoreModal={handleOpenRestoreModal}
        backupCount={backupPoints.length}
        onOpenContactModal={() => setShowContactModal(true)}
        onClearActiveDocument={handleClearActiveDocument}
      />

      {/* Dismissible Session Restore Toast Banner */}
      {restoredNotice && (
        <div className="bg-[#181818] border-b border-[#333] px-4 py-2 flex items-center justify-between text-xs text-emerald-400 animate-in slide-in-from-top duration-200">
          <div className="flex items-center space-x-2 max-w-7xl mx-auto w-full">
            <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium text-[#e0e0e0] flex-1">
              {restoredNotice}
            </span>
            <button
              onClick={() => setRestoredNotice(null)}
              className="text-[#888] hover:text-white p-1 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 pb-12">
        {activeTab === 'editor' && (
          <StudioEditor
            project={project}
            setProject={setProject}
            onTranslateChapter={async (chapterId, options) => {
              await handleTranslateChapter(chapterId, options);
            }}
            onTranslateAllChapters={handleTranslateAllChapters}
            isTranslating={isTranslating}
            translatingChapterId={translatingChapterId}
            onOpenBatchSummary={() => setShowSummaryModal(true)}
            hasBatchSummary={!!batchSummary}
            isPaused={isPaused}
            onPauseTranslation={handlePauseTranslation}
            onResumeTranslation={handleResumeTranslation}
            activeProgress={activeProgress}
          />
        )}

        {activeTab === 'library' && (
          <ClassicalLibrary
            onLoadProject={(newProject) => {
              setProject(newProject);
              setActiveTab('editor');
            }}
          />
        )}

        {activeTab === 'ocr' && (
          <ManuscriptOcrScan
            project={project}
            setProject={setProject}
            onNavigateToEditor={() => setActiveTab('editor')}
          />
        )}

        {activeTab === 'analytics' && (
          <WordCountReportView project={project} />
        )}

        {activeTab === 'annotations' && (
          <AnnotationsView
            project={project}
            setProject={setProject}
          />
        )}

        {activeTab === 'mancala' && <MancalaSolver />}
      </main>

      {/* Batch Translation Summary Report Modal */}
      {showSummaryModal && batchSummary && (
        <TranslationSummaryModal
          summary={batchSummary}
          onClose={() => setShowSummaryModal(false)}
          onRetryFailed={handleRetryFailedChapters}
          onRetrySingleChapter={handleRetrySingleChapterFromModal}
          isTranslating={isTranslating}
        />
      )}

      {/* Short Overlay displaying successful start of operation */}
      <StartOperationOverlay
        notice={startNotice}
        onDismiss={() => setStartNotice(null)}
      />

      {/* Persistent / Active Progress Status Bar for Translations & Downloads */}
      <ActiveProgressStatusBar
        progress={activeProgress}
        onDismiss={() => setActiveProgress(null)}
        onOpenReport={() => setShowSummaryModal(true)}
        hasReport={!!batchSummary}
        isPaused={isPaused}
        onPause={handlePauseTranslation}
        onResume={handleResumeTranslation}
      />

      {/* Export Submenu Modal */}
      {showExportModal && (
        <ExportEbookModal
          isOpen={showExportModal}
          project={project}
          onClose={() => setShowExportModal(false)}
          onStartDownload={handleStartDownload}
        />
      )}

      {/* 5 Backup Points Restore Selector Modal */}
      <RestoreBackupModal
        backupPoints={backupPoints}
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onSelectRestorePoint={handleSelectRestorePoint}
        onClearAllPoints={handleClearBackupPoints}
        currentProjectTitle={project.title}
        onSaveCurrentProgress={handleSaveSnapshot}
        onExportSavedBook={(savedProject) => {
          setProject(savedProject);
          setShowRestoreModal(false);
          setShowExportModal(true);
        }}
      />

      {/* Contact & Support Email Directory Modal */}
      <ContactDirectoryModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />

      {/* Footer with Illuminated Adaptive E-Works Logo Branding & Official verbanovae.com Directory */}
      <footer className="border-t border-[#262626] bg-[#0c0c0c] py-8 text-center text-xs text-[#888] space-y-5">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center justify-center space-y-4">
          <IlluminatedLogo size="sm" showText={true} />
          
          <p className="max-w-2xl text-[11px] text-[#888] leading-relaxed">
            <strong>Verba Nova II</strong> — Developed by <strong className="text-[#d4af37]">Illuminated Adaptive E-Works</strong>.
            <br />
            Tag-Preserving Ebook Translation, Semantic OCR, & Word-Count Analytics Suite for Calibre & Sigil.
          </p>

          {/* Official Website & Email Routing Directory */}
          <div className="w-full pt-3 border-t border-[#1a1a1a] flex flex-col items-center space-y-3">
            <div className="flex items-center space-x-2 text-xs">
              <Globe className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="text-[#aaa]">Official Website:</span>
              <a 
                href="https://verbanovae.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#d4af37] font-bold hover:underline flex items-center space-x-1"
              >
                <span>verbanovae.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Quick Email Hyperlinks Bar */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px]">
              <a 
                href="mailto:translator@verbanovae.com?subject=ATTN%3A%20VERBA%20NOVA%20II%20TRANSLATOR%21%21"
                className="px-2.5 py-1 rounded bg-[#181818] hover:bg-[#222] border border-[#2a2a2a] hover:border-[#d4af37] text-[#e0e0e0] font-medium transition flex items-center space-x-1"
                title="Email regarding Verba Nova II Translator App"
              >
                <BookOpen className="w-3 h-3 text-[#d4af37]" />
                <span>translator@verbanovae.com</span>
              </a>

              <a 
                href="mailto:illuminatedadaptivee-works@verbanovae.com?subject=ATTN%3A%20ILLUMINATED%20ADAPTIVE%20E-WORKS%21%21"
                className="px-2.5 py-1 rounded bg-[#181818] hover:bg-[#222] border border-[#2a2a2a] hover:border-purple-400 text-[#e0e0e0] font-medium transition flex items-center space-x-1"
                title="Email regarding Mobile Editor App (Illuminated Adaptive E-Works)"
              >
                <Smartphone className="w-3 h-3 text-purple-400" />
                <span>illuminatedadaptivee-works@verbanovae.com</span>
              </a>

              <a 
                href="mailto:mason@verbanovae.com?subject=ATTN%3A%20MASON%20%2F%20SOFTWARE%20SUPPORT%21%21"
                className="px-2.5 py-1 rounded bg-[#181818] hover:bg-[#222] border border-[#2a2a2a] hover:border-red-400 text-[#e0e0e0] font-medium transition flex items-center space-x-1"
                title="Email Mason for App & Software Support"
              >
                <Wrench className="w-3 h-3 text-red-400" />
                <span>mason@verbanovae.com</span>
              </a>

              <a 
                href="mailto:info@verbanovae.com?subject=ATTN%3A%20INFO%20%2F%20EBOOK%20EDITING%20INQUIRY%21%21"
                className="px-2.5 py-1 rounded bg-[#181818] hover:bg-[#222] border border-[#2a2a2a] hover:border-blue-400 text-[#e0e0e0] font-medium transition flex items-center space-x-1"
                title="Email Info for Author & Publisher Ebook Editing Inquiries"
              >
                <PenTool className="w-3 h-3 text-blue-400" />
                <span>info@verbanovae.com</span>
              </a>

              <a 
                href="mailto:app@verbanovae.com?subject=ATTN%3A%20APP%21%21"
                className="px-2.5 py-1 rounded bg-[#181818] hover:bg-[#222] border border-[#2a2a2a] hover:border-emerald-400 text-[#e0e0e0] font-medium transition flex items-center space-x-1"
                title="Email App for Accessible Ebook Services & Published Translated Content"
              >
                <Accessibility className="w-3 h-3 text-emerald-400" />
                <span>app@verbanovae.com</span>
              </a>
            </div>

            <button
              onClick={() => setShowContactModal(true)}
              className="mt-1 text-[11px] text-[#d4af37] hover:underline flex items-center space-x-1"
            >
              <Mail className="w-3 h-3" />
              <span>View Full Verba Nova Contact Directory & Subject Specifications</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

