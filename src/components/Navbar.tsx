import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  ScanLine, 
  BarChart3, 
  Download, 
  Sparkles,
  Layers,
  ShieldCheck,
  Upload,
  Link,
  BookMarked,
  X,
  RefreshCw,
  FileCode,
  Save,
  RotateCcw,
  HardDrive,
  Mail,
  Trash2,
  Crown
} from 'lucide-react';
import { EbookProject } from '../types';
import { parseEpubFile, sanitizeXhtmlForPreview, countWordsFromXhtml } from '../utils/epubParser';
import { parsePdfFile } from '../utils/pdfParser';

interface NavbarProps {
  activeTab: 'editor' | 'library' | 'ocr' | 'analytics' | 'annotations' | 'mancala';
  setActiveTab: (tab: 'editor' | 'library' | 'ocr' | 'analytics' | 'annotations' | 'mancala') => void;
  project: EbookProject;
  setProject: React.Dispatch<React.SetStateAction<EbookProject>>;
  onOpenExportModal: () => void;
  lastSavedAt?: string | null;
  onSaveSnapshot?: () => void;
  onOpenRestoreModal?: () => void;
  backupCount?: number;
  onOpenContactModal?: () => void;
  onClearActiveDocument?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  project,
  setProject,
  onOpenExportModal,
  lastSavedAt,
  onSaveSnapshot,
  onOpenRestoreModal,
  backupCount = 0,
  onOpenContactModal,
  onClearActiveDocument
}) => {
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pastedUrl, setPastedUrl] = useState<string>('');
  const [isFetchingUrl, setIsFetchingUrl] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);

  // File Upload Handler (.epub, .xhtml, .txt, .pdf, .mobi)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameLower = file.name.toLowerCase();
    setIsParsingFile(true);

    try {
      // 1. If EPUB or MOBI (Zip / Archive format)
      if (fileNameLower.endsWith('.epub') || fileNameLower.endsWith('.kepub.epub') || fileNameLower.endsWith('.mobi')) {
        const parsedProject = await parseEpubFile(file);
        setProject(parsedProject);
        setActiveTab('editor');
        setIsParsingFile(false);
        return;
      }

      // 2. If PDF Document
      if (fileNameLower.endsWith('.pdf')) {
        const parsedPdfProject = await parsePdfFile(file);
        setProject(parsedPdfProject);
        setActiveTab('editor');
        setIsParsingFile(false);
        return;
      }

      // 3. Plain Text / XHTML / HTML
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawContent = (event.target?.result as string) || '';
        const { cleanXhtml, extractedCss } = sanitizeXhtmlForPreview(rawContent);

        const wordCount = countWordsFromXhtml(cleanXhtml);
        const sentenceCount = (cleanXhtml.match(/[.!?;:]+(\s|$)/g) || []).length || Math.ceil(wordCount / 18);

        const newChapter = {
          id: `uploaded-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          originalXhtml: cleanXhtml,
          translatedXhtml: '',
          originalWordCount: wordCount,
          translatedWordCount: 0,
          sentenceCountOriginal: sentenceCount,
          sentenceCountTranslated: 0,
          status: 'pending' as const
        };

        setProject(prev => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, ''),
          cssContent: prev.cssContent + (extractedCss ? '\n' + extractedCss : ''),
          chapters: [newChapter]
        }));

        setActiveTab('editor');
        setIsParsingFile(false);
      };

      reader.readAsText(file);
    } catch (err: any) {
      console.error('[File Import Error]', err);
      alert(`Could not parse document: ${err.message || 'Error processing file'}`);
      setIsParsingFile(false);
    }
  };

  // Paste Book Link / URL Handler
  const handleFetchBookUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedUrl.trim()) return;

    setIsFetchingUrl(true);
    setFetchError(null);

    try {
      const res = await fetch('/api/fetch-book-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: pastedUrl.trim() })
      });

      if (!res.ok) throw new Error('Failed to fetch online book file.');

      const data = await res.json();

      if (data.chapters && data.chapters.length > 0) {
        setProject(prev => ({
          ...prev,
          title: data.title || 'Online Ebook Import',
          author: data.author || 'Classical Author',
          sourceLanguage: data.sourceLanguage || 'latin',
          era: data.era || 'Online Edition',
          description: data.description || `Imported from ${pastedUrl}`,
          chapters: data.chapters.map((ch: any, idx: number) => ({
            id: `url-ch-${idx + 1}`,
            title: ch.title || `Chapter ${idx + 1}`,
            originalXhtml: ch.originalXhtml || '<p>Content preview</p>',
            translatedXhtml: '',
            originalWordCount: (ch.originalXhtml || '').replace(/<[^>]*>/g, ' ').split(/\s+/).length,
            translatedWordCount: 0,
            sentenceCountOriginal: 10,
            sentenceCountTranslated: 0,
            status: 'pending'
          }))
        }));

        setShowPasteModal(false);
        setPastedUrl('');
        setActiveTab('editor');
      } else {
        throw new Error('No readable chapters found at the provided URL.');
      }
    } catch (err: any) {
      setFetchError(err.message || 'Error fetching book link');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  return (
    <header className="bg-[#1a1a1a] border-b border-[#333] text-[#e0e0e0] sticky top-0 z-50">
      
      {/* Top Bar: Brand & Export Ebook Option */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-11">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-[#d4af37] rounded flex items-center justify-center text-black font-bold text-[10px] shrink-0">
              VN
            </div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xs font-bold tracking-tight text-[#d4af37] flex items-center gap-1.5 font-mono">
                VERBA NOVA II
                <span className="text-[#888] font-normal hidden md:inline text-[10px]">| Illuminated Ebook Translator</span>
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-2 border-l border-[#333] pl-3 text-[11px] text-[#888]">
              <span>Active: <strong className="text-[#e0e0e0] font-medium">{project.title}</strong></span>
              {onClearActiveDocument && (
                <button
                  onClick={onClearActiveDocument}
                  id="clear-active-doc-btn"
                  className="p-1 rounded hover:bg-[#2a2a2a] text-[#888] hover:text-red-400 border border-transparent hover:border-[#444] transition flex items-center gap-1 cursor-pointer"
                  title="Clear Active Document (Empties Source Pane & Book Chapters)"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#888] hover:text-red-400" />
                  <span className="text-[10px] hidden xl:inline">Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Status & Export Ebook Button (Calibre Plugin button removed as requested) */}
          <div className="flex items-center space-x-2">
            <div className="hidden md:flex items-center space-x-2 text-[10px]">
              <span className="px-2 py-0.5 rounded bg-[#1e3a2e] border border-[#2d5a44] text-[#4ade80] flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3 text-[#4ade80]" />
                100% Tag Integrity
              </span>
            </div>

            {onOpenContactModal && (
              <button
                onClick={onOpenContactModal}
                id="contact-support-btn"
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#222] hover:bg-[#2a2a2a] text-[#e0e0e0] border border-[#3a3a3a] font-semibold text-xs transition"
                title="Open Verba Nova Directory & Support Emails (verbanovae.com)"
              >
                <Mail className="w-3.5 h-3.5 text-[#d4af37]" />
                <span className="hidden sm:inline">Contact & Support</span>
              </button>
            )}

            <button
              onClick={onOpenExportModal}
              id="export-epub-btn"
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded bg-[#d4af37] hover:bg-[#e5c05e] text-black font-bold text-xs shadow-sm transition"
              title="Open Export Ebook Submenu Modal (PDF, EPUB, MOBI, TXT, etc.)"
            >
              <Download className="w-3.5 h-3.5 text-black" />
              <span>Export Ebook</span>
            </button>
          </div>
        </div>
      </div>

      {/* FIRST ROW: Media Input Options */}
      <div className="bg-[#141414] border-t border-[#2d2d2d] px-4 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center space-x-2 overflow-x-auto text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#d4af37] pr-2 border-r border-[#333] shrink-0">
            Media Input:
          </span>

          {/* Option 1: Import Ebook File */}
          <label className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#222] hover:bg-[#2a2a2a] border border-[#333] hover:border-[#d4af37] text-[#e0e0e0] font-medium transition cursor-pointer shrink-0">
            {isParsingFile ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-[#d4af37] animate-spin" />
                <span className="text-[#d4af37]">Digitizing PDF / Ebook...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Upload Ebook / PDF File</span>
              </>
            )}
            <input 
              type="file" 
              accept=".epub,.xhtml,.html,.txt,.pdf,.mobi" 
              onChange={handleFileUpload} 
              disabled={isParsingFile}
              className="hidden" 
            />
          </label>

          {/* Option 2: Paste Book Link */}
          <button
            onClick={() => setShowPasteModal(true)}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#222] hover:bg-[#2a2a2a] border border-[#333] hover:border-[#4a90e2] text-[#e0e0e0] font-medium transition shrink-0"
          >
            <Link className="w-3.5 h-3.5 text-[#4a90e2]" />
            <span>Paste Online Book Link</span>
          </button>

          {/* Option 3: Classical Library Search */}
          <button
            onClick={() => setActiveTab('library')}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded border text-xs font-medium transition shrink-0 ${
              activeTab === 'library'
                ? 'bg-[#2a2a2a] border-[#d4af37] text-[#d4af37] font-bold'
                : 'bg-[#1a1a1a] border-[#333] text-[#aaa] hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-[#4a90e2]" />
            <span>Classical Library Search</span>
          </button>

          {/* Option 4: Manuscript OCR Scan */}
          <button
            onClick={() => setActiveTab('ocr')}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded border text-xs font-medium transition shrink-0 ${
              activeTab === 'ocr'
                ? 'bg-[#2a2a2a] border-[#d4af37] text-[#d4af37] font-bold'
                : 'bg-[#1a1a1a] border-[#333] text-[#aaa] hover:text-white'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Manuscript OCR Scan</span>
          </button>
        </div>
      </div>

      {/* SECOND DIVISION / ROW: Session Views Tabs */}
      <div className="bg-[#181818] border-t border-[#333] px-4 py-1">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 overflow-x-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#888] pr-2 border-r border-[#333] shrink-0">
            Session Views:
          </span>

          <button
            onClick={() => setActiveTab('editor')}
            id="nav-tab-editor"
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'editor'
                ? 'bg-[#282828] text-[#d4af37] border-b-2 border-[#d4af37] font-semibold'
                : 'text-[#aaa] hover:text-white hover:bg-[#222]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Studio Ebook Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            id="nav-tab-analytics"
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-[#282828] text-[#4ade80] border-b-2 border-[#4ade80] font-semibold'
                : 'text-[#aaa] hover:text-white hover:bg-[#222]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#4ade80]" />
            <span>Word-Count & Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('annotations')}
            id="nav-tab-annotations"
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'annotations'
                ? 'bg-[#282828] text-[#4a90e2] border-b-2 border-[#4a90e2] font-semibold'
                : 'text-[#aaa] hover:text-white hover:bg-[#222]'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5 text-[#4a90e2]" />
            <span>Annotations & Footnotes</span>
          </button>

          <button
            onClick={() => setActiveTab('mancala')}
            id="nav-tab-mancala"
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition whitespace-nowrap ${
              activeTab === 'mancala'
                ? 'bg-[#282828] text-[#d4af37] border-b-2 border-[#d4af37] font-semibold'
                : 'text-[#aaa] hover:text-white hover:bg-[#222]'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Mancala Solver</span>
          </button>

          {/* Session Restore Point Status Widget */}
          <div className="ml-auto flex items-center space-x-2 pl-4 border-l border-[#333] shrink-0 text-xs">
            <span className="text-[11px] text-[#888] flex items-center space-x-1">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Saved: {backupCount}/5 {lastSavedAt ? `(${lastSavedAt})` : ''}
              </span>
            </span>

            {onSaveSnapshot && (
              <button
                onClick={onSaveSnapshot}
                id="nav-save-progress-btn"
                title="Save current progress of translated book"
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center space-x-1 text-xs shadow-sm"
              >
                <Save className="w-3.5 h-3.5 text-white" />
                <span>Save Book Progress</span>
              </button>
            )}

            {onOpenRestoreModal && (
              <button
                onClick={onOpenRestoreModal}
                id="nav-previous-books-btn"
                title="View list of previous 5 saved/completed books"
                className="px-2.5 py-1 rounded bg-[#222] hover:bg-[#2a2a2a] text-[#d4af37] border border-[#d4af37]/50 transition flex items-center space-x-1 text-xs font-semibold"
              >
                <BookMarked className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Previous 5 Books ({backupCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Paste Book URL */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-[#333] rounded max-w-lg w-full p-5 text-[#e0e0e0] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#333] pb-2">
              <h3 className="text-sm font-bold text-[#d4af37] flex items-center gap-1.5">
                <Link className="w-4 h-4 text-[#4a90e2]" />
                <span>Paste Link to Online Ebook File</span>
              </h3>
              <button onClick={() => setShowPasteModal(false)} className="text-[#888] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFetchBookUrl} className="space-y-3 text-xs">
              <p className="text-[#aaa] leading-relaxed">
                Paste a link to a Gutenberg text, Gallica BnF URL, or web manuscript file. Verba Nova II will fetch and structure the text for translation.
              </p>

              <div className="space-y-1">
                <label className="font-semibold text-[#888]">Ebook URL or Web Link</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.gutenberg.org/files/1497/1497-h/1497-h.htm"
                  value={pastedUrl}
                  onChange={(e) => setPastedUrl(e.target.value)}
                  className="w-full bg-[#222] border border-[#333] rounded px-3 py-2 text-xs text-[#e0e0e0] focus:outline-none focus:border-[#4a90e2] font-mono"
                />
              </div>

              {fetchError && (
                <div className="p-2 rounded bg-[#3b1d1d] border border-[#7f1d1d] text-red-300 text-[11px]">
                  {fetchError}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#333]">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-3 py-1.5 rounded text-xs font-medium text-[#aaa] bg-[#222]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFetchingUrl}
                  className="px-4 py-1.5 rounded text-xs font-bold bg-[#4a90e2] hover:bg-[#3b82f6] text-white shadow transition flex items-center space-x-1.5"
                >
                  {isFetchingUrl ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Fetching Book...</span>
                    </>
                  ) : (
                    <span>Import & Load Ebook</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </header>
  );
};
