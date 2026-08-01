import React, { useState } from 'react';
import { EbookProject, BookAnnotation } from '../types';
import { 
  BookMarked, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  UserCheck, 
  FileText, 
  Sparkles, 
  Languages, 
  BookOpen, 
  Filter,
  CheckCircle2,
  Wand2
} from 'lucide-react';
import { SuggestAnnotationsModal } from './SuggestAnnotationsModal';

interface AnnotationsViewProps {
  project: EbookProject;
  setProject: React.Dispatch<React.SetStateAction<EbookProject>>;
}

export const AnnotationsView: React.FC<AnnotationsViewProps> = ({ project, setProject }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showSuggestModal, setShowSuggestModal] = useState<boolean>(false);
  const [editingAnn, setEditingAnn] = useState<BookAnnotation | null>(null);

  // Form states
  const [title, setTitle] = useState<string>('');
  const [selectedText, setSelectedText] = useState<string>('');
  const [type, setType] = useState<BookAnnotation['type']>('footnote');
  const [chapterId, setChapterId] = useState<string>(project.chapters[0]?.id || '');
  const [explanationOrDefinition, setExplanationOrDefinition] = useState<string>('');
  const [historicalDetails, setHistoricalDetails] = useState<string>('');

  const annotations = project.annotations || [];

  const filteredAnnotations = annotations.filter((ann) => {
    const matchesType = filterType === 'all' || ann.type === filterType;
    const matchesSearch = 
      ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.selectedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.explanationOrDefinition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ann.historicalDetails && ann.historicalDetails.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const handleDeleteAnnotation = (id: string) => {
    setProject(prev => ({
      ...prev,
      annotations: (prev.annotations || []).filter(a => a.id !== id)
    }));
  };

  const handleOpenAddModal = () => {
    setEditingAnn(null);
    setTitle('');
    setSelectedText('');
    setType('footnote');
    setChapterId(project.chapters[0]?.id || '');
    setExplanationOrDefinition('');
    setHistoricalDetails('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (ann: BookAnnotation) => {
    setEditingAnn(ann);
    setTitle(ann.title);
    setSelectedText(ann.selectedText);
    setType(ann.type);
    setChapterId(ann.chapterId);
    setExplanationOrDefinition(ann.explanationOrDefinition);
    setHistoricalDetails(ann.historicalDetails || '');
    setShowAddModal(true);
  };

  const handleSaveAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !explanationOrDefinition.trim()) return;

    const chapter = project.chapters.find(c => c.id === chapterId);
    const chapterTitle = chapter ? chapter.title : 'General Book';

    if (editingAnn) {
      // Edit existing
      setProject(prev => ({
        ...prev,
        annotations: (prev.annotations || []).map(a => 
          a.id === editingAnn.id
            ? {
                ...a,
                title,
                selectedText,
                type,
                chapterId,
                chapterTitle,
                explanationOrDefinition,
                historicalDetails
              }
            : a
        )
      }));
    } else {
      // Add new
      const newAnn: BookAnnotation = {
        id: `ann-${Date.now()}`,
        title,
        selectedText,
        pane: 'source',
        chapterId,
        chapterTitle,
        type,
        explanationOrDefinition,
        historicalDetails,
        createdAt: new Date().toISOString()
      };

      setProject(prev => ({
        ...prev,
        annotations: [...(prev.annotations || []), newAnn]
      }));
    }

    setShowAddModal(false);
  };

  const getTypeBadge = (annType: BookAnnotation['type']) => {
    switch (annType) {
      case 'historical_character':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3b1d22] text-[#f87171] border border-[#7f1d1d] flex items-center gap-1"><UserCheck className="w-3 h-3" /> Historical Character</span>;
      case 'dictionary':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1e2a3a] text-[#60a5fa] border border-[#1e3a5f] flex items-center gap-1"><Languages className="w-3 h-3" /> Dictionary Gloss</span>;
      case 'foreign_idiom':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#382d1c] text-[#fbbf24] border border-[#78350f] flex items-center gap-1"><Sparkles className="w-3 h-3" /> Idiom / Foreign Term</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#222] text-[#d4af37] border border-[#444] flex items-center gap-1"><BookMarked className="w-3 h-3" /> Footnote Note</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 text-[#e0e0e0]">
      {/* Header Banner */}
      <div className="bg-[#161616] border border-[#333] rounded p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2a2a2a] text-[#d4af37] border border-[#444] uppercase tracking-wider">
              Scholarly Annotations & Footnotes Suite
            </span>
            <span className="text-xs text-[#888]">
              {annotations.length} Total Collected Notes
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-[#d4af37] mt-1">
            Book Annotations, Historical Characters & Glosses
          </h2>
          <p className="text-xs text-[#aaa]">
            Maintains historical context, non-English idioms, character biographies, and chapter endnotes.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setShowSuggestModal(true)}
            id="open-suggest-annotations-btn"
            className="px-3.5 py-1.5 rounded text-xs font-bold bg-[#282828] hover:bg-[#333] border border-[#d4af37]/60 text-[#d4af37] shadow transition flex items-center space-x-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>AI Auto-Detect Annotations</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-1.5 rounded text-xs font-bold bg-[#d4af37] hover:bg-[#e5c05e] text-black shadow transition flex items-center space-x-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-black" />
            <span>Add Custom Annotation</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#161616] border border-[#333] rounded p-3 shadow flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
          {['all', 'historical_character', 'dictionary', 'foreign_idiom', 'footnote'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition whitespace-nowrap ${
                filterType === t
                  ? 'bg-[#2a2a2a] text-[#d4af37] border border-[#d4af37]/50 font-bold'
                  : 'bg-[#1e1e1e] text-[#888] hover:text-[#e0e0e0]'
              }`}
            >
              {t === 'all' && 'All Types'}
              {t === 'historical_character' && 'Historical Figures'}
              {t === 'dictionary' && 'Dictionary Definitions'}
              {t === 'foreign_idiom' && 'Foreign Idioms'}
              {t === 'footnote' && 'Footnotes'}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-[#222] border border-[#333] rounded px-2.5 py-1 text-xs w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#666] mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search annotations, terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-[#e0e0e0] focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Annotations List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredAnnotations.length > 0 ? (
          filteredAnnotations.map((ann) => (
            <div 
              key={ann.id}
              className="bg-[#161616] border border-[#333] hover:border-[#d4af37]/60 rounded p-3.5 shadow-md transition flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  {getTypeBadge(ann.type)}
                  <span className="text-[10px] text-[#666] font-mono truncate max-w-[130px]">
                    {ann.chapterTitle}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-[#e0e0e0] leading-snug">{ann.title}</h3>

                {ann.selectedText && (
                  <div className="p-1.5 bg-[#1f1f1f] border-l-2 border-[#d4af37] text-[11px] text-[#d4af37] font-serif italic">
                    "{ann.selectedText}"
                  </div>
                )}

                <p className="text-xs text-[#c0c0c0] leading-relaxed">
                  {ann.explanationOrDefinition}
                </p>

                {ann.historicalDetails && (
                  <div className="p-2 bg-[#1a1c23] border border-[#2d3748] rounded text-[11px] text-[#a0aec0] leading-relaxed space-y-0.5">
                    <span className="font-semibold text-[#63b3ed] block">Historical Context & Significance:</span>
                    <span>{ann.historicalDetails}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#262626]">
                <button
                  onClick={() => handleOpenEditModal(ann)}
                  className="p-1 rounded text-[#888] hover:text-[#d4af37] hover:bg-[#222] transition"
                  title="Edit Annotation"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteAnnotation(ann.id)}
                  className="p-1 rounded text-[#888] hover:text-red-400 hover:bg-[#222] transition"
                  title="Delete Annotation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-[#161616] border border-[#333] rounded p-12 text-center text-[#666] space-y-2">
            <BookMarked className="w-8 h-8 text-[#444] mx-auto" />
            <p className="text-xs font-medium">No annotations match your search filter.</p>
            <button
              onClick={handleOpenAddModal}
              className="px-3 py-1 rounded text-xs font-bold bg-[#d4af37] text-black hover:bg-[#e5c05e] transition mt-2 inline-block"
            >
              Add First Annotation
            </button>
          </div>
        )}
      </div>

      {/* Modal: Add/Edit Annotation */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-[#333] rounded max-w-lg w-full p-5 text-[#e0e0e0] shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-[#d4af37]">
              {editingAnn ? 'Edit Annotation / Character' : 'Add New Annotation or Historical Character'}
            </h3>

            <form onSubmit={handleSaveAnnotation} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-[#aaa]">Category Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as BookAnnotation['type'])}
                    className="w-full bg-[#222] border border-[#333] rounded px-2.5 py-1.5 text-xs text-[#e0e0e0] focus:border-[#d4af37]"
                  >
                    <option value="historical_character">Historical Character</option>
                    <option value="dictionary">Dictionary Definition</option>
                    <option value="foreign_idiom">Foreign Idiom / Term</option>
                    <option value="footnote">Standard Footnote Note</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#aaa]">Associated Chapter</label>
                  <select
                    value={chapterId}
                    onChange={(e) => setChapterId(e.target.value)}
                    className="w-full bg-[#222] border border-[#333] rounded px-2.5 py-1.5 text-xs text-[#e0e0e0] focus:border-[#d4af37]"
                  >
                    {project.chapters.map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#aaa]">Annotation Title / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Tullius Cicero or Lucubratio"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#222] border border-[#333] rounded px-2.5 py-1.5 text-xs text-[#e0e0e0] focus:border-[#d4af37]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#aaa]">Selected Manuscript Text / Phrase</label>
                <input
                  type="text"
                  placeholder="e.g. Marce fili or honestum"
                  value={selectedText}
                  onChange={(e) => setSelectedText(e.target.value)}
                  className="w-full bg-[#222] border border-[#333] rounded px-2.5 py-1.5 text-xs text-[#e0e0e0] focus:border-[#d4af37]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#aaa]">Definition / Explanation</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide clear English explanation, dictionary meaning, or footnote..."
                  value={explanationOrDefinition}
                  onChange={(e) => setExplanationOrDefinition(e.target.value)}
                  className="w-full bg-[#222] border border-[#333] rounded px-2.5 py-1.5 text-xs text-[#e0e0e0] focus:border-[#d4af37]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#aaa]">Historical Context & Character Biography (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Details relevant to the story, historical dates, or political background..."
                  value={historicalDetails}
                  onChange={(e) => setHistoricalDetails(e.target.value)}
                  className="w-full bg-[#222] border border-[#333] rounded px-2.5 py-1.5 text-xs text-[#e0e0e0] focus:border-[#d4af37]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#333]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded text-xs font-medium text-[#aaa] bg-[#222]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded text-xs font-bold bg-[#d4af37] text-black hover:bg-[#e5c05e] transition"
                >
                  Save Annotation
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
      />
    </div>
  );
};
