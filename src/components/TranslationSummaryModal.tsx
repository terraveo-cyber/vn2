import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  FileText, 
  BarChart2, 
  BookOpen, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { BatchTranslationSummary, TranslationOptions } from '../types';

interface TranslationSummaryModalProps {
  summary: BatchTranslationSummary;
  onClose: () => void;
  onRetryFailed: () => void;
  onRetrySingleChapter: (chapterId: string) => void;
  isTranslating: boolean;
}

export const TranslationSummaryModal: React.FC<TranslationSummaryModalProps> = ({
  summary,
  onClose,
  onRetryFailed,
  onRetrySingleChapter,
  isTranslating
}) => {
  const hasFailures = summary.failedCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#181818] border border-[#333] rounded-xl shadow-2xl max-w-3xl w-full text-[#e0e0e0] flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a] bg-[#141414]">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${hasFailures ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
              {hasFailures ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#f0f0f0] flex items-center space-x-2">
                <span>Batch Translation Report</span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#2a2a2a] text-[#aaa] font-normal">
                  Completed at {summary.completedAt}
                </span>
              </h2>
              <p className="text-xs text-[#888]">
                {hasFailures 
                  ? `${summary.successfulCount} succeeded, ${summary.failedCount} failed after automated retries. You can retry remaining errors below.` 
                  : 'All chapters were successfully translated and tag-preserved!'}
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

        {/* Metrics Grid */}
        <div className="p-6 bg-[#161616] border-b border-[#282828]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Metric 1: Total Processed */}
            <div className="bg-[#1e1e1e] border border-[#2a2a2a] p-4 rounded-lg flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-[#2a2a2a] text-[#d4af37]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#888] font-medium uppercase tracking-wider">Total Chapters</p>
                <p className="text-xl font-bold text-[#f0f0f0]">{summary.totalChapters}</p>
              </div>
            </div>

            {/* Metric 2: Successful */}
            <div className="bg-[#1e1e1e] border border-[#2a2a2a] p-4 rounded-lg flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#888] font-medium uppercase tracking-wider">Translated</p>
                <p className="text-xl font-bold text-emerald-400">{summary.successfulCount}</p>
              </div>
            </div>

            {/* Metric 3: Errors */}
            <div className="bg-[#1e1e1e] border border-[#2a2a2a] p-4 rounded-lg flex items-center space-x-3">
              <div className={`p-2.5 rounded-lg ${hasFailures ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-[#2a2a2a] text-[#888]'}`}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#888] font-medium uppercase tracking-wider">Errors Noted</p>
                <p className={`text-xl font-bold ${hasFailures ? 'text-amber-400' : 'text-[#888]'}`}>
                  {summary.failedCount}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Chapter Detailed Log List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#aaa] mb-2 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[#d4af37]" />
            <span>Chapter Breakdown & Diagnostic Logs</span>
          </h3>

          {summary.chapterResults.map((ch, idx) => {
            const isError = ch.status === 'error';

            return (
              <div 
                key={ch.chapterId || idx}
                className={`p-4 rounded-lg border transition-all ${
                  isError 
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-200' 
                    : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#e0e0e0]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#262626] text-[#888]">
                        Ch {idx + 1}
                      </span>
                      <h4 className="font-semibold text-sm text-[#f0f0f0]">{ch.chapterTitle}</h4>
                      
                      {isError ? (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Error ({ch.attemptsUsed} retries used)</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#888] flex items-center space-x-4 pt-0.5">
                      <span>Original: <strong>{ch.originalWordCount}</strong> words</span>
                      <span>•</span>
                      <span>Translated: <strong>{ch.translatedWordCount}</strong> words</span>
                    </div>

                    {/* Error Message Details Callout */}
                    {isError && ch.errorMessage && (
                      <div className="mt-3 p-3 bg-[#111111] border border-amber-500/30 rounded-md text-xs text-amber-300 font-mono space-y-1">
                        <div className="font-sans font-semibold text-amber-400 text-[11px] uppercase tracking-wider">
                          Error Note:
                        </div>
                        <p className="break-words leading-relaxed text-[#e2b862]">
                          {ch.errorMessage}
                        </p>
                        <p className="text-[10px] text-[#999] pt-1 font-sans">
                          Batch process skipped this error after automated retry attempts and completed the remaining chapters.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Individual Chapter Retry Action */}
                  {isError && (
                    <button
                      onClick={() => onRetrySingleChapter(ch.chapterId)}
                      disabled={isTranslating}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-medium transition-all shrink-0 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
                      <span>Retry Ch {idx + 1}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Buttons */}
        <div className="p-4 px-6 border-t border-[#282828] bg-[#141414] flex items-center justify-between">
          <p className="text-xs text-[#777]">
            {hasFailures ? 'You can retry individual chapters or batch retry all failed ones.' : 'All chapters ready for reading & export.'}
          </p>

          <div className="flex items-center space-x-3">
            {hasFailures && (
              <button
                onClick={onRetryFailed}
                disabled={isTranslating}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#d4af37] text-black hover:bg-[#e5be48] text-xs font-semibold transition-all shadow-lg shadow-[#d4af37]/10 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isTranslating ? 'animate-spin' : ''}`} />
                <span>Retry All {summary.failedCount} Failed Chapters</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#282828] hover:bg-[#333] text-[#e0e0e0] text-xs font-medium transition-all"
            >
              Close Report
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
