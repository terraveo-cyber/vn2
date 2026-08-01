import React, { useState, useEffect } from 'react';
import { EbookProject, BookAnnotation } from '../types';
import { 
  Sparkles, 
  CheckSquare, 
  Square, 
  Filter, 
  Search, 
  UserCheck, 
  MapPin, 
  Calendar, 
  BookMarked, 
  Languages, 
  Edit3, 
  Check, 
  X, 
  Loader2, 
  PlusCircle,
  AlertCircle
} from 'lucide-react';

export interface SuggestedAnnotationItem {
  id: string;
  title: string;
  selectedText: string;
  type: BookAnnotation['type'];
  category: string; // 'Historical Figure' | 'Geographical Place' | 'Historical Event' | 'Classical Term' | 'Foreign Idiom'
  explanationOrDefinition: string;
  historicalDetails: string;
  chapterId: string;
  chapterTitle: string;
  selected: boolean;
  isEditing?: boolean;
}

interface SuggestAnnotationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: EbookProject;
  setProject: React.Dispatch<React.SetStateAction<EbookProject>>;
  initialChapterId?: string;
}

export const SuggestAnnotationsModal: React.FC<SuggestAnnotationsModalProps> = ({
  isOpen,
  onClose,
  project,
  setProject,
  initialChapterId
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    initialChapterId || project.chapters[0]?.id || 'all'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [suggestions, setSuggestions] = useState<SuggestedAnnotationItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addedCountNotice, setAddedCountNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialChapterId) {
        setSelectedChapterId(initialChapterId);
      }
      handleFetchSuggestions(selectedChapterId);
    } else {
      setSuggestions([]);
      setAddedCountNotice(null);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Perform AI or local extraction for suggestions
  const handleFetchSuggestions = async (chapterIdToFetch: string) => {
    setIsLoading(true);
    setErrorMessage('');
    setAddedCountNotice(null);

    let targetChapters = project.chapters;
    if (chapterIdToFetch !== 'all') {
      targetChapters = project.chapters.filter(c => c.id === chapterIdToFetch);
    }

    const combinedXhtml = targetChapters.map(c => c.originalXhtml || '').join('\n\n');
    const targetChapterTitle = chapterIdToFetch === 'all' 
      ? 'Entire Manuscript' 
      : (project.chapters.find(c => c.id === chapterIdToFetch)?.title || 'Chapter');

    try {
      const response = await fetch('/api/suggest-annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xhtmlContent: combinedXhtml,
          chapterTitle: targetChapterTitle,
          bookTitle: project.title,
          sourceLanguage: project.sourceLanguage,
          era: project.era
        })
      });

      if (!response.ok) {
        throw new Error('Server returned an error when suggesting annotations.');
      }

      const data = await response.json();
      const rawList = data.suggestions || [];

      if (rawList.length === 0) {
        // Run fallback local heuristic extraction if AI returned empty
        const fallback = generateFallbackHeuristicSuggestions(targetChapters, project);
        setSuggestions(fallback);
      } else {
        const existingAnns = project.annotations || [];
        const mapped: SuggestedAnnotationItem[] = rawList.map((item: any, idx: number) => {
          const matchedChapter = targetChapters[0] || project.chapters[0];
          const isAlreadyAdded = existingAnns.some(
            a => a.title.toLowerCase() === item.title.toLowerCase()
          );

          return {
            id: `sug-${Date.now()}-${idx}`,
            title: item.title || 'Term',
            selectedText: item.selectedText || item.title,
            type: (item.type as BookAnnotation['type']) || 'footnote',
            category: item.category || 'Historical Figure',
            explanationOrDefinition: item.explanationOrDefinition || 'Scholarly annotation note.',
            historicalDetails: item.historicalDetails || '',
            chapterId: matchedChapter?.id || '',
            chapterTitle: matchedChapter?.title || 'General',
            selected: !isAlreadyAdded // default select if not already in project annotations
          };
        });

        setSuggestions(mapped);
      }
    } catch (err: any) {
      console.warn('API suggestion call failed, executing philological local extractor fallback:', err);
      const fallback = generateFallbackHeuristicSuggestions(targetChapters, project);
      setSuggestions(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  // Local philological fallback extractor
  const generateFallbackHeuristicSuggestions = (chapters: typeof project.chapters, proj: EbookProject): SuggestedAnnotationItem[] => {
    const text = chapters.map(c => (c.originalXhtml || '').replace(/<[^>]*>/g, ' ')).join(' ');
    const existingAnns = proj.annotations || [];
    
    // Heuristic regex to detect capitalized proper nouns and potential classical terms
    const words: string[] = text.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b/g) || [];
    const uniqueTerms: string[] = Array.from(new Set(words))
      .filter((w: string) => !['Chapter', 'Book', 'The', 'And', 'This', 'That', 'With', 'From', 'Into', 'When', 'Latin', 'French', 'Greek'].includes(w))
      .slice(0, 10);

    const firstChapter = chapters[0] || proj.chapters[0];

    return uniqueTerms.map((term: string, idx: number) => {
      const isAlreadyAdded = existingAnns.some(a => a.title.toLowerCase() === term.toLowerCase());
      const isMultiWord = term.includes(' ');
      const category = isMultiWord ? 'Historical Figure' : 'Geographical Place';
      const type: BookAnnotation['type'] = isMultiWord ? 'historical_character' : 'footnote';

      return {
        id: `fallback-${Date.now()}-${idx}`,
        title: term,
        selectedText: term,
        type,
        category,
        explanationOrDefinition: `Classical entity "${term}" referenced in ${firstChapter?.title || 'the manuscript'}.`,
        historicalDetails: `Identified automatically from classical manuscript text. Requires scholarly footnote context.`,
        chapterId: firstChapter?.id || '',
        chapterTitle: firstChapter?.title || 'General',
        selected: !isAlreadyAdded
      };
    });
  };

  // Mass Selection Handlers
  const handleSelectAll = () => {
    setSuggestions(prev => prev.map(item => {
      if (activeCategory === 'all' || item.category === activeCategory) {
        return { ...item, selected: true };
      }
      return item;
    }));
  };

  const handleSelectNone = () => {
    setSuggestions(prev => prev.map(item => {
      if (activeCategory === 'all' || item.category === activeCategory) {
        return { ...item, selected: false };
      }
      return item;
    }));
  };

  const handleToggleSelect = (id: string) => {
    setSuggestions(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const handleToggleEdit = (id: string) => {
    setSuggestions(prev => prev.map(item => item.id === id ? { ...item, isEditing: !item.isEditing } : item));
  };

  const handleUpdateItem = (id: string, field: keyof SuggestedAnnotationItem, value: any) => {
    setSuggestions(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Batch Add selected items to project
  const handleBatchAddSelected = () => {
    const selectedItems = suggestions.filter(s => s.selected);
    if (selectedItems.length === 0) return;

    const existing = project.annotations || [];
    const newAnns: BookAnnotation[] = [];

    let addedCounter = 0;
    selectedItems.forEach(item => {
      // Check for duplicates
      const isDuplicate = existing.some(
        a => a.title.toLowerCase() === item.title.toLowerCase() && a.chapterId === item.chapterId
      );

      if (!isDuplicate) {
        newAnns.push({
          id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: item.title,
          selectedText: item.selectedText,
          pane: 'source',
          chapterId: item.chapterId,
          chapterTitle: item.chapterTitle,
          type: item.type,
          explanationOrDefinition: item.explanationOrDefinition,
          historicalDetails: item.historicalDetails,
          createdAt: new Date().toISOString()
        });
        addedCounter++;
      }
    });

    if (newAnns.length > 0) {
      setProject(prev => ({
        ...prev,
        annotations: [...(prev.annotations || []), ...newAnns]
      }));
    }

    setAddedCountNotice(`Successfully added ${addedCounter} new annotations to the project! (${selectedItems.length - addedCounter} duplicate items skipped)`);
    
    // Deselect added items
    setSuggestions(prev => prev.map(item => item.selected ? { ...item, selected: false } : item));
  };

  // Filtered view logic
  const filteredSuggestions = suggestions.filter(item => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.selectedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.explanationOrDefinition.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const selectedCount = suggestions.filter(s => s.selected).length;

  const categories = ['all', 'Historical Figure', 'Geographical Place', 'Historical Event', 'Classical Term', 'Foreign Idiom'];

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'Historical Figure':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3b1d22] text-[#f87171] border border-[#7f1d1d] flex items-center gap-1"><UserCheck className="w-3 h-3" /> Historical Figure</span>;
      case 'Geographical Place':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1c2e28] text-[#34d399] border border-[#065f46] flex items-center gap-1"><MapPin className="w-3 h-3" /> Geographical Place</span>;
      case 'Historical Event':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2e1d38] text-[#c084fc] border border-[#581c87] flex items-center gap-1"><Calendar className="w-3 h-3" /> Historical Event</span>;
      case 'Classical Term':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1e2a3a] text-[#60a5fa] border border-[#1e3a5f] flex items-center gap-1"><Languages className="w-3 h-3" /> Classical Term</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#382d1c] text-[#fbbf24] border border-[#78350f] flex items-center gap-1"><BookMarked className="w-3 h-3" /> Foreign Idiom</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-[#141414] border border-[#333] rounded-xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl text-[#e0e0e0] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 bg-[#181818] border-b border-[#2d2d2d] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#d4af37] flex items-center gap-2">
                AI Suggested Annotations & Scholarly Footnotes
              </h2>
              <p className="text-xs text-[#888]">
                Auto-detect terms, historical figures, places, events, and foreign idioms from manuscript text.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-[#282828] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chapter Selection & Auto-Detect Controls */}
        <div className="p-3 bg-[#1a1a1a] border-b border-[#2d2d2d] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="font-semibold text-[#aaa] shrink-0">Analyze Target:</span>
            <select
              value={selectedChapterId}
              onChange={(e) => {
                setSelectedChapterId(e.target.value);
                handleFetchSuggestions(e.target.value);
              }}
              className="bg-[#222] border border-[#383838] rounded px-3 py-1.5 text-xs text-[#e0e0e0] focus:border-[#d4af37] w-full sm:w-64"
            >
              <option value="all">Entire Manuscript ({project.chapters.length} Chapters)</option>
              {project.chapters.map(ch => (
                <option key={ch.id} value={ch.id}>{ch.title}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleFetchSuggestions(selectedChapterId)}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded font-bold bg-[#282828] hover:bg-[#333] border border-[#444] text-[#d4af37] disabled:opacity-50 transition flex items-center space-x-1.5 shrink-0"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#d4af37]" /> : <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />}
            <span>Re-Analyze Chapter Content</span>
          </button>
        </div>

        {/* Filter & Mass Selection Control Bar */}
        <div className="p-3 bg-[#161616] border-b border-[#2a2a2a] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0 text-xs">
          
          {/* Select All / Select None Buttons */}
          <div className="flex items-center space-x-2 bg-[#202020] p-1 rounded border border-[#333] shrink-0">
            <span className="px-2 text-[#aaa] font-mono text-[11px] font-semibold border-r border-[#333]">
              {selectedCount} / {suggestions.length} Selected
            </span>

            <button
              onClick={handleSelectAll}
              id="suggest-select-all-btn"
              className="px-2.5 py-1 rounded bg-[#2a2a2a] hover:bg-[#383838] text-[#d4af37] font-bold transition flex items-center space-x-1"
              title="Select all suggested terms"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Select All</span>
            </button>

            <button
              onClick={handleSelectNone}
              id="suggest-select-none-btn"
              className="px-2.5 py-1 rounded bg-[#2a2a2a] hover:bg-[#383838] text-[#aaa] hover:text-white transition flex items-center space-x-1"
              title="Deselect all suggested terms"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Select None</span>
            </button>
          </div>

          {/* Category Filter Pills & Search */}
          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
            <Filter className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-[#d4af37] text-black font-bold shadow'
                    : 'bg-[#222] text-[#888] hover:text-[#e0e0e0]'
                }`}
              >
                {cat === 'all' ? 'All Suggestions' : cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="flex items-center bg-[#202020] border border-[#333] rounded px-2.5 py-1 text-xs w-full md:w-48">
            <Search className="w-3.5 h-3.5 text-[#666] mr-1.5 shrink-0" />
            <input
              type="text"
              placeholder="Search terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-[#e0e0e0] focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Notice Banner */}
        {addedCountNotice && (
          <div className="p-2.5 bg-emerald-950/70 border-b border-emerald-800/80 text-emerald-300 text-xs px-4 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{addedCountNotice}</span>
            </div>
            <button onClick={() => setAddedCountNotice(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Suggestions List Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#111]">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3 text-[#888]">
              <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
              <p className="text-xs font-medium">Analyzing classical manuscript & extracting entities...</p>
            </div>
          ) : filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg p-3.5 transition flex flex-col space-y-2.5 ${
                  item.selected
                    ? 'bg-[#181818] border-[#d4af37]/70 shadow-lg'
                    : 'bg-[#141414] border-[#2d2d2d] opacity-75'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <button
                      onClick={() => handleToggleSelect(item.id)}
                      className="text-[#d4af37] focus:outline-none"
                    >
                      {item.selected ? (
                        <CheckSquare className="w-4 h-4 text-[#d4af37]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#555]" />
                      )}
                    </button>

                    {getCategoryBadge(item.category)}

                    <span className="text-[11px] text-[#777] font-mono">
                      Chapter: {item.chapterTitle}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleEdit(item.id)}
                    className="p-1 rounded text-[#888] hover:text-[#d4af37] hover:bg-[#222] transition flex items-center space-x-1 text-[11px]"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{item.isEditing ? 'Done' : 'Edit'}</span>
                  </button>
                </div>

                {/* Content / Edit Form */}
                {item.isEditing ? (
                  <div className="p-3 bg-[#1e1e1e] border border-[#333] rounded space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-[#888]">Term Title</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleUpdateItem(item.id, 'title', e.target.value)}
                          className="w-full bg-[#282828] border border-[#444] rounded px-2 py-1 text-xs text-[#e0e0e0]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-[#888]">Selected Text Phrase</label>
                        <input
                          type="text"
                          value={item.selectedText}
                          onChange={(e) => handleUpdateItem(item.id, 'selectedText', e.target.value)}
                          className="w-full bg-[#282828] border border-[#444] rounded px-2 py-1 text-xs text-[#e0e0e0]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-[#888]">Definition / Explanation</label>
                      <textarea
                        rows={2}
                        value={item.explanationOrDefinition}
                        onChange={(e) => handleUpdateItem(item.id, 'explanationOrDefinition', e.target.value)}
                        className="w-full bg-[#282828] border border-[#444] rounded px-2 py-1 text-xs text-[#e0e0e0]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-[#888]">Historical Details & Significance</label>
                      <textarea
                        rows={2}
                        value={item.historicalDetails}
                        onChange={(e) => handleUpdateItem(item.id, 'historicalDetails', e.target.value)}
                        className="w-full bg-[#282828] border border-[#444] rounded px-2 py-1 text-xs text-[#e0e0e0]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 pl-6">
                    <div className="flex items-baseline space-x-2">
                      <h3 className="text-xs font-bold text-[#f0f0f0]">{item.title}</h3>
                      {item.selectedText && (
                        <span className="text-[11px] text-[#d4af37] font-serif italic">
                          "{item.selectedText}"
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#cccccc] leading-relaxed">
                      {item.explanationOrDefinition}
                    </p>

                    {item.historicalDetails && (
                      <div className="p-2 bg-[#1c1e24] border border-[#2d3748] rounded text-[11px] text-[#a0aec0]">
                        <span className="font-semibold text-[#63b3ed] block">Historical Context:</span>
                        <span>{item.historicalDetails}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="h-48 flex flex-col items-center justify-center space-y-2 text-[#777] text-xs">
              <AlertCircle className="w-6 h-6 text-[#555]" />
              <p>No suggested annotations match your current category/search filter.</p>
            </div>
          )}
        </div>

        {/* Modal Footer Action Bar */}
        <div className="p-4 bg-[#181818] border-t border-[#2d2d2d] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#888]">
            <span className="font-semibold text-[#d4af37]">{selectedCount}</span> terms selected to import
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded text-xs font-medium bg-[#222] text-[#aaa] hover:bg-[#333] transition"
            >
              Cancel
            </button>

            <button
              onClick={handleBatchAddSelected}
              disabled={selectedCount === 0}
              id="batch-add-selected-annotations-btn"
              className="px-4 py-1.5 rounded text-xs font-bold bg-[#d4af37] hover:bg-[#e5c05e] text-black shadow transition disabled:opacity-40 flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4 text-black" />
              <span>Batch Add ({selectedCount}) Annotations</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
