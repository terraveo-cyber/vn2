import React, { useState, useEffect } from 'react';
import { 
  EbookProject, 
  Chapter, 
  AuthorVoiceStyle, 
  TranslationOptions, 
  SourceLanguage,
  BookAnnotation,
  ActiveOperationProgress
} from '../types';
import { sanitizeXhtmlForPreview } from '../utils/epubParser';
import { exportSingleChapter } from '../utils/exporters';
import { 
  Sparkles, 
  Code, 
  BookOpen, 
  ShieldCheck, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  Eye, 
  FileText, 
  Volume2, 
  ListOrdered, 
  BookMarked,
  Search,
  Replace,
  Edit3,
  Check,
  X,
  Languages,
  UserCheck,
  Copy,
  Scissors,
  Clipboard,
  BarChart2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  CheckSquare,
  Square,
  Pause,
  Play,
  AlertTriangle,
  AlertCircle,
  Download,
  Timer,
  Clock
} from 'lucide-react';
import { SuggestAnnotationsModal } from './SuggestAnnotationsModal';

interface StudioEditorProps {
  project: EbookProject;
  setProject: React.Dispatch<React.SetStateAction<EbookProject>>;
  onTranslateChapter: (chapterId: string, options: TranslationOptions) => Promise<void>;
  onTranslateAllChapters: (options: TranslationOptions, targetChapterIds?: string[], forceRetranslate?: boolean) => Promise<void>;
  isTranslating: boolean;
  translatingChapterId: string | null;
  onOpenBatchSummary?: () => void;
  hasBatchSummary?: boolean;
  isPaused?: boolean;
  onPauseTranslation?: () => void;
  onResumeTranslation?: () => void;
  activeProgress?: ActiveOperationProgress | null;
}

export const StudioEditor: React.FC<StudioEditorProps> = ({
  project,
  setProject,
  onTranslateChapter,
  onTranslateAllChapters,
  isTranslating,
  translatingChapterId,
  onOpenBatchSummary,
  hasBatchSummary,
  isPaused,
  onPauseTranslation,
  onResumeTranslation,
  activeProgress
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    project.chapters[0]?.id || ''
  );
  const [editorMode, setEditorMode] = useState<'split' | 'reader' | 'code'>('split');

  // Collapsible Div Containers State
  const [isLeftColumnCollapsed, setIsLeftColumnCollapsed] = useState<boolean>(false);
  const [isRightColumnCollapsed, setIsRightColumnCollapsed] = useState<boolean>(false);
  const [isChaptersSectionCollapsed, setIsChaptersSectionCollapsed] = useState<boolean>(false);
  const [isVoiceSectionCollapsed, setIsVoiceSectionCollapsed] = useState<boolean>(false);
  
  // Translation options state
  const [authorVoiceStyle, setAuthorVoiceStyle] = useState<AuthorVoiceStyle>('modern_eloquent');
  const [sourceLanguage, setSourceLanguage] = useState<SourceLanguage>(project.sourceLanguage);
  const [preserveTags, setPreserveTags] = useState<boolean>(true);
  const [preserveCssClasses, setPreserveCssClasses] = useState<boolean>(true);
  const [contextualToneNotes, setContextualToneNotes] = useState<string>('');

  // Synchronize local sourceLanguage state when project changes
  useEffect(() => {
    setSourceLanguage(project.sourceLanguage);
  }, [project.id, project.sourceLanguage]);

  // In-place Editing State
  const [isEditingSource, setIsEditingSource] = useState<boolean>(false);
  const [isEditingTarget, setIsEditingTarget] = useState<boolean>(false);
  const [editedSourceText, setEditedSourceText] = useState<string>('');
  const [editedTargetText, setEditedTargetText] = useState<string>('');

  // Find & Replace State
  const [showFindReplace, setShowFindReplace] = useState<boolean>(false);
  const [findText, setFindText] = useState<string>('');
  const [replaceText, setReplaceText] = useState<string>('');
  const [findTargetPane, setFindTargetPane] = useState<'source' | 'target' | 'both'>('both');
  const [findScope, setFindScope] = useState<'chapter' | 'book'>('chapter');
  const [findReplaceStatus, setFindReplaceStatus] = useState<string | null>(null);

  // Text Selection & Right-Click Context Menu State
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionPane, setSelectionPane] = useState<'source' | 'target'>('source');
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Dictionary Lookup Result State
  const [dictResult, setDictResult] = useState<any | null>(null);
  const [isLookingUpDict, setIsLookingUpDict] = useState<boolean>(false);
  const [showDictModal, setShowDictModal] = useState<boolean>(false);

  // Add Annotation Modal State
  const [showAddAnnModal, setShowAddAnnModal] = useState<boolean>(false);
  const [showSuggestModal, setShowSuggestModal] = useState<boolean>(false);
  const [annTitle, setAnnTitle] = useState<string>('');
  const [annType, setAnnType] = useState<BookAnnotation['type']>('footnote');
  const [annExplanation, setAnnExplanation] = useState<string>('');
  const [annHistoricalDetails, setAnnHistoricalDetails] = useState<string>('');

  // Create chapter modal
  const [showNewChapterModal, setShowNewChapterModal] = useState<boolean>(false);
  const [newChapterTitle, setNewChapterTitle] = useState<string>('');
  const [newChapterXhtml, setNewChapterXhtml] = useState<string>('');

  // Single section export notice
  const [sectionExportNotice, setSectionExportNotice] = useState<string | null>(null);

  // Section Selection Dropdown State for Batch Translation
  const [showSectionDropdown, setShowSectionDropdown] = useState<boolean>(false);
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>(
    project.chapters.map((c) => c.id)
  );

  useEffect(() => {
    setSelectedSectionIds((prev) => {
      const valid = prev.filter((id) => project.chapters.some((c) => c.id === id));
      return valid.length > 0 ? valid : project.chapters.map((c) => c.id);
    });
  }, [project.chapters]);

  const handleSelectAllSections = () => {
    setSelectedSectionIds(project.chapters.map((c) => c.id));
  };

  const handleSelectNoneSections = () => {
    setSelectedSectionIds([]);
  };

  const handleToggleSection = (chapterId: string) => {
    setSelectedSectionIds((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const currentChapter = project.chapters.find((c) => c.id === selectedChapterId) || project.chapters[0];

  useEffect(() => {
    if (currentChapter) {
      setEditedSourceText(currentChapter.originalXhtml);
      setEditedTargetText(currentChapter.translatedXhtml);
      setIsEditingSource(false);
      setIsEditingTarget(false);
    }
  }, [selectedChapterId, project.chapters]);

  // Handle Text Selection in Panes
  const handleTextSelection = (pane: 'source' | 'target', e: React.MouseEvent) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 0) {
      setSelectedText(text);
      setSelectionPane(pane);
      // Position popup near cursor
      setContextMenuPos({ x: Math.min(e.clientX, window.innerWidth - 220), y: e.clientY + 10 });
    } else {
      setContextMenuPos(null);
    }
  };

  // Save In-place Edit for Source
  const handleSaveSourceEdit = () => {
    if (!currentChapter) return;
    const words = editedSourceText.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length;
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(c => 
        c.id === currentChapter.id
          ? { ...c, originalXhtml: editedSourceText, originalWordCount: words }
          : c
      )
    }));
    setIsEditingSource(false);
  };

  // Save In-place Edit for Target
  const handleSaveTargetEdit = () => {
    if (!currentChapter) return;
    const words = editedTargetText.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length;
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(c => 
        c.id === currentChapter.id
          ? { ...c, translatedXhtml: editedTargetText, translatedWordCount: words, status: 'completed' }
          : c
      )
    }));
    setIsEditingTarget(false);
  };

  // Find & Replace Action
  const handleExecuteReplaceAll = () => {
    if (!findText) return;

    let totalReplacements = 0;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');

    const updatedChapters = project.chapters.map((ch) => {
      let isCurrent = findScope === 'chapter' ? ch.id === currentChapter?.id : true;
      if (!isCurrent) return ch;

      let newSource = ch.originalXhtml;
      let newTarget = ch.translatedXhtml;

      if (findTargetPane === 'source' || findTargetPane === 'both') {
        const matches = (newSource.match(regex) || []).length;
        totalReplacements += matches;
        newSource = newSource.replace(regex, replaceText);
      }

      if (findTargetPane === 'target' || findTargetPane === 'both') {
        const matches = (newTarget.match(regex) || []).length;
        totalReplacements += matches;
        newTarget = newTarget.replace(regex, replaceText);
      }

      return {
        ...ch,
        originalXhtml: newSource,
        translatedXhtml: newTarget,
        originalWordCount: newSource.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length,
        translatedWordCount: newTarget.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length,
      };
    });

    setProject((prev) => ({ ...prev, chapters: updatedChapters }));
    setFindReplaceStatus(`Replaced ${totalReplacements} occurrences of "${findText}" with "${replaceText}".`);
    setTimeout(() => setFindReplaceStatus(null), 4000);
  };

  // Dictionary Lookup Handler (Calls /api/dictionary-lookup)
  const handleDictionaryLookup = async () => {
    if (!selectedText) return;
    setContextMenuPos(null);
    setIsLookingUpDict(true);
    setShowDictModal(true);

    try {
      const res = await fetch('/api/dictionary-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: selectedText,
          context: currentChapter?.originalXhtml?.substring(0, 300) || '',
          sourceLanguage: project.sourceLanguage
        })
      });

      const data = await res.json();
      setDictResult(data);
    } catch (err) {
      setDictResult({
        term: selectedText,
        englishDefinition: `Dictionary definition for "${selectedText}" in classical ${project.sourceLanguage}.`,
        partOfSpeech: 'Term',
        etymology: 'Classical manuscript root',
        contextualNuance: 'Found in classical text.'
      });
    } finally {
      setIsLookingUpDict(false);
    }
  };

  // Character Suggestions for Selected Text / Book
  const historicalCharacterSuggestions = [
    {
      name: 'Marcus Tullius Cicero',
      dates: '106 BCE – 43 BCE',
      bio: 'Roman statesman, lawyer, scholar, and philosopher who created a Latin philosophical vocabulary.',
      relevance: 'Author of De Officiis, De Re Publica, and Tusculanae Disputationes.'
    },
    {
      name: 'Cratippus of Pergamum',
      dates: 'c. 50 BCE',
      bio: 'Peripatetic philosopher, head of the Academy in Athens, personal friend and teacher to Cicero Minor.',
      relevance: 'Taught ethics and logic to Cicero’s son in Athens.'
    },
    {
      name: 'Victor Hugo',
      dates: '1802 – 1885',
      bio: 'French Romantic writer, poet, and statesman authoring Les Misérables and Notre-Dame de Paris.',
      relevance: 'Pioneered social realism and literary humanism in 19th-century French literature.'
    },
    {
      name: 'Bishop Charles-François-Bienvenu Myriel',
      dates: '1739 – 1821',
      bio: 'Historical inspiration for the virtuous bishop of Digne in Hugo’s Les Misérables.',
      relevance: 'Symbol of profound Christian mercy and social charity.'
    },
    {
      name: 'René Descartes',
      dates: '1596 – 1650',
      bio: 'French philosopher and mathematician, father of modern rationalism and author of Discours de la méthode.',
      relevance: 'Introduced Cartesian doubt and formal logical analysis.'
    }
  ];

  // Open Add Annotation Modal with Selected Text
  const handleOpenAddAnnotationModal = () => {
    setContextMenuPos(null);
    setAnnTitle(selectedText || 'Selected Phrase');
    setAnnType('footnote');
    setAnnExplanation(`Scholarly definition and context for "${selectedText}" in ${currentChapter?.title}.`);
    setAnnHistoricalDetails('');
    setShowAddAnnModal(true);
  };

  // Apply Character Suggestion to Annotation
  const handleSelectCharacterSuggestion = (char: typeof historicalCharacterSuggestions[0]) => {
    setAnnTitle(char.name);
    setAnnType('historical_character');
    setAnnExplanation(`${char.bio} (${char.dates})`);
    setAnnHistoricalDetails(`Narrative Relevance: ${char.relevance}`);
  };

  // Save New Annotation from Context Selection
  const handleSaveAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim()) return;

    const newAnn: BookAnnotation = {
      id: `ann-${Date.now()}`,
      selectedText,
      pane: selectionPane,
      chapterId: currentChapter?.id || '',
      chapterTitle: currentChapter?.title || '',
      type: annType,
      title: annTitle,
      explanationOrDefinition: annExplanation,
      historicalDetails: annHistoricalDetails,
      createdAt: new Date().toISOString()
    };

    setProject(prev => ({
      ...prev,
      annotations: [...(prev.annotations || []), newAnn]
    }));

    setShowAddAnnModal(false);
  };

  const handleTranslateCurrent = () => {
    if (!currentChapter) return;
    onTranslateChapter(currentChapter.id, {
      sourceLanguage,
      authorVoiceStyle,
      preserveTags,
      preserveCssClasses,
      includeGlossaryNotes: true,
      sentenceFidelity: true,
      contextualToneNotes
    });
  };

  const handleTranslateAll = (forceRetranslate = false) => {
    if (selectedSectionIds.length === 0) return;
    setShowSectionDropdown(false);
    onTranslateAllChapters({
      sourceLanguage,
      authorVoiceStyle,
      preserveTags,
      preserveCssClasses,
      includeGlossaryNotes: true,
      sentenceFidelity: true,
      contextualToneNotes
    }, selectedSectionIds, forceRetranslate);
  };

  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim() || !newChapterXhtml.trim()) return;

    const newChapter: Chapter = {
      id: `ch-${Date.now()}`,
      title: newChapterTitle,
      originalXhtml: newChapterXhtml,
      translatedXhtml: '',
      originalWordCount: newChapterXhtml.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length,
      translatedWordCount: 0,
      sentenceCountOriginal: (newChapterXhtml.match(/[.!?;:]+(\s|$)/g) || []).length || 1,
      sentenceCountTranslated: 0,
      status: 'pending'
    };

    setProject(prev => ({
      ...prev,
      chapters: [...prev.chapters, newChapter]
    }));

    setSelectedChapterId(newChapter.id);
    setShowNewChapterModal(false);
    setNewChapterTitle('');
    setNewChapterXhtml('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-3 space-y-3 text-[#e0e0e0] relative">
      
      {/* Top Banner / Book Context Bar */}
      <div className="bg-[#161616] border border-[#333] rounded p-3.5 shadow-xl text-[#e0e0e0] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 bg-[#222] border border-[#444] rounded px-2 py-0.5">
              <span className="text-[10px] font-bold text-[#aaa] uppercase">Lang:</span>
              <select
                value={sourceLanguage}
                onChange={(e) => {
                  const lang = e.target.value as SourceLanguage;
                  setSourceLanguage(lang);
                  setProject(prev => ({ ...prev, sourceLanguage: lang }));
                }}
                className="bg-transparent text-[11px] font-bold text-[#d4af37] focus:outline-none cursor-pointer uppercase"
              >
                <option value="french" className="bg-[#222] text-[#e0e0e0]">FRENCH</option>
                <option value="latin" className="bg-[#222] text-[#e0e0e0]">LATIN</option>
                <option value="greek" className="bg-[#222] text-[#e0e0e0]">GREEK</option>
                <option value="auto" className="bg-[#222] text-[#e0e0e0]">AUTO DETECT</option>
              </select>
            </div>
            <span className="text-xs text-[#888]">
              {project.chapters.length} Chapters • {project.chapters.filter(c => c.status === 'completed').length} Translated
            </span>
          </div>
          <h2 className="text-base font-bold tracking-tight text-[#d4af37]">{project.title}</h2>
          <p className="text-xs text-[#aaa]">Author: <strong className="text-[#e0e0e0] font-medium">{project.author}</strong> — {project.description}</p>
        </div>

        {/* Action Controls: Find/Replace & Translate */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFindReplace(!showFindReplace)}
            className={`px-3 py-1.5 rounded text-xs font-semibold border transition flex items-center space-x-1.5 ${
              showFindReplace ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'bg-[#222] border-[#333] text-[#e0e0e0] hover:border-[#d4af37]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Find & Replace</span>
          </button>

          <button
            onClick={handleTranslateCurrent}
            disabled={isTranslating}
            id="translate-single-chapter-btn"
            className="px-3.5 py-1.5 rounded text-xs font-bold bg-[#d4af37] hover:bg-[#e5c05e] disabled:opacity-50 text-black shadow transition flex items-center space-x-1.5 shrink-0"
          >
            {isTranslating && translatingChapterId === currentChapter?.id ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Translating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>Translate Selected Chapter</span>
              </>
            )}
          </button>

          {/* Translate Entire Book / Resume Translation / Section Selection Dropdown */}
          <div className="relative inline-block text-left">
            <div className="inline-flex rounded-md shadow-sm">
              {project.chapters.filter(c => c.status === 'completed' || !!c.translatedXhtml).length > 0 && 
               project.chapters.filter(c => c.status !== 'completed' && !c.translatedXhtml).length > 0 ? (
                <button
                  onClick={() => handleTranslateAll(false)}
                  disabled={isTranslating || selectedSectionIds.length === 0}
                  id="resume-translation-btn"
                  className="px-3.5 py-1.5 rounded-l-md text-xs font-bold bg-[#d4af37] hover:bg-[#e5c05e] text-black shadow transition flex items-center space-x-1.5 shrink-0 animate-pulse"
                  title={`Resume translating remaining ${project.chapters.filter(c => c.status !== 'completed' && !c.translatedXhtml).length} chapter(s)`}
                >
                  <Play className="w-3.5 h-3.5 fill-black text-black" />
                  <span>Resume Translation ({project.chapters.filter(c => c.status !== 'completed' && !c.translatedXhtml).length} Left)</span>
                </button>
              ) : project.chapters.every(c => c.status === 'completed' || !!c.translatedXhtml) ? (
                <button
                  onClick={() => handleTranslateAll(true)}
                  disabled={isTranslating}
                  id="force-retranslate-book-btn"
                  className="px-3 py-1.5 rounded-l-md text-xs font-semibold bg-[#222] border border-[#333] hover:border-emerald-500 text-emerald-400 disabled:opacity-50 transition flex items-center space-x-1.5 shrink-0"
                  title="All chapters translated! Click to force re-translate all."
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Re-Translate Book (100% Done)</span>
                </button>
              ) : (
                <button
                  onClick={() => handleTranslateAll(false)}
                  disabled={isTranslating || selectedSectionIds.length === 0}
                  id="translate-all-chapters-btn"
                  className="px-3 py-1.5 rounded-l-md text-xs font-semibold bg-[#222] border border-[#333] hover:border-[#d4af37] text-[#e0e0e0] disabled:opacity-50 transition flex items-center space-x-1.5 shrink-0"
                >
                  <BookMarked className="w-3.5 h-3.5 text-[#4a90e2]" />
                  <span>
                    {selectedSectionIds.length === project.chapters.length
                      ? 'Translate Entire Book'
                      : `Translate Selected (${selectedSectionIds.length}/${project.chapters.length})`}
                  </span>
                </button>
              )}

              <button
                onClick={() => setShowSectionDropdown(!showSectionDropdown)}
                disabled={isTranslating}
                id="toggle-section-dropdown-btn"
                className={`px-2 py-1.5 rounded-r-md text-xs bg-[#1f1f1f] border-t border-r border-b border-[#333] hover:border-[#d4af37] text-[#aaa] hover:text-[#d4af37] transition flex items-center ${
                  showSectionDropdown ? 'bg-[#2a2a2a] text-[#d4af37] border-[#d4af37]' : ''
                }`}
                title="Select specific sections / chapters to translate"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSectionDropdown ? 'rotate-180 text-[#d4af37]' : ''}`} />
              </button>
            </div>

            {/* Pause / Resume Task Button */}
            {isTranslating && (
              isPaused ? (
                <button
                  onClick={onResumeTranslation}
                  id="resume-batch-task-btn"
                  className="px-3 py-1.5 rounded-md text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow transition flex items-center space-x-1.5 shrink-0 animate-pulse ml-2"
                  title="Click to resume paused translation task"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Resume Task</span>
                </button>
              ) : (
                <button
                  onClick={onPauseTranslation}
                  id="pause-batch-task-btn"
                  className="px-3 py-1.5 rounded-md text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow transition flex items-center space-x-1.5 shrink-0 ml-2"
                  title="Click to pause translation task"
                >
                  <Pause className="w-3.5 h-3.5 fill-black" />
                  <span>Pause Task</span>
                </button>
              )
            )}

            {/* Dropdown Section Selection Menu */}
            {showSectionDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-[#181818] border border-[#3a3a3a] rounded-xl shadow-2xl z-50 p-3.5 text-xs text-[#e0e0e0] space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[#282828]">
                  <div className="flex items-center space-x-1.5 font-bold text-[#f0f0f0]">
                    <CheckSquare className="w-4 h-4 text-[#d4af37]" />
                    <span>Select Book Sections</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#282828] text-[#aaa] font-semibold border border-[#333]">
                    {selectedSectionIds.length} / {project.chapters.length} Selected
                  </span>
                </div>

                {/* Quick Selection Markers: Select All / Select None */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllSections}
                    className="flex-1 px-2.5 py-1 rounded bg-[#242424] hover:bg-[#303030] border border-[#333] text-[#d4af37] font-semibold text-[11px] transition flex items-center justify-center space-x-1"
                  >
                    <CheckSquare className="w-3 h-3" />
                    <span>Select All</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSelectNoneSections}
                    className="flex-1 px-2.5 py-1 rounded bg-[#242424] hover:bg-[#303030] border border-[#333] text-[#888] hover:text-white font-semibold text-[11px] transition flex items-center justify-center space-x-1"
                  >
                    <Square className="w-3 h-3" />
                    <span>Select None</span>
                  </button>
                </div>

                {/* Scrollable List with Selection Checkbox Markers */}
                <div className="max-h-60 overflow-y-auto space-y-1 pr-1 divide-y divide-[#222]">
                  {project.chapters.map((ch, idx) => {
                    const isSelected = selectedSectionIds.includes(ch.id);
                    const isCompleted = ch.status === 'completed' || !!ch.translatedXhtml;

                    return (
                      <div
                        key={ch.id}
                        onClick={() => handleToggleSection(ch.id)}
                        className={`flex items-start space-x-2.5 p-2 rounded-lg cursor-pointer transition-colors pt-2 ${
                          isSelected ? 'bg-[#222] border border-[#333]' : 'hover:bg-[#1f1f1f] border border-transparent'
                        }`}
                      >
                        <div className={`mt-0.5 p-0.5 rounded border shrink-0 ${
                          isSelected 
                            ? 'bg-[#d4af37] border-[#d4af37] text-black' 
                            : 'bg-[#1a1a1a] border-[#444] text-transparent'
                        }`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-[#e0e0e0] truncate text-[11px]">
                              {idx + 1}. {ch.title}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                              isCompleted 
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {isCompleted ? 'Done' : 'Pending'}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-[#888]">
                            {ch.originalWordCount.toLocaleString()} words
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-[#282828] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleTranslateAll(false)}
                      disabled={isTranslating || selectedSectionIds.length === 0}
                      className="flex-1 px-3 py-1.5 rounded bg-[#d4af37] hover:bg-[#e5c05e] disabled:opacity-40 text-black font-bold text-[11px] transition shadow flex items-center justify-center space-x-1.5"
                      title="Skip completed chapters and translate remaining"
                    >
                      <Play className="w-3.5 h-3.5 fill-black text-black" />
                      <span>Resume / Translate Untranslated</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTranslateAll(true)}
                      disabled={isTranslating || selectedSectionIds.length === 0}
                      className="px-2.5 py-1.5 rounded bg-[#2a2a2a] hover:bg-[#383838] border border-[#444] text-[#aaa] hover:text-white font-semibold text-[10px] transition"
                      title="Force re-translation of all selected sections from scratch"
                    >
                      <span>Force Re-Translate All</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSectionDropdown(false)}
                    className="w-full py-1 text-center text-[#888] hover:text-white text-[10px] font-medium transition"
                  >
                    Close Menu
                  </button>
                </div>

              </div>
            )}
          </div>

          {hasBatchSummary && onOpenBatchSummary && (
            <button
              onClick={onOpenBatchSummary}
              id="view-batch-summary-btn"
              className="px-3.5 py-1.5 rounded text-xs font-semibold bg-[#2a2a2a] border border-[#3a3a3a] hover:border-[#d4af37] text-amber-300 shadow transition flex items-center space-x-1.5 shrink-0"
            >
              <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Batch Report & Logs</span>
            </button>
          )}

          <button
            onClick={() => setShowSuggestModal(true)}
            id="editor-auto-suggest-annotations-btn"
            className="px-3.5 py-1.5 rounded text-xs font-semibold bg-[#2a2a2a] border border-[#3a3a3a] hover:border-[#d4af37] text-[#d4af37] shadow transition flex items-center space-x-1.5 shrink-0"
            title="Auto-detect terms, historical figures, places, events, and foreign idioms for annotations/footnotes"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Auto-Detect Annotations</span>
          </button>
        </div>
      </div>

      {/* Find & Replace Bar */}
      {showFindReplace && (
        <div className="bg-[#1a1a1a] border border-[#d4af37]/60 rounded p-3 text-xs space-y-2 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between font-bold text-[#d4af37] border-b border-[#333] pb-1.5">
            <span className="flex items-center space-x-1.5">
              <Replace className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Studio In-Place Find & Replace Tool</span>
            </span>
            <button onClick={() => setShowFindReplace(false)} className="text-[#888] hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-[#aaa]">Find Text</label>
              <input
                type="text"
                placeholder="Search term..."
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                className="w-full bg-[#222] border border-[#333] rounded px-2 py-1 text-xs text-white focus:border-[#d4af37]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[#aaa]">Replace With</label>
              <input
                type="text"
                placeholder="Replacement..."
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className="w-full bg-[#222] border border-[#333] rounded px-2 py-1 text-xs text-white focus:border-[#d4af37]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[#aaa]">Target Pane</label>
              <select
                value={findTargetPane}
                onChange={(e) => setFindTargetPane(e.target.value as any)}
                className="w-full bg-[#222] border border-[#333] rounded px-2 py-1 text-xs text-white focus:border-[#d4af37]"
              >
                <option value="both">Both Source & Target</option>
                <option value="source">Source Pane Only</option>
                <option value="target">Target Pane Only</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[#aaa]">Scope</label>
              <select
                value={findScope}
                onChange={(e) => setFindScope(e.target.value as any)}
                className="w-full bg-[#222] border border-[#333] rounded px-2 py-1 text-xs text-white focus:border-[#d4af37]"
              >
                <option value="chapter">Selected Chapter Only</option>
                <option value="book">Entire Book ({project.chapters.length} Chapters)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-[#4ade80] font-mono">{findReplaceStatus}</span>
            <button
              onClick={handleExecuteReplaceAll}
              className="px-3 py-1 rounded bg-[#d4af37] text-black font-bold text-xs hover:bg-[#e5c05e] transition"
            >
              Replace All
            </button>
          </div>
        </div>
      )}

      {/* Main Grid Layout with Collapsible Div Columns and Responsive Auto-Width */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 w-full max-w-full min-w-0">
        
        {/* Left Column: Chapters & Options (CSS selector 1 target) */}
        <div className={`transition-all duration-300 min-w-0 ${
          isLeftColumnCollapsed 
            ? 'lg:col-span-1' 
            : isRightColumnCollapsed 
              ? 'lg:col-span-11 space-y-3' 
              : 'lg:col-span-4 space-y-3'
        }`}>
          
          {/* Left Column Container Header / Toggle Switch */}
          {isLeftColumnCollapsed ? (
            <div className="bg-[#161616] border border-[#333] rounded p-2 text-center flex flex-col items-center justify-center space-y-4 py-8 shadow min-w-0 h-full">
              <button
                type="button"
                onClick={() => setIsLeftColumnCollapsed(false)}
                id="toggle-left-column-switch-expand"
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-[#333] transition-colors duration-200 ease-in-out focus:outline-none"
                title="Expand Left Control Panel"
              >
                <span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out translate-x-0" />
              </button>
              <span className="text-[11px] font-bold text-[#d4af37] [writing-mode:vertical-lr] rotate-180 uppercase tracking-widest">
                Left Panel Collapsed
              </span>
              <button
                onClick={() => setIsLeftColumnCollapsed(false)}
                className="p-2 rounded-full bg-[#222] hover:bg-[#333] border border-[#444] text-[#d4af37] transition cursor-pointer"
                title="Expand Left Control Panel"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Left Column Top Toggle Switch Bar */}
              <div className="bg-[#181818] border border-[#333] rounded px-3 py-2 flex items-center justify-between shadow-sm min-w-0">
                <div className="flex items-center space-x-2 font-bold text-xs text-[#d4af37] truncate">
                  <ListOrdered className="w-4 h-4 text-[#d4af37] shrink-0" />
                  <span className="truncate">Left Control Panel</span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[10px] text-[#aaa]">Collapse Panel</span>
                  <button
                    type="button"
                    onClick={() => setIsLeftColumnCollapsed(true)}
                    id="toggle-left-column-switch"
                    className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-[#d4af37] transition-colors duration-200 ease-in-out focus:outline-none"
                    title="Collapse Left Control Panel"
                  >
                    <span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out translate-x-4" />
                  </button>
                </div>
              </div>

              {/* Chapter Selector Sub-Section */}
              <div className="bg-[#161616] border border-[#333] rounded p-3 shadow text-[#e0e0e0] min-w-0">
                <div className="flex items-center justify-between pb-2 border-b border-[#333]">
                  <h3 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider flex items-center space-x-1 truncate">
                    <ListOrdered className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                    <span className="truncate">Book Chapters ({project.chapters.length})</span>
                  </h3>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => setShowNewChapterModal(true)}
                      className="inline-flex items-center space-x-1 text-[11px] text-[#d4af37] hover:text-[#e5c05e] cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                    
                    {/* Toggle Switch for Chapter List */}
                    <button
                      type="button"
                      onClick={() => setIsChaptersSectionCollapsed(!isChaptersSectionCollapsed)}
                      className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isChaptersSectionCollapsed ? 'bg-[#333]' : 'bg-[#d4af37]'
                      }`}
                      title={isChaptersSectionCollapsed ? "Expand Chapter List" : "Collapse Chapter List"}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                          isChaptersSectionCollapsed ? 'translate-x-0' : 'translate-x-3'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {!isChaptersSectionCollapsed && (
                  <div className="mt-2 space-y-1 max-h-56 overflow-y-auto pr-1">
                    {project.chapters.length === 0 && (
                      <div className="p-3 text-center text-[11px] text-[#888] italic bg-[#1a1a1a] rounded border border-[#222]">
                        No chapters in active document.
                      </div>
                    )}
                    {project.chapters.map((ch, idx) => {
                      const isCompleted = ch.status === 'completed' || !!ch.translatedXhtml;
                      const isError = ch.status === 'error' || !!ch.errorMessage;
                      const isCurrentTranslating = isTranslating && translatingChapterId === ch.id;

                      return (
                        <div
                          key={ch.id}
                          onClick={() => setSelectedChapterId(ch.id)}
                          className={`w-full text-left p-2 rounded transition border text-xs flex items-center justify-between cursor-pointer ${
                            selectedChapterId === ch.id
                              ? 'bg-[#2a2a2a] border-l-2 border-[#d4af37] text-[#d4af37] font-semibold'
                              : isError
                              ? 'bg-red-950/20 border-red-900/50 text-[#e0e0e0] hover:bg-red-950/40'
                              : 'bg-[#1a1a1a] border-[#222] text-[#aaa] hover:bg-[#222]'
                          }`}
                        >
                          <div className="truncate max-w-[145px] flex items-center space-x-1">
                            <span className="text-[#666] font-mono shrink-0">{idx + 1}.</span>
                            <span className="truncate">{ch.title}</span>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {isCompleted && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedChapterId(ch.id);
                                  exportSingleChapter(ch, project.title, 'xhtml');
                                  setSectionExportNotice(`Exported "${ch.title}" as XHTML file.`);
                                  setTimeout(() => setSectionExportNotice(null), 4000);
                                }}
                                title="Click Ready icon to export this section"
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1e3a2e] hover:bg-emerald-800 text-[#4ade80] border border-emerald-500/40 flex items-center space-x-1 transition shadow-sm group cursor-pointer"
                              >
                                <CheckCircle2 className="w-2.5 h-2.5 text-[#4ade80]" />
                                <span>Ready</span>
                                <Download className="w-2.5 h-2.5 text-[#4ade80] opacity-80 group-hover:opacity-100 ml-0.5" />
                              </button>
                            )}

                            {isError && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedChapterId(ch.id);
                                }}
                                title={`Click to view error log: ${ch.errorMessage || 'Translation failed'}`}
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-950 text-red-400 border border-red-800 hover:bg-red-900 flex items-center space-x-1 transition shadow-sm animate-pulse-once cursor-pointer"
                              >
                                <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                                <span>ERROR</span>
                              </button>
                            )}

                            {isCurrentTranslating && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                <span>Translating</span>
                              </span>
                            )}

                            {!isCompleted && !isError && !isCurrentTranslating && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] text-[#666] bg-[#222]">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Author Voice Register Options Sub-Section */}
              <div className="bg-[#161616] border border-[#333] rounded p-3 shadow text-[#e0e0e0] space-y-2.5 min-w-0">
                <div className="flex items-center justify-between border-b border-[#333] pb-1.5">
                  <h3 className="text-xs font-bold text-[#e0e0e0] flex items-center space-x-1 uppercase tracking-wider truncate">
                    <Volume2 className="w-3.5 h-3.5 text-[#4a90e2] shrink-0" />
                    <span className="truncate">Voice Register Settings</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsVoiceSectionCollapsed(!isVoiceSectionCollapsed)}
                    className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isVoiceSectionCollapsed ? 'bg-[#333]' : 'bg-[#d4af37]'
                    }`}
                    title={isVoiceSectionCollapsed ? "Expand Voice Settings" : "Collapse Voice Settings"}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                        isVoiceSectionCollapsed ? 'translate-x-0' : 'translate-x-3'
                      }`}
                    />
                  </button>
                </div>

                {!isVoiceSectionCollapsed && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[11px] text-[#aaa]">Author Voice Register</label>
                      <select
                        value={authorVoiceStyle}
                        onChange={(e) => setAuthorVoiceStyle(e.target.value as AuthorVoiceStyle)}
                        className="w-full bg-[#222] border border-[#333] rounded px-2 py-1 text-xs text-[#e0e0e0]"
                      >
                        <option value="modern_eloquent">Modern Eloquent & Authentic</option>
                        <option value="faithful_scholarly">Faithful Scholarly Academic</option>
                        <option value="literal_literary">Literal Line-by-Line Structural</option>
                        <option value="victorian_classic">Victorian Classical Literary</option>
                      </select>
                    </div>

                    <div className="p-2 bg-[#1a1a1a] border border-[#333] rounded space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#d4af37]">
                        <span>Tag Integrity Enforcement</span>
                        <span className="text-[9px] text-[#4ade80] font-mono">100% Active</span>
                      </div>
                      <label className="flex items-center space-x-2 text-[11px] text-[#aaa] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preserveTags}
                          onChange={(e) => setPreserveTags(e.target.checked)}
                          className="rounded bg-[#222] border-[#444] text-[#d4af37]"
                        />
                        <span>Preserve XHTML Structure (&lt;p&gt;, &lt;span&gt;, &lt;blockquote&gt;)</span>
                      </label>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Column: Main Editor View (CSS selector 2 target) */}
        <div className={`transition-all duration-300 min-w-0 ${
          isRightColumnCollapsed 
            ? 'lg:col-span-1' 
            : isLeftColumnCollapsed 
              ? 'lg:col-span-11 space-y-3' 
              : 'lg:col-span-8 space-y-3'
        }`}>
          
          {isRightColumnCollapsed ? (
            <div className="bg-[#161616] border border-[#333] rounded p-2 text-center flex flex-col items-center justify-center space-y-4 py-8 shadow min-w-0 h-full">
              <button
                type="button"
                onClick={() => setIsRightColumnCollapsed(false)}
                id="toggle-right-column-switch-expand"
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-[#333] transition-colors duration-200 ease-in-out focus:outline-none"
                title="Expand Main Workspace"
              >
                <span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out translate-x-0" />
              </button>
              <span className="text-[11px] font-bold text-[#d4af37] [writing-mode:vertical-lr] rotate-180 uppercase tracking-widest">
                Main Workspace Collapsed
              </span>
              <button
                onClick={() => setIsRightColumnCollapsed(false)}
                className="p-2 rounded-full bg-[#222] hover:bg-[#333] border border-[#444] text-[#d4af37] transition cursor-pointer"
                title="Expand Main Workspace"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Right Column Header / Toggle Switch */}
              <div className="bg-[#181818] border border-[#333] rounded px-3 py-2 flex items-center justify-between shadow-sm min-w-0">
                <div className="flex items-center space-x-2 font-bold text-xs text-white truncate">
                  <FileText className="w-4 h-4 text-[#d4af37] shrink-0" />
                  <span className="truncate">Main Workspace & Translation Pane</span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[10px] text-[#aaa]">Collapse Workspace</span>
                  <button
                    type="button"
                    onClick={() => setIsRightColumnCollapsed(true)}
                    id="toggle-right-column-switch"
                    className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-[#d4af37] transition-colors duration-200 ease-in-out focus:outline-none"
                    title="Collapse Right Workspace"
                  >
                    <span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out translate-x-4" />
                  </button>
                </div>
              </div>
          
          {/* Mode Selector */}
          <div className="bg-[#161616] border border-[#333] rounded p-1.5 shadow flex items-center justify-between">
            <div className="flex space-x-1">
              <button
                onClick={() => setEditorMode('split')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium transition ${
                  editorMode === 'split' ? 'bg-[#2a2a2a] text-[#d4af37] border border-[#d4af37]/40' : 'text-[#888]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Parallel Side-by-Side</span>
              </button>

              <button
                onClick={() => setEditorMode('reader')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium transition ${
                  editorMode === 'reader' ? 'bg-[#2a2a2a] text-[#d4af37] border border-[#d4af37]/40' : 'text-[#888]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ebook Reader View</span>
              </button>

              <button
                onClick={() => setEditorMode('code')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium transition ${
                  editorMode === 'code' ? 'bg-[#2a2a2a] text-[#d4af37] border border-[#d4af37]/40' : 'text-[#888]'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>XHTML Tag Inspector</span>
              </button>
            </div>

            {currentChapter && (
              <span className="text-[10px] text-[#888] font-mono pr-2">
                Orig: {currentChapter.originalWordCount} w | Trans: {currentChapter.translatedWordCount} w
              </span>
            )}
          </div>

          {/* Editor Workspace */}
          {currentChapter ? (
            <div className="space-y-3">
              
              {/* Single Section Export Toast Notification */}
              {sectionExportNotice && (
                <div className="bg-emerald-950/80 border border-emerald-800/80 rounded-lg p-2.5 px-3.5 text-xs text-emerald-300 flex items-center justify-between shadow-lg animate-in fade-in duration-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-medium">{sectionExportNotice}</span>
                  </div>
                  <button onClick={() => setSectionExportNotice(null)} className="text-emerald-400/60 hover:text-emerald-200 p-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Error Log & Resolution Banner */}
              {(currentChapter.status === 'error' || currentChapter.errorMessage) && (
                <div className="bg-red-950/70 border border-red-800/80 rounded-xl p-3.5 shadow-xl text-red-200 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-red-900/60">
                    <div className="flex items-center space-x-2 font-bold text-red-300 text-xs uppercase tracking-wide">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>Translation Error Log — {currentChapter.title}</span>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-900/60 text-red-300 font-mono border border-red-700/50">
                      Status: ERROR
                    </span>
                  </div>

                  <p className="text-xs text-red-200/90 leading-relaxed font-mono bg-black/50 p-2.5 rounded-lg border border-red-900/50 max-h-28 overflow-y-auto whitespace-pre-wrap select-text">
                    {currentChapter.errorMessage || 'Unknown translation error occurred.'}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="text-[11px] text-red-300/80 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Resolution: Automatic multi-model fallback retry available</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          onTranslateChapter(currentChapter.id, {
                            sourceLanguage,
                            authorVoiceStyle,
                            preserveTags,
                            preserveCssClasses,
                            includeGlossaryNotes: true,
                            sentenceFidelity: true,
                            contextualToneNotes,
                          });
                        }}
                        disabled={isTranslating}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs transition shadow flex items-center space-x-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
                        <span>Retry Section Translation</span>
                      </button>

                      {project.chapters.some((c) => c.status === 'error') && (
                        <button
                          type="button"
                          onClick={() => {
                            const failedIds = project.chapters.filter((c) => c.status === 'error').map((c) => c.id);
                            onTranslateAllChapters({
                              sourceLanguage,
                              authorVoiceStyle,
                              preserveTags,
                              preserveCssClasses,
                              includeGlossaryNotes: true,
                              sentenceFidelity: true,
                              contextualToneNotes,
                            }, failedIds);
                          }}
                          disabled={isTranslating}
                          className="px-3 py-1.5 rounded-lg bg-[#222] hover:bg-[#333] border border-[#444] text-[#e0e0e0] font-semibold text-xs transition flex items-center space-x-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>Retry All Failed ({project.chapters.filter((c) => c.status === 'error').length})</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* SPLIT VIEW (With In-place Editing) */}
              {editorMode === 'split' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* SOURCE PANE */}
                  <div 
                    onMouseUp={(e) => handleTextSelection('source', e)}
                    className="bg-[#161616] border border-[#333] rounded p-3.5 shadow flex flex-col h-[560px]"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#333] mb-2">
                      <span className="text-xs font-bold uppercase text-[#d4af37] flex items-center space-x-1">
                        <BookOpen className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>SOURCE: {project.sourceLanguage.toUpperCase()}</span>
                      </span>

                      <div className="flex items-center space-x-2">
                        {isEditingSource ? (
                          <button
                            onClick={handleSaveSourceEdit}
                            className="px-2 py-0.5 rounded bg-[#d4af37] text-black font-bold text-[10px] flex items-center space-x-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save Source Edit</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setIsEditingSource(true)}
                            className="px-2 py-0.5 rounded bg-[#222] hover:bg-[#2a2a2a] text-[#aaa] text-[10px] border border-[#333] flex items-center space-x-1"
                          >
                            <Edit3 className="w-3 h-3 text-[#d4af37]" />
                            <span>Edit In-Place</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 font-serif text-sm leading-relaxed">
                      {isEditingSource ? (
                        <textarea
                          value={editedSourceText}
                          onChange={(e) => setEditedSourceText(e.target.value)}
                          className="w-full h-full bg-[#111] border border-[#333] rounded p-2 text-xs font-mono text-[#e0e0e0] focus:border-[#d4af37]"
                        />
                      ) : (
                        <div 
                          dangerouslySetInnerHTML={{ __html: sanitizeXhtmlForPreview(currentChapter.originalXhtml).cleanXhtml }}
                          className="prose prose-invert max-w-none text-[#c0c0c0]"
                        />
                      )}
                    </div>
                  </div>

                  {/* TARGET PANE */}
                  <div 
                    onMouseUp={(e) => handleTextSelection('target', e)}
                    className="bg-[#161616] border border-[#2d4a6a] rounded p-3.5 shadow flex flex-col h-[560px]"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#333] mb-2">
                      <span className="text-xs font-bold uppercase text-[#4a90e2] flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#4a90e2]" />
                        <span>TARGET: MODERN ENGLISH</span>
                      </span>

                      <div className="flex items-center space-x-2">
                        {isEditingTarget ? (
                          <button
                            onClick={handleSaveTargetEdit}
                            className="px-2 py-0.5 rounded bg-[#4a90e2] text-white font-bold text-[10px] flex items-center space-x-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save Target Edit</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setIsEditingTarget(true)}
                            className="px-2 py-0.5 rounded bg-[#222] hover:bg-[#2a2a2a] text-[#aaa] text-[10px] border border-[#333] flex items-center space-x-1"
                          >
                            <Edit3 className="w-3 h-3 text-[#4a90e2]" />
                            <span>Edit In-Place</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 font-serif text-sm leading-relaxed">
                      {isEditingTarget ? (
                        <textarea
                          value={editedTargetText}
                          onChange={(e) => setEditedTargetText(e.target.value)}
                          className="w-full h-full bg-[#111] border border-[#2d4a6a] rounded p-2 text-xs font-mono text-[#e0e0e0] focus:border-[#4a90e2]"
                        />
                      ) : currentChapter.translatedXhtml ? (
                        <div 
                          dangerouslySetInnerHTML={{ __html: sanitizeXhtmlForPreview(currentChapter.translatedXhtml).cleanXhtml }}
                          className="prose prose-invert max-w-none text-[#e0e0e0]"
                        />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#666] space-y-2">
                          <p className="text-xs">Translation pending for this chapter.</p>
                          <button
                            onClick={handleTranslateCurrent}
                            disabled={isTranslating}
                            className="px-3 py-1.5 rounded text-xs font-bold bg-[#d4af37] text-black"
                          >
                            Translate Now
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* READER VIEW */}
              {editorMode === 'reader' && (
                <div className="bg-[#1a1a1a] text-[#e0e0e0] rounded p-6 shadow-2xl min-h-[560px] max-w-3xl mx-auto border border-[#333] font-serif">
                  <style>{project.cssContent}</style>
                  <div className="border-b border-[#333] pb-3 mb-4 text-center">
                    <h1 className="text-xl font-bold text-[#d4af37]">{project.title}</h1>
                    <p className="text-xs italic text-[#4a90e2]">Modern English Edition • {currentChapter.title}</p>
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: sanitizeXhtmlForPreview(currentChapter.translatedXhtml || currentChapter.originalXhtml).cleanXhtml }} />
                </div>
              )}

              {/* CODE TAG INSPECTOR VIEW */}
              {editorMode === 'code' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-[560px]">
                  <textarea
                    value={currentChapter.originalXhtml}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProject(p => ({
                        ...p,
                        chapters: p.chapters.map(c => c.id === currentChapter.id ? { ...c, originalXhtml: val } : c)
                      }));
                    }}
                    className="w-full h-full bg-[#0f0f0f] border border-[#333] rounded p-3 font-mono text-xs text-[#d4af37]"
                  />
                  <textarea
                    value={currentChapter.translatedXhtml}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProject(p => ({
                        ...p,
                        chapters: p.chapters.map(c => c.id === currentChapter.id ? { ...c, translatedXhtml: val } : c)
                      }));
                    }}
                    className="w-full h-full bg-[#0f0f0f] border border-[#2d4a6a] rounded p-3 font-mono text-xs text-[#4a90e2]"
                  />
                </div>
              )}

            </div>
          ) : (
            <div className="bg-[#161616] border border-[#333] rounded-xl p-12 text-center text-[#888] space-y-4 shadow-xl">
              <div className="w-12 h-12 bg-[#222] border border-[#3a3a3a] rounded-full flex items-center justify-center mx-auto text-[#d4af37]">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#e0e0e0]">Active Document Cleared</h3>
                <p className="text-xs text-[#aaa] max-w-md mx-auto leading-relaxed">
                  The source pane and book chapters are currently empty. Import a PDF, EPUB, or TXT file, select a manuscript from the Classical Library, or click below to add a chapter manually.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowNewChapterModal(true)}
                  className="px-3.5 py-1.5 rounded bg-[#d4af37] text-black font-bold text-xs hover:bg-[#e5c05e] transition flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Chapter</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

        </div>
      </div>

      {/* Floating Selection Right-Click Action Context Menu */}
      {contextMenuPos && (
        <div 
          style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
          className="fixed z-50 bg-[#1f1f1f] border border-[#d4af37] rounded shadow-2xl p-1.5 flex flex-col space-y-1 text-xs text-[#e0e0e0] w-52 animate-fadeIn"
        >
          <div className="text-[10px] text-[#888] px-2 py-0.5 font-mono border-b border-[#333] truncate">
            Selected: "{selectedText}"
          </div>

          <button
            onClick={handleDictionaryLookup}
            className="flex items-center space-x-2 px-2 py-1.5 rounded hover:bg-[#2a2a2a] text-[#4a90e2] text-left font-medium"
          >
            <Languages className="w-3.5 h-3.5 text-[#4a90e2]" />
            <span>Google Dictionary Definition</span>
          </button>

          <button
            onClick={handleOpenAddAnnotationModal}
            className="flex items-center space-x-2 px-2 py-1.5 rounded hover:bg-[#2a2a2a] text-[#d4af37] text-left font-medium"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Add to Annotations / Character</span>
          </button>

          <button
            onClick={() => {
              setFindText(selectedText);
              setShowFindReplace(true);
              setContextMenuPos(null);
            }}
            className="flex items-center space-x-2 px-2 py-1.5 rounded hover:bg-[#2a2a2a] text-[#aaa] text-left"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search in Book</span>
          </button>
        </div>
      )}

      {/* Modal: Dictionary Lookup Results */}
      {showDictModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-[#333] rounded max-w-md w-full p-4 text-[#e0e0e0] shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#333] pb-2">
              <h3 className="text-xs font-bold text-[#4a90e2] flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-[#4a90e2]" />
                <span>Google English Dictionary Definition</span>
              </h3>
              <button onClick={() => setShowDictModal(false)} className="text-[#888] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLookingUpDict ? (
              <div className="py-8 text-center text-xs text-[#888] space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin text-[#4a90e2] mx-auto" />
                <p>Searching philological definition in English...</p>
              </div>
            ) : dictResult ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#d4af37]">{dictResult.term}</span>
                  <span className="px-2 py-0.5 rounded bg-[#1e2a3a] text-[#60a5fa] text-[10px] font-mono">
                    {dictResult.partOfSpeech}
                  </span>
                </div>

                <div className="p-2.5 bg-[#121212] border border-[#2a2a2a] rounded space-y-1">
                  <p className="font-semibold text-[#e0e0e0]">{dictResult.englishDefinition}</p>
                  <p className="text-[11px] text-[#aaa]"><strong>Etymology:</strong> {dictResult.etymology}</p>
                  <p className="text-[11px] text-[#aaa]"><strong>Nuance:</strong> {dictResult.contextualNuance}</p>
                </div>

                <button
                  onClick={() => {
                    setShowDictModal(false);
                    setAnnTitle(dictResult.term);
                    setAnnType('dictionary');
                    setAnnExplanation(`${dictResult.englishDefinition} (${dictResult.partOfSpeech})`);
                    setAnnHistoricalDetails(`Etymology: ${dictResult.etymology} • Context: ${dictResult.contextualNuance}`);
                    setShowAddAnnModal(true);
                  }}
                  className="w-full py-1.5 rounded bg-[#d4af37] text-black font-bold text-xs hover:bg-[#e5c05e] transition mt-2"
                >
                  Save as Book Footnote
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal: Add Annotation / Character Entry */}
      {showAddAnnModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-[#333] rounded max-w-lg w-full p-4 text-[#e0e0e0] shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#333] pb-2">
              <h3 className="text-xs font-bold text-[#d4af37]">
                Add Annotation or Historical Character
              </h3>
              <button onClick={() => setShowAddAnnModal(false)} className="text-[#888] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Historical Character Quick Suggestions */}
            <div className="p-2 bg-[#121212] border border-[#2a2a2a] rounded space-y-1.5">
              <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-wider block">
                Suggested Historical Figures Appearing in Classical Literature:
              </span>
              <div className="flex flex-wrap gap-1">
                {historicalCharacterSuggestions.map((char, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectCharacterSuggestion(char)}
                    className="px-2 py-0.5 rounded bg-[#222] hover:bg-[#2a2a2a] border border-[#333] text-[10px] text-[#e0e0e0] transition"
                  >
                    + {char.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveAnnotation} className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#aaa]">Category</label>
                  <select
                    value={annType}
                    onChange={(e) => setAnnType(e.target.value as any)}
                    className="w-full bg-[#222] border border-[#333] rounded px-2 py-1 text-xs text-white"
                  >
                    <option value="historical_character">Historical Character</option>
                    <option value="dictionary">Dictionary Definition</option>
                    <option value="foreign_idiom">Foreign Idiom</option>
                    <option value="footnote">Standard Footnote</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#aaa]">Title / Name</label>
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="w-full bg-[#222] border border-[#333] rounded px-2 py-1 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#aaa]">Explanation / English Definition</label>
                <textarea
                  required
                  rows={2}
                  value={annExplanation}
                  onChange={(e) => setAnnExplanation(e.target.value)}
                  className="w-full bg-[#222] border border-[#333] rounded px-2 py-1 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#aaa]">Historical Context & Narrative Significance</label>
                <textarea
                  rows={2}
                  value={annHistoricalDetails}
                  onChange={(e) => setAnnHistoricalDetails(e.target.value)}
                  className="w-full bg-[#222] border border-[#333] rounded px-2 py-1 text-xs text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#333]">
                <button
                  type="button"
                  onClick={() => setShowAddAnnModal(false)}
                  className="px-3 py-1 rounded text-xs bg-[#222] text-[#aaa]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 rounded text-xs bg-[#d4af37] text-black font-bold"
                >
                  Save Annotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Chapter */}
      {showNewChapterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-[#333] rounded max-w-lg w-full p-4 text-[#e0e0e0] shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-[#d4af37]">Add New Ebook Chapter</h3>
            <form onSubmit={handleCreateChapter} className="space-y-2 text-xs">
              <input
                type="text"
                required
                placeholder="Chapter Title"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                className="w-full bg-[#222] border border-[#333] rounded px-2.5 py-1.5 text-xs text-white"
              />
              <textarea
                required
                rows={6}
                placeholder="Original XHTML text..."
                value={newChapterXhtml}
                onChange={(e) => setNewChapterXhtml(e.target.value)}
                className="w-full bg-[#222] border border-[#333] rounded px-2.5 py-1.5 text-xs font-mono text-white"
              />
              <div className="flex justify-end space-x-2 pt-2 border-t border-[#333]">
                <button type="button" onClick={() => setShowNewChapterModal(false)} className="px-3 py-1 bg-[#222] rounded">
                  Cancel
                </button>
                <button type="submit" className="px-3.5 py-1 bg-[#d4af37] text-black font-bold rounded">
                  Load Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suggest Annotations Modal */}
      <SuggestAnnotationsModal
        isOpen={showSuggestModal}
        onClose={() => setShowSuggestModal(false)}
        project={project}
        setProject={setProject}
        initialChapterId={currentChapter?.id}
      />

    </div>
  );
};
