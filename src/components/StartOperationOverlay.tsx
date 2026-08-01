import React, { useEffect } from 'react';
import { Sparkles, Download, CheckCircle2, X } from 'lucide-react';
import { OperationStartedNotice } from '../types';

interface StartOperationOverlayProps {
  notice: OperationStartedNotice | null;
  onDismiss: () => void;
}

export const StartOperationOverlay: React.FC<StartOperationOverlayProps> = ({
  notice,
  onDismiss
}) => {
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [notice, onDismiss]);

  if (!notice) return null;

  const isTranslation = notice.type === 'translation';

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] sm:w-auto">
      <div className="bg-[#181818]/95 backdrop-blur-md border border-[#d4af37]/40 shadow-2xl shadow-black/80 rounded-xl p-4 text-[#e0e0e0] flex items-start space-x-3.5 animate-in fade-in slide-in-from-top-4 duration-300">
        
        <div className={`p-2.5 rounded-lg shrink-0 ${isTranslation ? 'bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30' : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'}`}>
          {isTranslation ? <Sparkles className="w-5 h-5 animate-pulse" /> : <Download className="w-5 h-5 animate-pulse" />}
        </div>

        <div className="flex-1 space-y-0.5 pr-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#d4af37] flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
              <span>{notice.title}</span>
            </span>
            <span className="text-[10px] text-[#888] font-mono px-1.5 py-0.5 rounded bg-[#252525]">
              {notice.timestamp}
            </span>
          </div>
          <p className="text-xs text-[#d0d0d0] leading-relaxed font-sans">
            {notice.message}
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="text-[#888] hover:text-white p-1 rounded-md hover:bg-[#282828] transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
