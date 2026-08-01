import React, { useState } from 'react';
import { 
  RotateCcw, 
  X, 
  HardDrive, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Sparkles,
  Trash2,
  Save,
  Download,
  BookMarked
} from 'lucide-react';
import { BackupPoint } from '../utils/sessionCache';
import { EbookProject } from '../types';

interface RestoreBackupModalProps {
  backupPoints: BackupPoint[];
  isOpen: boolean;
  onClose: () => void;
  onSelectRestorePoint: (point: BackupPoint) => void;
  onClearAllPoints: () => void;
  currentProjectTitle?: string;
  onSaveCurrentProgress?: () => void;
  onExportSavedBook?: (project: EbookProject) => void;
}

export const RestoreBackupModal: React.FC<RestoreBackupModalProps> = ({
  backupPoints,
  isOpen,
  onClose,
  onSelectRestorePoint,
  onClearAllPoints,
  currentProjectTitle,
  onSaveCurrentProgress,
  onExportSavedBook
}) => {
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleManualSave = () => {
    if (onSaveCurrentProgress) {
      onSaveCurrentProgress();
      setSaveNotice(`Saved progress for "${currentProjectTitle || 'Current Book'}"!`);
      setTimeout(() => setSaveNotice(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#181818] border border-[#333] rounded-xl shadow-2xl max-w-2xl w-full text-[#e0e0e0] flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a] bg-[#141414]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#f0f0f0] flex items-center space-x-2">
                <span>Saved Books & Progress History</span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#2a2a2a] text-[#d4af37] font-semibold border border-[#d4af37]/30">
                  Previous 5 Books
                </span>
              </h2>
              <p className="text-xs text-[#888]">
                View, load, or export your saved translated books and historical checkpoints.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#888] hover:text-white p-1 rounded-lg hover:bg-[#282828] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Banner: Save Current Book Progress */}
        <div className="px-6 py-3 bg-[#111] border-b border-[#282828] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#888]">Active Book:</span>
            <strong className="text-[#d4af37]">{currentProjectTitle || 'Untitled Book'}</strong>
          </div>

          <div className="flex items-center space-x-2">
            {saveNotice && (
              <span className="text-xs text-emerald-400 font-medium animate-pulse flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{saveNotice}</span>
              </span>
            )}

            <button
              onClick={handleManualSave}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5 text-white" />
              <span>Save Current Book Progress</span>
            </button>
          </div>
        </div>

        {/* Content Body: Backup Points List (Previous 5 Books) */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-[#161616]">
          {backupPoints.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-[#1a1a1a] rounded-lg border border-[#282828]">
              <HardDrive className="w-10 h-10 text-[#555] mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#aaa]">No Saved Books Found</p>
                <p className="text-xs text-[#666]">
                  Click "Save Current Book Progress" above to create your first saved book checkpoint.
                </p>
              </div>
            </div>
          ) : (
            backupPoints.map((pt, idx) => {
              const formattedTime = new Date(pt.savedAt).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              const isLatest = idx === 0;
              const isCompleted = pt.translatedCount >= pt.chapterCount && pt.chapterCount > 0;

              return (
                <div
                  key={pt.id || idx}
                  className={`p-4 rounded-xl border transition-all duration-200 hover:border-[#d4af37]/60 ${
                    isLatest 
                      ? 'bg-[#1f1e18] border-[#d4af37]/40 shadow-lg shadow-black/40' 
                      : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#e0e0e0]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    
                    {/* Left details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                          isLatest 
                            ? 'bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/40' 
                            : 'bg-[#282828] text-[#aaa] border-[#333]'
                        }`}>
                          Book #{idx + 1}
                        </span>

                        <h3 className="font-bold text-sm text-[#f0f0f0] truncate">
                          {pt.project.title || pt.label}
                        </h3>

                        {isCompleted ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1e3a2e] text-[#4ade80] border border-[#2d5a44] flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-[#4ade80]" />
                            <span>COMPLETED</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            IN PROGRESS ({pt.translatedCount}/{pt.chapterCount})
                          </span>
                        )}

                        {isLatest && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Most Recent</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#999] flex items-center space-x-3 pt-0.5">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-[#777]" />
                          <span>Saved: {formattedTime}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <BookOpen className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span className="truncate max-w-[180px]">{pt.project.author || 'Classical Author'}</span>
                        </span>
                      </div>

                      {/* Chapter and translation metrics */}
                      <div className="text-xs text-[#888] flex items-center space-x-4 pt-1">
                        <span>
                          Chapters: <strong className="text-[#ccc]">{pt.chapterCount}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Translated: <strong className="text-emerald-400">{pt.translatedCount} / {pt.chapterCount}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Words: <strong className="text-[#ccc]">{pt.totalWordCount.toLocaleString()}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Right Action Buttons: Restore or Export */}
                    <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
                      {onExportSavedBook && (
                        <button
                          type="button"
                          onClick={() => onExportSavedBook(pt.project)}
                          title="Export this saved book directly as EPUB, PDF, or MOBI"
                          className="px-3 py-2 rounded-lg bg-[#222] hover:bg-[#2a2a2a] text-[#d4af37] border border-[#d4af37]/40 text-xs font-semibold transition flex items-center space-x-1.5"
                        >
                          <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>Export</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onSelectRestorePoint(pt)}
                        className="px-3.5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition flex items-center space-x-1.5 shadow"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Load Book</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[#282828] bg-[#141414] flex items-center justify-between">
          {backupPoints.length > 0 ? (
            <button
              onClick={onClearAllPoints}
              className="text-xs text-red-400/80 hover:text-red-400 flex items-center space-x-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Saved History</span>
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#282828] hover:bg-[#333] text-[#e0e0e0] text-xs font-medium transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

