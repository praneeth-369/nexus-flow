import React from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  Sparkles,
  Flame,
  ArrowRightLeft,
  ArrowUpDown,
  Maximize2,
  X,
  Info,
} from 'lucide-react';

export default function GraphControls({
  layoutDirection,
  onToggleLayout,
  onFitView,
}) {
  const {
    showCriticalPath,
    setShowCriticalPath,
    blastRadiusTaskId,
    setBlastRadiusTaskId,
    tasks,
    cpm,
  } = useProject();

  const blastRootTask = tasks.find((t) => t.taskId === blastRadiusTaskId);

  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
      {/* Left controls: Auto-layout & Highlighters */}
      <div className="flex items-center gap-2 pointer-events-auto bg-panel-card/90 backdrop-blur-md p-1.5 rounded-2xl border border-panel-border shadow-xl">
        {/* Layout Toggle */}
        <button
          onClick={onToggleLayout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-panel-hover border border-panel-border/50 transition-all"
          title={`Switch to ${layoutDirection === 'LR' ? 'Vertical (Top to Bottom)' : 'Horizontal (Left to Right)'} layout`}
        >
          {layoutDirection === 'LR' ? (
            <>
              <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>Horizontal Flow</span>
            </>
          ) : (
            <>
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vertical Flow</span>
            </>
          )}
        </button>

        <div className="w-[1px] h-4 bg-panel-border" />

        {/* Critical Path Toggle */}
        <button
          onClick={() => setShowCriticalPath(!showCriticalPath)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            showCriticalPath
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-gold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-panel-hover border border-transparent'
          }`}
          title="Highlight zero-slack tasks driving final delivery date"
        >
          <Sparkles className={`w-3.5 h-3.5 ${showCriticalPath ? 'text-amber-400 animate-spin-slow' : 'text-slate-400'}`} />
          <span>Critical Path ({cpm?.criticalPath?.length || 0})</span>
        </button>

        {/* Blast Radius Active Mode Indicator */}
        {blastRadiusTaskId && (
          <>
            <div className="w-[1px] h-4 bg-panel-border" />
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-glow-rose/30">
              <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Blast Radius: {blastRadiusTaskId}</span>
              <button
                onClick={() => setBlastRadiusTaskId(null)}
                className="hover:text-white p-0.5"
                title="Clear blast radius highlight"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right controls: Legend and Fit View */}
      <div className="flex items-center gap-2 pointer-events-auto bg-panel-card/90 backdrop-blur-md p-1.5 rounded-2xl border border-panel-border shadow-xl">
        {/* Legend */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1 text-[11px] text-slate-400 border-r border-panel-border/80">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Ready
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> In Progress
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Blocked
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Critical Path
          </span>
        </div>

        <button
          onClick={onFitView}
          className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-panel-hover transition-colors"
          title="Fit view to all nodes"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
