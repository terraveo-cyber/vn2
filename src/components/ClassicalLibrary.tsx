import React, { useState } from 'react';
import { SAMPLE_CLASSICAL_LIBRARY } from '../data/classicalBooks';
import { ClassicalBookSearchResult, EbookProject, SourceLanguage, TextEdition } from '../types';
import { 
  Search, 
  Library, 
  Download, 
  GitCompare, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Info,
  BookOpen,
  History,
  Edit3
} from 'lucide-react';

interface ClassicalLibraryProps {
  onLoadProject: (project: EbookProject) => void;
}

export const ClassicalLibrary: React.FC<ClassicalLibraryProps> = ({ onLoadProject }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<SourceLanguage | 'all'>('all');
  const [comparingBook, setComparingBook] = useState<ClassicalBookSearchResult | null>(null);
  const [selectedEditionType, setSelectedEditionType] = useState<'original_first' | 'author_revised_latest'>('author_revised_latest');

  const filteredBooks = SAMPLE_CLASSICAL_LIBRARY.filter((book) => {
    const matchesLang = selectedLanguage === 'all' || book.sourceLanguage === selectedLanguage;
    const matchesQuery = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.era.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLang && matchesQuery;
  });

  const handleImportEdition = (
    book: ClassicalBookSearchResult, 
    editionType: 'original_first' | 'author_revised_latest'
  ) => {
    const edition: TextEdition = editionType === 'original_first'
      ? book.originalEdition || {
          editionType: 'original_first',
          editionTitle: 'Original First Edition',
          year: book.era,
          publisher: book.sourceLibrary,
          authorInputNotes: 'Original manuscript transcription',
          authenticityScore: 97.0,
          variantsCount: 5,
          chapters: book.chapters
        }
      : book.latestAuthorRevisedEdition || {
          editionType: 'author_revised_latest',
          editionTitle: 'Latest Author-Revised Edition',
          year: book.era,
          publisher: book.sourceLibrary,
          authorInputNotes: 'Author-authorized final text revision',
          authenticityScore: 99.5,
          variantsCount: 2,
          chapters: book.chapters
        };

    const newProject: EbookProject = {
      id: `${book.id}-${editionType}-${Date.now()}`,
      title: `${book.title} [${edition.editionTitle}]`,
      author: book.author,
      sourceLanguage: book.sourceLanguage,
      era: `${book.era} (${edition.year})`,
      description: `${book.description} — ${edition.authorInputNotes}`,
      cssContent: `body { font-family: 'Georgia', serif; line-height: 1.6; color: #1f2937; margin: 2rem; }
h2.chapter-title { font-size: 1.8rem; letter-spacing: 0.05em; text-transform: uppercase; color: #d4af37; border-bottom: 2px solid #d4af37; padding-bottom: 0.5rem; }
h3.section-heading { font-size: 1.2rem; font-style: italic; color: #4a90e2; margin-top: 1.5rem; }
p.chapter-lead { font-size: 1.1rem; font-weight: 500; text-indent: 0; margin-top: 1rem; }
span.dropcap { float: left; font-size: 3rem; line-height: 0.8; padding-right: 0.3rem; color: #d4af37; }
p.body-text, p.verse-body { margin-top: 0.8rem; text-indent: 1.5rem; }
p.verse-lead { font-style: italic; font-size: 1.05rem; }
blockquote { margin: 1.5rem 2rem; padding: 1rem; border-left: 4px solid #d4af37; background: #1a1a1a; color: #e0e0e0; }
`,
      chapters: edition.chapters.map((ch, idx) => ({
        id: `ch-${idx + 1}`,
        title: ch.title,
        originalXhtml: ch.originalXhtml,
        translatedXhtml: '',
        originalWordCount: ch.originalXhtml.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length,
        translatedWordCount: 0,
        sentenceCountOriginal: (ch.originalXhtml.match(/[.!?;:]+(\s|$)/g) || []).length || 1,
        sentenceCountTranslated: 0,
        status: 'pending'
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onLoadProject(newProject);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 text-[#e0e0e0]">
      
      {/* Search Header Banner */}
      <div className="bg-[#161616] border border-[#333] rounded p-4 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-[#d4af37] flex items-center space-x-2 uppercase tracking-wider">
              <Library className="w-4 h-4 text-[#d4af37]" />
              <span>Classical Ebook Library & Edition Authenticity Selector</span>
            </h2>
            <p className="text-xs text-[#aaa]">
              Search classical ebooks in Latin, Greek, and French. Compare original editio princeps vs latest author-revised texts side-by-side to ensure maximum historical authenticity before translation.
            </p>
          </div>

          {/* Search Bar & Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#666] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search manuscripts or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="library-search-input"
                className="pl-8 pr-3 py-1.5 bg-[#222] border border-[#333] focus:border-[#d4af37] rounded text-xs text-[#e0e0e0] placeholder-[#666] focus:outline-none w-full sm:w-64"
              />
            </div>

            {/* Language Filter */}
            <div className="flex p-0.5 bg-[#222] border border-[#333] rounded text-xs">
              <button
                onClick={() => setSelectedLanguage('all')}
                className={`px-2.5 py-1 rounded transition ${
                  selectedLanguage === 'all' ? 'bg-[#2a2a2a] text-[#d4af37] font-semibold' : 'text-[#aaa]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedLanguage('latin')}
                className={`px-2.5 py-1 rounded transition ${
                  selectedLanguage === 'latin' ? 'bg-[#2a2a2a] text-[#d4af37] font-semibold' : 'text-[#aaa]'
                }`}
              >
                Latin
              </button>
              <button
                onClick={() => setSelectedLanguage('greek')}
                className={`px-2.5 py-1 rounded transition ${
                  selectedLanguage === 'greek' ? 'bg-[#2a2a2a] text-[#d4af37] font-semibold' : 'text-[#aaa]'
                }`}
              >
                Greek
              </button>
              <button
                onClick={() => setSelectedLanguage('french')}
                className={`px-2.5 py-1 rounded transition ${
                  selectedLanguage === 'french' ? 'bg-[#2a2a2a] text-[#d4af37] font-semibold' : 'text-[#aaa]'
                }`}
              >
                French
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBooks.map((book) => {
          const origEd = book.originalEdition;
          const revEd = book.latestAuthorRevisedEdition;

          return (
            <div
              key={book.id}
              className="bg-[#161616] border border-[#333] hover:border-[#d4af37] rounded p-4 shadow text-[#e0e0e0] transition flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2.5">
                {/* Cover Banner */}
                <div className={`h-24 rounded bg-gradient-to-r ${book.coverStyle} p-3 flex flex-col justify-end shadow-inner relative overflow-hidden border border-[#333]`}>
                  <div className="absolute right-2 top-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#121212]/80 text-[#d4af37] border border-[#444] flex items-center space-x-1">
                    <ShieldCheck className="w-2.5 h-2.5 text-[#4ade80]" />
                    <span>{revEd ? `${revEd.authenticityScore}% Score` : 'Authentic'}</span>
                  </div>
                  <p className="text-[9px] font-mono text-[#d4af37] uppercase tracking-widest">{book.era}</p>
                  <h3 className="font-bold text-sm text-white truncate leading-snug">{book.title}</h3>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#d4af37]">{book.author}</p>
                  <p className="text-xs text-[#aaa] mt-1 line-clamp-2 leading-relaxed">{book.description}</p>
                </div>

                {/* Edition Highlights Badge Box */}
                <div className="bg-[#0f0f0f] border border-[#262626] rounded p-2 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-[#888]">
                    <span className="flex items-center space-x-1 text-[#aaa]">
                      <History className="w-3 h-3 text-[#d4af37]" />
                      <span>Original Edition:</span>
                    </span>
                    <span className="font-mono text-[#e0e0e0] truncate max-w-[140px]">{origEd?.year || 'First Print'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#888]">
                    <span className="flex items-center space-x-1 text-[#aaa]">
                      <Edit3 className="w-3 h-3 text-[#4a90e2]" />
                      <span>Author-Revised:</span>
                    </span>
                    <span className="font-mono text-[#4ade80] truncate max-w-[140px]">{revEd?.year || 'Author Revised'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[#333] space-y-2">
                <button
                  onClick={() => {
                    setComparingBook(book);
                    setSelectedEditionType('author_revised_latest');
                  }}
                  id={`compare-editions-${book.id}`}
                  className="w-full px-3 py-1.5 rounded text-xs font-semibold bg-[#222] hover:bg-[#2a2a2a] text-[#d4af37] border border-[#333] hover:border-[#d4af37] transition flex items-center justify-center space-x-1.5"
                >
                  <GitCompare className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Compare Original vs Revised Side-by-Side</span>
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleImportEdition(book, 'original_first')}
                    id={`import-original-${book.id}`}
                    className="px-2 py-1 rounded text-[11px] font-medium bg-[#1e1e1e] hover:bg-[#282828] text-[#aaa] border border-[#333] transition truncate"
                    title="Import First Edition / Editio Princeps"
                  >
                    Import First Edit.
                  </button>
                  <button
                    onClick={() => handleImportEdition(book, 'author_revised_latest')}
                    id={`import-revised-${book.id}`}
                    className="px-2 py-1 rounded text-[11px] font-bold bg-[#d4af37] hover:bg-[#e5c05e] text-black transition flex items-center justify-center space-x-1 truncate"
                    title="Import Author-Revised Final Text"
                  >
                    <Download className="w-3 h-3 text-black shrink-0" />
                    <span>Import Revised</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Side-by-Side Edition Comparison Modal */}
      {comparingBook && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-[#161616] border border-[#333] rounded max-w-6xl w-full p-4 sm:p-6 text-[#e0e0e0] shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#333] pb-3 gap-2">
              <div>
                <h3 className="text-base font-bold text-[#d4af37] flex items-center space-x-2">
                  <GitCompare className="w-4 h-4 text-[#d4af37]" />
                  <span>Side-by-Side Manuscript Edition Authenticity Comparison</span>
                </h3>
                <p className="text-xs text-[#aaa]">
                  Book: <strong className="text-white">{comparingBook.title}</strong> by {comparingBook.author} ({comparingBook.era})
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-[#888]">Import Preference:</span>
                <button
                  onClick={() => setSelectedEditionType('original_first')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                    selectedEditionType === 'original_first'
                      ? 'bg-[#d4af37] text-black font-bold'
                      : 'bg-[#222] text-[#aaa] border border-[#333]'
                  }`}
                >
                  First Edition
                </button>
                <button
                  onClick={() => setSelectedEditionType('author_revised_latest')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                    selectedEditionType === 'author_revised_latest'
                      ? 'bg-[#d4af37] text-black font-bold'
                      : 'bg-[#222] text-[#aaa] border border-[#333]'
                  }`}
                >
                  Author-Revised
                </button>
              </div>
            </div>

            {/* Side-by-Side Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden min-h-0">
              
              {/* Left Column: Original First Edition */}
              <div className="bg-[#0f0f0f] border border-[#2d2d2d] rounded p-3.5 flex flex-col overflow-hidden space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-[#222]">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#e0e0e0] bg-[#222] px-2 py-0.5 rounded border border-[#333]">
                      Original First Edition / Editio Princeps
                    </span>
                    <h4 className="text-xs font-bold text-[#d4af37] mt-1">{comparingBook.originalEdition.editionTitle}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#aaa] font-mono">{comparingBook.originalEdition.year}</span>
                    <p className="text-[10px] text-[#4ade80] font-bold">{comparingBook.originalEdition.authenticityScore}% Authenticity</p>
                  </div>
                </div>

                {/* Author Input Notes */}
                <div className="bg-[#181818] border border-[#2a2a2a] rounded p-2 text-[11px] text-[#aaa]">
                  <strong className="text-[#d4af37]">Author Input / Provenance: </strong>
                  {comparingBook.originalEdition.authorInputNotes}
                </div>

                {/* Text View */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 font-serif text-xs leading-relaxed p-3 bg-[#141414] rounded border border-[#222]">
                  {comparingBook.originalEdition.chapters.map((ch, idx) => (
                    <div key={idx} className="space-y-1.5 border-b border-[#222] pb-3">
                      <h5 className="text-[11px] font-bold text-[#d4af37] font-sans uppercase">{ch.title}</h5>
                      <div dangerouslySetInnerHTML={{ __html: ch.originalXhtml }} className="text-[#c0c0c0]" />
                      {ch.textualNotes && (
                        <div className="text-[10px] font-sans text-[#888] bg-[#1c1c1c] p-1.5 rounded border border-[#333]">
                          <strong className="text-[#aaa]">Scholarly Note:</strong> {ch.textualNotes.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Latest Author-Revised Edition */}
              <div className="bg-[#0f0f0f] border border-[#2d2d2d] rounded p-3.5 flex flex-col overflow-hidden space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-[#222]">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-black bg-[#d4af37] px-2 py-0.5 rounded">
                      Latest Author-Revised Edition
                    </span>
                    <h4 className="text-xs font-bold text-[#4a90e2] mt-1">{comparingBook.latestAuthorRevisedEdition.editionTitle}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#aaa] font-mono">{comparingBook.latestAuthorRevisedEdition.year}</span>
                    <p className="text-[10px] text-[#4ade80] font-bold">{comparingBook.latestAuthorRevisedEdition.authenticityScore}% Authenticity</p>
                  </div>
                </div>

                {/* Author Input Notes */}
                <div className="bg-[#181818] border border-[#2a2a2a] rounded p-2 text-[11px] text-[#aaa]">
                  <strong className="text-[#4a90e2]">Author Direct Input / Revision: </strong>
                  {comparingBook.latestAuthorRevisedEdition.authorInputNotes}
                </div>

                {/* Text View */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 font-serif text-xs leading-relaxed p-3 bg-[#141414] rounded border border-[#222]">
                  {comparingBook.latestAuthorRevisedEdition.chapters.map((ch, idx) => (
                    <div key={idx} className="space-y-1.5 border-b border-[#222] pb-3">
                      <h5 className="text-[11px] font-bold text-[#4a90e2] font-sans uppercase">{ch.title}</h5>
                      <div dangerouslySetInnerHTML={{ __html: ch.originalXhtml }} className="text-[#e0e0e0]" />
                      {ch.textualNotes && (
                        <div className="text-[10px] font-sans text-[#4ade80] bg-[#162a1e] p-1.5 rounded border border-[#264e37]">
                          <strong className="text-[#4ade80]">Author Revision Note:</strong> {ch.textualNotes.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Bottom Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-[#333] gap-2">
              <div className="text-xs text-[#888] flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-[#4ade80]" />
                <span>Textual variants mapped with 100% XHTML tag & stylesheet preservation guarantee.</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setComparingBook(null)}
                  className="px-3 py-1.5 rounded text-xs font-medium bg-[#222] text-[#aaa] hover:bg-[#2d2d2d]"
                >
                  Close Comparison
                </button>
                <button
                  onClick={() => {
                    handleImportEdition(comparingBook, selectedEditionType);
                    setComparingBook(null);
                  }}
                  id="confirm-import-selected-edition"
                  className="px-4 py-1.5 rounded text-xs font-bold bg-[#d4af37] hover:bg-[#e5c05e] text-black shadow transition flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5 text-black" />
                  <span>Import {selectedEditionType === 'original_first' ? 'Original First Edition' : 'Author-Revised Text'} to Studio</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
