import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { ShieldAlert, ArrowRight, X, AlertTriangle } from 'lucide-react';

export default function CycleConflictModal() {
  const { cycleModalData, setCycleModalData } = useProject();

  if (!cycleModalData?.isOpen) return null;

  const cyclePath = cycleModalData.cyclePath || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-panel-card border border-rose-500/50 shadow-glow-rose p-6 md:p-8 glass-modal animate-slide-up">
        {/* Close Button */}
        <button
          onClick={() => setCycleModalData({ isOpen: false, cyclePath: [], message: '' })}
          className="absolute top-5 right-5 p-1 rounded-xl text-slate-400 hover:text-white hover:bg-panel transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-sans">
              Circular Dependency Detected
            </h3>
            <span className="text-xs text-rose-400 font-mono">
              DAG Invariant Enforced (No Loops Allowed)
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed mb-6">
          NexusFlow uses a 3-state Depth-First Search (DFS) engine to protect project scheduling integrity. A task cannot directly or transitively depend on a downstream task that already waits for it to complete.
        </p>

        {/* Cycle Chain Visualization */}
        <div className="p-4 rounded-2xl bg-canvas border border-rose-500/30 mb-6">
          <div className="flex items-center gap-2 mb-2 text-rose-400 text-xs font-semibold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Detected Circular Loop:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {cyclePath.map((nodeId, idx) => {
              const isClosingNode = idx === cyclePath.length - 1;
              return (
                <React.Fragment key={`${nodeId}-${idx}`}>
                  <span
                    className={`px-2.5 py-1 rounded-lg font-bold border ${
                      isClosingNode
                        ? 'bg-rose-500/30 text-rose-300 border-rose-500'
                        : 'bg-panel-card text-white border-panel-border'
                    }`}
                  >
                    {nodeId}
                  </span>
                  {idx < cyclePath.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Resolution Advice */}
        <div className="p-3 rounded-xl bg-panel border border-panel-border text-[11px] text-slate-400 mb-6 leading-relaxed">
          <strong className="text-slate-200 block mb-0.5">How to resolve:</strong>
          Remove or decouple one of the dependency links shown in the chain above before attempting to connect these tasks.
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setCycleModalData({ isOpen: false, cyclePath: [], message: '' })}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-slate-950 transition-all shadow-glow-rose active:scale-95"
          >
            Acknowledge & Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
