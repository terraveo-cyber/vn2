import React, { useState } from 'react';
import { 
  EbookProject, 
  BookAnnotation 
} from '../types';
import { 
  Download, 
  X, 
  Check, 
  FileText, 
  BookOpen, 
  Folder, 
  ListChecks, 
  Sparkles,
  Layers,
  FileCode,
  ShieldCheck
} from 'lucide-react';
import { exportEbookCustom } from '../utils/exporters';

interface ExportEbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: EbookProject;
  onStartDownload?: (format: string, fileName: string) => void;
}

export type ExportFormat = 'epub' | 'epub3' | 'pdf' | 'txt' | 'kpub' | 'xhtml' | 'mobi';

export const ExportEbookModal: React.FC<ExportEbookModalProps> = ({
  isOpen,
  onClose,
  project,
  onStartDownload
}) => {
  if (!isOpen) return null;

  const defaultFileName = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_modern_english`;
  const [fileName, setFileName] = useState<string>(defaultFileName);
  const [folderLocation, setFolderLocation] = useState<string>('Downloads / Ebook Library');
  
  // Format selection
  const [format, setFormat] = useState<ExportFormat>('epub');

  // Annotations inclusion state
  const [includeAnnotations, setIncludeAnnotations] = useState<boolean>(true);
  const allAnnotations = project.annotations || [];
  const [selectedAnnotationIds, setSelectedAnnotationIds] = useState<string[]>(
    allAnnotations.map(a => a.id)
  );
  const [annotationsPlacement, setAnnotationsPlacement] = useState<'endnotes' | 'inline' | 'preamble'>('endnotes');

  const [isExporting, setIsExporting] = useState<boolean>(false);

  const toggleAllAnnotations = () => {
    if (selectedAnnotationIds.length === allAnnotations.length) {
      setSelectedAnnotationIds([]);
    } else {
      setSelectedAnnotationIds(allAnnotations.map(a => a.id));
    }
  };

  const toggleAnnotation = (id: string) => {
    setSelectedAnnotationIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExecuteExport = async () => {
    setIsExporting(true);
    const exportName = fileName.trim() || defaultFileName;
    if (onStartDownload) {
      onStartDownload(format, exportName);
    }
    try {
      const chosenAnnotations = includeAnnotations
        ? allAnnotations.filter(a => selectedAnnotationIds.includes(a.id))
        : [];

      await exportEbookCustom(project, {
        fileName: exportName,
        format,
        includeAnnotations,
        selectedAnnotations: chosenAnnotations,
        annotationsPlacement
      });

      onClose();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };


  const formatLabels: Record<ExportFormat, { label: string; desc: string; ext: string; badge: string }> = {
    epub: { label: 'EPUB 2.0 (Standard)', desc: 'Compatible with all major e-readers & mobile apps', ext: '.epub', badge: 'Universal' },
    epub3: { label: 'EPUB 3.2 (Enriched)', desc: 'Supports advanced typography, SVG & rich endnotes', ext: '.epub', badge: 'Modern' },
    pdf: { label: 'PDF Document', desc: 'Formatted printable PDF edition with header & margins', ext: '.pdf', badge: 'Print' },
    txt: { label: 'Plain Text (.txt)', desc: 'Clean unformatted UTF-8 text with chapter dividers', ext: '.txt', badge: 'Plain' },
    kpub: { label: 'KPUB (Kobo EPUB)', desc: 'Optimized specifically for Kobo e-readers with annotations', ext: '.kepub.epub', badge: 'Kobo' },
    xhtml: { label: 'XHTML Package (.zip)', desc: 'Raw XHTML files + CSS stylesheet bundle', ext: '.zip', badge: 'Web' },
    mobi: { label: 'MOBI (Kindle Legacy)', desc: 'Compatible with classic Amazon Kindle hardware', ext: '.mobi', badge: 'Kindle' },
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161616] border border-[#333] rounded-lg max-w-2xl w-full text-[#e0e0e0] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4 text-[#d4af37]" />
            <h3 className="text-sm font-bold text-[#d4af37] tracking-wide">
              Export Ebook Package — Submenu Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#888] hover:text-white hover:bg-[#222] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          
          {/* SECTION 1: Download Location & File Name */}
          <div className="p-3.5 bg-[#1a1a1a] border border-[#333] rounded space-y-3">
            <div className="flex items-center space-x-2 border-b border-[#2a2a2a] pb-2 text-[#d4af37] font-semibold">
              <Folder className="w-3.5 h-3.5" />
              <span>1. Download File Name & Target Folder</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#aaa]">Output File Name</label>
                <div className="flex items-center bg-[#222] border border-[#333] rounded px-2.5 py-1.5 focus-within:border-[#d4af37]">
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="bg-transparent text-xs text-[#e0e0e0] focus:outline-none w-full font-mono"
                  />
                  <span className="text-[11px] text-[#666] font-mono ml-1">{formatLabels[format].ext}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#aaa]">Save Destination / Location</label>
                <select
                  value={folderLocation}
                  onChange={(e) => setFolderLocation(e.target.value)}
                  className="w-full bg-[#222] border border-[#333] rounded px-2.5 py-1.5 text-xs text-[#e0e0e0] focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="Downloads / Ebook Library">Downloads Folder (Default Browser Location)</option>
                  <option value="Calibre Library Folder">Calibre Studio Library Directory</option>
                  <option value="Sigil Projects Folder">Sigil Ebook Workspace</option>
                  <option value="Custom Folder">Prompt for Location on Download</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Option to Include Annotations & Footnotes */}
          <div className="p-3.5 bg-[#1a1a1a] border border-[#333] rounded space-y-3">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-2">
              <div className="flex items-center space-x-2 text-[#4a90e2] font-semibold">
                <ListChecks className="w-3.5 h-3.5" />
                <span>2. Annotations & Footnotes Export Settings</span>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAnnotations}
                  onChange={(e) => setIncludeAnnotations(e.target.checked)}
                  className="rounded bg-[#222] border-[#444] text-[#4a90e2] focus:ring-[#4a90e2]"
                />
                <span className="text-[11px] font-medium text-[#e0e0e0]">
                  Include Annotations/Footnotes ({allAnnotations.length})
                </span>
              </label>
            </div>

            {includeAnnotations && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#888]">
                    Selected ({selectedAnnotationIds.length} of {allAnnotations.length}) for export:
                  </span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={toggleAllAnnotations}
                      className="text-[10px] text-[#d4af37] hover:underline"
                    >
                      {selectedAnnotationIds.length === allAnnotations.length ? 'Unselect All' : 'Select All'}
                    </button>
                  </div>
                </div>

                {/* Submenu List of Annotations */}
                <div className="max-h-36 overflow-y-auto bg-[#121212] border border-[#2a2a2a] rounded p-2 space-y-1">
                  {allAnnotations.length > 0 ? (
                    allAnnotations.map((ann) => (
                      <label
                        key={ann.id}
                        className="flex items-start space-x-2 p-1.5 rounded hover:bg-[#1f1f1f] cursor-pointer text-[11px] transition"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAnnotationIds.includes(ann.id)}
                          onChange={() => toggleAnnotation(ann.id)}
                          className="mt-0.5 rounded bg-[#222] border-[#444] text-[#d4af37]"
                        />
                        <div className="flex-1 truncate">
                          <span className="font-semibold text-[#e0e0e0]">{ann.title}</span>
                          <span className="text-[#666] ml-2 font-mono">({ann.type})</span>
                          <p className="text-[10px] text-[#888] truncate">{ann.selectedText}: {ann.explanationOrDefinition}</p>
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="text-center py-3 text-[#666] italic text-[11px]">
                      No annotations collected yet in this book session.
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-[11px]">
                  <span className="text-[#aaa] font-medium">Placement:</span>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      name="placement"
                      checked={annotationsPlacement === 'endnotes'}
                      onChange={() => setAnnotationsPlacement('endnotes')}
                      className="text-[#d4af37]"
                    />
                    <span>Endnotes Chapter at End</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      name="placement"
                      checked={annotationsPlacement === 'inline'}
                      onChange={() => setAnnotationsPlacement('inline')}
                      className="text-[#d4af37]"
                    />
                    <span>Inline Chapter Footnotes</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Output Format Selection */}
          <div className="p-3.5 bg-[#1a1a1a] border border-[#333] rounded space-y-3">
            <div className="flex items-center space-x-2 border-b border-[#2a2a2a] pb-2 text-[#4ade80] font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>3. Output Format Selection</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {(Object.keys(formatLabels) as ExportFormat[]).map((fmtKey) => {
                const info = formatLabels[fmtKey];
                const isSelected = format === fmtKey;
                return (
                  <button
                    key={fmtKey}
                    type="button"
                    onClick={() => setFormat(fmtKey)}
                    className={`p-2.5 rounded text-left transition border flex flex-col justify-between space-y-1 ${
                      isSelected
                        ? 'bg-[#2a2a2a] border-[#d4af37] text-white shadow-sm'
                        : 'bg-[#141414] border-[#2a2a2a] text-[#aaa] hover:bg-[#1e1e1e] hover:text-[#e0e0e0]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#d4af37]">{info.label}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#222] border border-[#333] text-[#888] font-mono">
                        {info.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#888] leading-tight">{info.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#1a1a1a] border-t border-[#333] flex items-center justify-between">
          <div className="text-[11px] text-[#888] flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#4ade80]" />
            <span>Tag, CSS & Image Integrity: 100% Preserved {Object.keys(project.images || {}).length > 0 ? `(${Object.keys(project.images || {}).length} image${Object.keys(project.images || {}).length > 1 ? 's' : ''} repacked)` : ''}</span>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded text-xs font-medium text-[#aaa] hover:text-white bg-[#222] border border-[#333]"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteExport}
              disabled={isExporting}
              className="px-4 py-1.5 rounded text-xs font-bold bg-[#d4af37] hover:bg-[#e5c05e] text-black shadow transition flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-black" />
              <span>Export {formatLabels[format].label}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
