import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  BarChart2, 
  BookOpen,
  ArrowRight,
  Pause,
  Play,
  Timer,
  Clock
} from 'lucide-react';
import { ActiveOperationProgress } from '../types';

interface ActiveProgressStatusBarProps {
  progress: ActiveOperationProgress | null;
  onDismiss: () => void;
  onOpenReport?: () => void;
  hasReport?: boolean;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
}

export const ActiveProgressStatusBar: React.FC<ActiveProgressStatusBarProps> = ({
  progress,
  onDismiss,
  onOpenReport,
  hasReport,
  isPaused,
  onPause,
  onResume
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!progress) return;
    const startTime = progress.startTimestamp || Date.now();

    if (progress.isFinished) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - startTime) / 1000));
      setElapsedSeconds(diffSec);
    }, 1000);

    return () => clearInterval(interval);
  }, [progress?.id, progress?.startTimestamp, progress?.isFinished]);

  if (!progress) return null;

  const totalSteps = Math.max(1, progress.totalSteps);
  const completedSteps = progress.completedSteps;
  const remainingSteps = Math.max(0, totalSteps - completedSteps);
  const isSingleTask = totalSteps <= 1;

  const overallPercentage = Math.min(
    100,
    Math.max(0, Math.round((progress.completedSteps / totalSteps) * 100))
  );

  const sectionPercentage = Math.min(
    100,
    Math.max(0, Math.round(progress.sectionProgressPercent ?? ((progress.currentStep / totalSteps) * 100)))
  );

  let estRemainingSeconds = 0;
  if (progress.isFinished || remainingSteps === 0) {
    estRemainingSeconds = 0;
  } else if (completedSteps > 0 && elapsedSeconds > 0) {
    const avgSecPerStep = elapsedSeconds / completedSteps;
    estRemainingSeconds = Math.round(remainingSteps * avgSecPerStep);
  } else {
    const currentStepPct = (progress.sectionProgressPercent || 10) / 100;
    const estCurrentStepRemaining = Math.max(2, Math.round((1 - currentStepPct) * 12));
    estRemainingSeconds = estCurrentStepRemaining + (remainingSteps - 1) * 12;
  }

  const formatTimeString = (totalSec: number): string => {
    if (!isFinite(totalSec) || totalSec < 0) return '00:00';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTranslation = progress.type === 'translation';
  const isFinished = progress.isFinished;
  const hasErrors = progress.failedSteps > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#121212]/95 backdrop-blur-md border-t border-[#333] shadow-2xl text-[#e0e0e0] transition-all animate-in slide-in-from-bottom duration-300 w-full min-w-0">
      
      {/* Top Progress & Live Task Timer Container */}
      <div className="w-full bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-2 space-y-2 min-w-0 overflow-hidden">
        
        {/* Overall Task Header with Live Elapsed Time & Estimated Remaining Time */}
        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono gap-2 border-b border-[#262626] pb-1.5 min-w-0">
          <div className="flex items-center space-x-2 min-w-0 truncate">
            <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse shrink-0" />
            <span className="text-[#d4af37] font-bold uppercase tracking-wider text-[10px] shrink-0">Overall Task:</span>
            <span className="text-[#e0e0e0] font-semibold truncate">
              {progress.title}
            </span>
            <span className="text-[#aaa] text-[10px] font-sans shrink-0">
              ({progress.completedSteps} / {progress.totalSteps} Completed — {overallPercentage}%)
            </span>
          </div>

          {/* TIMER DISPLAY NEAR THE BOTTOM */}
          <div className="flex items-center space-x-3 bg-[#222] border border-[#333] px-2.5 py-1 rounded text-[11px] font-mono text-[#e0e0e0] shrink-0">
            <div className="flex items-center space-x-1 text-[#aaa]">
              <Timer className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Elapsed:</span>
              <strong className="text-white">{formatTimeString(elapsedSeconds)}</strong>
            </div>
            
            <div className="h-3 w-px bg-[#444]" />

            <div className="flex items-center space-x-1 text-[#aaa]">
              <Clock className="w-3.5 h-3.5 text-[#4a90e2]" />
              <span>Est. Remaining:</span>
              <strong className={isFinished ? "text-emerald-400" : "text-amber-300"}>
                {isFinished ? "Done" : formatTimeString(estRemainingSeconds)}
              </strong>
            </div>
          </div>
        </div>

        {/* Progress Bar 1: Overall Task Progress Bar */}
        <div className="space-y-1 min-w-0">
          <div className="w-full bg-[#2a2a2a] h-2.5 rounded-full overflow-hidden relative border border-[#383838]">
            <div 
              className={`h-full transition-all duration-500 ease-out ${
                isFinished 
                  ? hasErrors ? 'bg-amber-500' : 'bg-emerald-500'
                  : 'bg-gradient-to-r from-[#d4af37] via-amber-400 to-[#4a90e2]'
              }`}
              style={{ width: `${overallPercentage}%` }}
            />
            {!isFinished && (
              <div className="absolute inset-0 bg-white/20 animate-pulse" style={{ width: `${overallPercentage}%` }} />
            )}
          </div>
        </div>

        {/* Individual Section Progress Bar: ONLY shown if this is the ONLY task being ran (isSingleTask === true) */}
        {isSingleTask && isTranslation && !isFinished && (
          <div className="space-y-1 pt-1 min-w-0 border-t border-[#262626]">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#4a90e2] font-semibold flex items-center space-x-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-[#4a90e2] animate-ping shrink-0" style={{ animationDuration: '2s' }} />
                <span>Single Section Task:</span>
                <strong className="text-white truncate">
                  "{progress.sectionTitle || `Section ${progress.currentStep}`}" ({sectionPercentage}%)
                </strong>
              </span>
              <span className="text-amber-300 text-[10px] font-bold shrink-0">
                {isPaused ? 'PAUSED' : 'AI Processing...'}
              </span>
            </div>
            <div className="w-full bg-[#222] h-1.5 rounded-full overflow-hidden relative border border-[#333]">
              <div 
                className="h-full bg-gradient-to-r from-[#4a90e2] to-indigo-400 transition-all duration-300 ease-out"
                style={{ width: `${sectionPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs w-full min-w-0">
        
        {/* Left Side: Icon & Titles */}
        <div className="flex items-center space-x-3 w-full sm:w-auto min-w-0">
          <div className={`p-2 rounded-lg shrink-0 ${
            isFinished
              ? hasErrors ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30'
          }`}>
            {isFinished ? (
              hasErrors ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />
            ) : (
              isTranslation ? <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} /> : <Download className="w-4 h-4 animate-pulse" />
            )}
          </div>

          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center space-x-2 min-w-0">
              <span className="font-bold text-[#f0f0f0] truncate">{progress.title}</span>
              
              {/* Status Pill */}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                isFinished
                  ? hasErrors ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : isPaused
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 animate-pulse'
              }`}>
                {isFinished 
                  ? (hasErrors ? `Completed with ${progress.failedSteps} Error(s)` : 'Operation Complete') 
                  : isPaused ? 'Paused — Click Resume' : `Task In Progress`}
              </span>
            </div>

            <p className="text-[#999] text-[11px] truncate">
              {progress.detail}
            </p>
          </div>
        </div>

        {/* Center/Right Side: Step Metrics & Controls */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
          
          {/* Numerical Step Counter */}
          <div className="flex items-center space-x-3 text-[11px] bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-[#2a2a2a] shrink-0">
            <div>
              <span className="text-[#888]">Progress: </span>
              <strong className="text-[#f0f0f0]">{progress.completedSteps}</strong> / <span className="text-[#aaa]">{progress.totalSteps}</span>
            </div>
            <div className="h-3 w-px bg-[#333]" />
            <div>
              <span className="text-emerald-400 font-semibold">{progress.completedSteps} Completed</span>
              {progress.failedSteps > 0 && (
                <span className="text-amber-400 font-semibold ml-2">• {progress.failedSteps} Errors</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            {!isFinished && isTranslation && (
              isPaused ? (
                <button
                  onClick={onResume}
                  id="resume-batch-btn-statusbar"
                  className="px-3 py-1.5 rounded-md bg-emerald-500 text-black hover:bg-emerald-400 text-xs font-bold transition-all shadow flex items-center space-x-1.5 animate-pulse cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Resume Task</span>
                </button>
              ) : (
                <button
                  onClick={onPause}
                  id="pause-batch-btn-statusbar"
                  className="px-3 py-1.5 rounded-md bg-amber-500 text-black hover:bg-amber-400 text-xs font-bold transition-all shadow flex items-center space-x-1.5 cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 fill-black" />
                  <span>Pause Task</span>
                </button>
              )
            )}

            {hasReport && onOpenReport && (
              <button
                onClick={onOpenReport}
                className="px-3 py-1.5 rounded-md bg-[#d4af37] text-black hover:bg-[#e5be48] text-xs font-semibold transition-all shadow flex items-center space-x-1.5 cursor-pointer"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>View Report</span>
              </button>
            )}

            <button
              onClick={onDismiss}
              title="Dismiss status bar"
              className="p-1.5 rounded-md text-[#888] hover:text-white hover:bg-[#282828] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
