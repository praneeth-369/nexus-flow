import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../services/api';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCw,
  X,
  Zap,
  Activity,
  Bot,
  Layers,
} from 'lucide-react';

export default function SmartAdvisorDrawer() {
  const {
    isAdvisorOpen,
    setIsAdvisorOpen,
    setSelectedTaskId,
    setBlastRadiusTaskId,
    setCurrentView,
  } = useProject();

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const res = await api.getAdvisorAnalysis();
      if (res.success) {
        setAnalysis(res.analysis);
      }
    } catch (err) {
      console.error('Failed to load advisor analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdvisorOpen) {
      fetchAnalysis();
    }
  }, [isAdvisorOpen]);

  if (!isAdvisorOpen) return null;

  const handleFocusTask = (taskId) => {
    setSelectedTaskId(taskId);
    setBlastRadiusTaskId(taskId);
    setCurrentView('graph');
    setIsAdvisorOpen(false);
  };

  const health = analysis?.healthScore || 85;
  const healthColor =
    health >= 80 ? 'text-emerald-400' : health >= 60 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[520px] bg-panel-card/95 backdrop-blur-2xl border-l border-panel-border shadow-2xl flex flex-col justify-between animate-slide-left text-xs select-none">
      {/* Top Header */}
      <div>
        <div className="p-6 border-b border-panel-border/80 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-glow-cyan shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                Smart Schedule Advisor
              </h3>
              <span className="text-[11px] text-cyan-300 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                {analysis?.source === 'gemini_enhanced'
                  ? 'Gemini AI Strategic Advisor'
                  : 'Algorithmic Graph Heuristic Engine'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={fetchAnalysis}
              disabled={loading}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-panel transition-colors"
              title="Refresh Analysis"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={() => setIsAdvisorOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-panel transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {loading && !analysis ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
              <RotateCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <span className="text-xs text-slate-400">
                Running topological CPM solver & schedule risk heuristics...
              </span>
            </div>
          ) : (
            <>
              {/* Project Health Score Dial */}
              <div className="p-5 rounded-2xl bg-panel border border-panel-border flex items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Project Schedule Health
                  </span>
                  <p className="text-xs text-slate-300 leading-snug">
                    Calculated from critical path float, overdue exposure, and unblocked readiness.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className={`text-3xl font-bold font-mono ${healthColor}`}>
                    {health}%
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {health >= 80 ? 'Optimal' : health >= 60 ? 'Moderate Risk' : 'Critical Action'}
                  </span>
                </div>
              </div>

              {/* Primary Bottleneck Spotlight */}
              {analysis?.primaryBottleneck && (
                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/40 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider text-[11px]">
                      <Flame className="w-4 h-4 text-rose-400" />
                      <span>Top Project Bottleneck</span>
                    </div>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {analysis.primaryBottleneck.impactCount} Downstream Blocked
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-rose-400 text-xs">
                        {analysis.primaryBottleneck.taskId}
                      </span>
                      <span className="font-semibold text-white text-xs">
                        {analysis.primaryBottleneck.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {analysis.primaryBottleneck.reason}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-rose-500/20">
                    <span className="text-[11px] text-slate-400">
                      Owner: <strong className="text-white">{analysis.primaryBottleneck.owner?.name}</strong>
                    </span>

                    <button
                      onClick={() => handleFocusTask(analysis.primaryBottleneck.taskId)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-rose-500 hover:bg-rose-400 text-slate-950 transition-all flex items-center gap-1 shadow-glow-rose active:scale-95"
                    >
                      <span>Focus in Graph</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Actionable Recommendations */}
              <div>
                <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  Prioritized Schedule Actions
                </h4>

                <div className="space-y-3">
                  {(analysis?.recommendations || []).map((rec) => (
                    <div
                      key={rec.id}
                      className="p-4 rounded-xl bg-panel hover:bg-panel-hover border border-panel-border transition-all"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-white text-xs">
                          {rec.title}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                            rec.priority === 'Urgent'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : rec.priority === 'High'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {rec.priority}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
                        {rec.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-panel-border/60">
                        <span className="font-mono text-cyan-400">{rec.impact}</span>
                        {rec.targetTaskId && (
                          <button
                            onClick={() => handleFocusTask(rec.targetTaskId)}
                            className="text-cyan-300 hover:text-white flex items-center gap-1 font-semibold"
                          >
                            Inspect {rec.targetTaskId} <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gemini AI Executive Assessment (if present) */}
              {analysis?.aiExecutiveSummary && (
                <div className="p-5 rounded-2xl bg-panel border border-cyan-500/30 text-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    <span>Gemini AI Strategic Summary</span>
                  </div>
                  <div className="text-[11px] leading-relaxed text-slate-300 whitespace-pre-line">
                    {analysis.aiExecutiveSummary}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-panel-border/80 bg-panel text-center text-slate-500 text-[11px]">
        NexusFlow Heuristic Graph Engine • Zero-Slack CPM Optimization
      </div>
    </div>
  );
}
