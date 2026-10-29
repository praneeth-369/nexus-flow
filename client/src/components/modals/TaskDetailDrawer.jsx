import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../services/graphUtils';
import {
  X,
  Sparkles,
  Clock,
  Flame,
  GitFork,
  Edit2,
  Trash2,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export default function TaskDetailDrawer() {
  const {
    selectedTaskId,
    setSelectedTaskId,
    selectedTask,
    tasks,
    cpm,
    currentRole,
    setBlastRadiusTaskId,
    setCurrentView,
    setTaskModalData,
    handleDeleteTask,
    handleUpdateTask,
  } = useProject();

  if (!selectedTaskId || !selectedTask) return null;

  const isViewer = currentRole === 'Viewer';
  const isCritical = cpm?.criticalPath?.includes(selectedTask.taskId);
  const statusStyle = STATUS_COLORS[selectedTask.status] || STATUS_COLORS.Ready;
  const priorityStyle = PRIORITY_COLORS[selectedTask.priority] || PRIORITY_COLORS.Medium;

  const handleInspectBlast = () => {
    setBlastRadiusTaskId(selectedTask.taskId);
    setCurrentView('graph');
  };

  const handleEdit = () => {
    if (isViewer) return;
    setTaskModalData({ isOpen: true, mode: 'edit', task: selectedTask });
  };

  const handleDelete = async () => {
    if (isViewer) return;
    if (window.confirm(`Delete task ${selectedTask.taskId} and all its dependency links?`)) {
      await handleDeleteTask(selectedTask.taskId);
    }
  };

  const handleAdvanceStatus = async (newStatus) => {
    if (isViewer) return;
    await handleUpdateTask(selectedTask.taskId, { status: newStatus });
  };

  // Find upstream tasks
  const upstreamTasks = (selectedTask.dependencies || [])
    .map((id) => tasks.find((t) => t.taskId === id))
    .filter(Boolean);

  // Find downstream tasks
  const downstreamTasks = (selectedTask.blastRadius?.allImpacted || [])
    .map((id) => tasks.find((t) => t.taskId === id))
    .filter(Boolean);

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[480px] bg-panel-card/95 backdrop-blur-2xl border-l border-panel-border shadow-2xl flex flex-col justify-between animate-slide-left text-xs select-none">
      {/* Top Header */}
      <div>
        <div className="p-6 border-b border-panel-border/80 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-sm font-bold text-cyan-400">
                {selectedTask.taskId}
              </span>
              {isCritical && (
                <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Critical Path
                </span>
              )}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${priorityStyle}`}>
                {selectedTask.priority}
              </span>
            </div>
            <h3 className="text-base font-bold text-white leading-snug">
              {selectedTask.title}
            </h3>
          </div>

          <button
            onClick={() => setSelectedTaskId(null)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-panel transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-14rem)]">
          {/* Status & Quick Advance Banner */}
          <div className="p-4 rounded-2xl bg-panel border border-panel-border flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                Current Status
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                {selectedTask.status}
              </span>
            </div>

            {!isViewer && (
              <div className="flex items-center gap-1.5">
                {selectedTask.status === 'Ready' && (
                  <button
                    onClick={() => handleAdvanceStatus('In Progress')}
                    className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/40 font-medium transition-colors"
                  >
                    Start Task
                  </button>
                )}
                {selectedTask.status === 'In Progress' && (
                  <button
                    onClick={() => handleAdvanceStatus('Completed')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete Task
                  </button>
                )}
                {selectedTask.status === 'Completed' && (
                  <button
                    onClick={() => handleAdvanceStatus('In Progress')}
                    className="px-3 py-1.5 rounded-xl bg-panel-card text-slate-300 hover:text-white border border-panel-border transition-colors text-[11px]"
                  >
                    Reopen
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Scope & Specification
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed bg-panel p-3.5 rounded-xl border border-panel-border">
              {selectedTask.description || 'No detailed specification provided.'}
            </p>
          </div>

          {/* Parameters Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-panel border border-panel-border">
              <span className="text-[10px] text-slate-400 block mb-1">Assignee</span>
              <div className="flex items-center gap-2">
                {selectedTask.owner?.avatar ? (
                  <img
                    src={selectedTask.owner.avatar}
                    alt={selectedTask.owner.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[9px] font-bold flex items-center justify-center">
                    {selectedTask.owner?.initials || 'UN'}
                  </div>
                )}
                <span className="font-medium text-white truncate">
                  {selectedTask.owner?.name || 'Unassigned'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-panel border border-panel-border">
              <span className="text-[10px] text-slate-400 block mb-1">Target Due Date</span>
              <div className="flex items-center gap-1.5 font-mono text-white">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedTask.dueDate}</span>
              </div>
            </div>
          </div>

          {/* Critical Path Method (CPM) Schedule Windows */}
          <div className="p-4 rounded-2xl bg-panel border border-amber-500/30">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> CPM Schedule Windows
              </span>
              <span className="font-mono text-[10px] text-amber-300">
                Slack: {selectedTask.cpm?.slack ?? 0} days
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center font-mono text-[11px]">
              <div className="p-2 rounded-lg bg-panel-card border border-panel-border">
                <span className="text-[9px] text-slate-400 block">ES</span>
                <span className="font-bold text-white">D{selectedTask.cpm?.es ?? 0}</span>
              </div>
              <div className="p-2 rounded-lg bg-panel-card border border-panel-border">
                <span className="text-[9px] text-slate-400 block">EF</span>
                <span className="font-bold text-white">D{selectedTask.cpm?.ef ?? 0}</span>
              </div>
              <div className="p-2 rounded-lg bg-panel-card border border-panel-border">
                <span className="text-[9px] text-slate-400 block">LS</span>
                <span className="font-bold text-white">D{selectedTask.cpm?.ls ?? 0}</span>
              </div>
              <div className="p-2 rounded-lg bg-panel-card border border-panel-border">
                <span className="text-[9px] text-slate-400 block">LF</span>
                <span className="font-bold text-white">D{selectedTask.cpm?.lf ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Upstream Prerequisites */}
          <div>
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Upstream Prerequisites ({upstreamTasks.length})
            </h4>
            {upstreamTasks.length === 0 ? (
              <p className="text-slate-500 text-xs italic">No prerequisite dependencies.</p>
            ) : (
              <div className="space-y-2">
                {upstreamTasks.map((up) => (
                  <div
                    key={up.taskId}
                    onClick={() => setSelectedTaskId(up.taskId)}
                    className="p-2.5 rounded-xl bg-panel hover:bg-panel-hover border border-panel-border flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-cyan-400 group-hover:underline">
                        {up.taskId}
                      </span>
                      <span className="truncate text-white">{up.title}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border shrink-0">
                      {up.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Downstream Blast Radius */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> Downstream Blast Radius ({downstreamTasks.length})
              </h4>
              {downstreamTasks.length > 0 && (
                <button
                  onClick={handleInspectBlast}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  Highlight in Graph <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {downstreamTasks.length === 0 ? (
              <p className="text-slate-500 text-xs italic">
                No downstream tasks depend on this component.
              </p>
            ) : (
              <div className="space-y-2">
                {downstreamTasks.map((down) => (
                  <div
                    key={down.taskId}
                    onClick={() => setSelectedTaskId(down.taskId)}
                    className="p-2.5 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-rose-400 group-hover:underline">
                        {down.taskId}
                      </span>
                      <span className="truncate text-white">{down.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {down.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-4 border-t border-panel-border/80 bg-panel flex items-center justify-between gap-3">
        <button
          onClick={handleInspectBlast}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-panel-card hover:bg-panel-hover text-cyan-300 border border-panel-border transition-colors font-medium"
        >
          <GitFork className="w-3.5 h-3.5" />
          <span>Graph View</span>
        </button>

        {!isViewer && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-panel-card hover:bg-panel-hover text-white border border-panel-border transition-colors font-medium"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
