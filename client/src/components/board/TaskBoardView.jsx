import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import TaskListView from './TaskListView';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../services/graphUtils';
import {
  Kanban,
  TableProperties,
  Sparkles,
  Clock,
  Flame,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  PlayCircle,
  Plus,
  Search,
  Filter,
  X,
} from 'lucide-react';

export default function TaskBoardView() {
  const {
    filteredTasks,
    cpm,
    currentRole,
    setSelectedTaskId,
    setBlastRadiusTaskId,
    setCurrentView,
    setTaskModalData,
    handleUpdateTask,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
  } = useProject();

  const [mode, setMode] = useState('kanban'); // 'kanban' | 'list'
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Keyboard shortcut '/' to focus search on the board
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const isViewer = currentRole === 'Viewer';
  const criticalPathSet = new Set(cpm?.criticalPath || []);

  const columns = [
    {
      id: 'Blocked',
      title: 'Blocked',
      desc: 'Waiting on incomplete prerequisites',
      icon: ShieldAlert,
      color: 'rose',
      border: 'border-rose-500/30',
      badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    },
    {
      id: 'Ready',
      title: 'Ready',
      desc: 'All prerequisites completed',
      icon: PlayCircle,
      color: 'teal',
      border: 'border-teal-500/30',
      badge: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
    },
    {
      id: 'In Progress',
      title: 'In Progress',
      desc: 'Active engineering work',
      icon: Clock,
      color: 'indigo',
      border: 'border-indigo-500/30',
      badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'Completed',
      title: 'Completed',
      desc: 'Finished & verified',
      icon: CheckCircle2,
      color: 'emerald',
      border: 'border-emerald-500/30',
      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    },
  ];

  const handleStatusChange = async (e, taskId, newStatus) => {
    e.stopPropagation();
    if (isViewer) return;
    await handleUpdateTask(taskId, { status: newStatus });
  };

  const handleInspectBlast = (e, taskId) => {
    e.stopPropagation();
    setSelectedTaskId(taskId);
    setBlastRadiusTaskId(taskId);
    setCurrentView('graph');
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* View Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-panel-border/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Task Orchestration Board
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-panel text-slate-400 border border-panel-border">
              {filteredTasks.length} Tasks
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage engineering sprint phases, inspect blockers, and advance milestone progress.
          </p>
        </div>

        {/* Actions: Search Bar, Filter Menu, & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Board Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks... (Press '/')"
              className="w-full bg-panel border border-panel-border focus:border-zinc-500 focus:bg-panel-hover text-xs text-white placeholder-zinc-500 pl-9 pr-8 py-2 rounded-xl outline-none transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Popover */}
          <div className="relative">
            <button
              onClick={() => setFilterMenuOpen(!filterMenuOpen)}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors shadow-sm ${
                filterStatus !== 'all' || filterPriority !== 'all'
                  ? 'bg-zinc-800 border-zinc-600 text-emerald-400'
                  : 'bg-panel border-panel-border text-zinc-400 hover:text-white hover:bg-panel-hover'
              }`}
              title="Filter Tasks"
            >
              <Filter className="w-4 h-4" />
            </button>

            {/* Filter Dropdown */}
            {filterMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl p-3 bg-panel-card border border-panel-border shadow-2xl glass-modal z-50 text-xs animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-panel-border mb-2.5">
                  <span className="font-semibold text-white">Filter Tasks</span>
                  {(filterStatus !== 'all' || filterPriority !== 'all') && (
                    <button
                      onClick={() => {
                        setFilterStatus('all');
                        setFilterPriority('all');
                      }}
                      className="text-[10px] text-emerald-400 hover:underline"
                    >
                      Reset all
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="mb-3">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Status
                  </span>
                  <div className="space-y-1">
                    {['all', 'Ready', 'In Progress', 'Blocked', 'Completed', 'Overdue'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`w-full text-left px-2 py-1 rounded-md text-[11px] flex items-center justify-between ${
                          filterStatus === s
                            ? 'bg-zinc-800 text-emerald-400 font-medium'
                            : 'text-zinc-300 hover:bg-panel-hover'
                        }`}
                      >
                        <span>{s === 'all' ? 'All Statuses' : s}</span>
                        {filterStatus === s && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div>
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                    Priority
                  </span>
                  <div className="space-y-1">
                    {['all', 'Critical', 'High', 'Medium', 'Low'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setFilterPriority(p)}
                        className={`w-full text-left px-2 py-1 rounded-md text-[11px] flex items-center justify-between ${
                          filterPriority === p
                            ? 'bg-zinc-800 text-emerald-400 font-medium'
                            : 'text-zinc-300 hover:bg-panel-hover'
                        }`}
                      >
                        <span>{p === 'all' ? 'All Priorities' : p}</span>
                        {filterPriority === p && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-panel border border-panel-border shadow-md">
            <button
              onClick={() => setMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'kanban'
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'list'
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Mode: Table or Kanban */}
      {mode === 'list' ? (
        <TaskListView />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            const Icon = col.icon;

            return (
              <div
                key={col.id}
                className={`flex flex-col rounded-2xl bg-panel-card/60 border ${col.border} glass-panel p-4 min-h-[500px]`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-panel-border/80 mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-300" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      {col.title}
                    </span>
                  </div>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${col.badge}`}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Tasks */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-slate-500 text-xs text-center border border-dashed border-panel-border/60 rounded-xl">
                      <span>No tasks in this lane</span>
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium;
                      const isCritical = criticalPathSet.has(task.taskId);

                      return (
                        <div
                          key={task.taskId}
                          onClick={() => setSelectedTaskId(task.taskId)}
                          className="p-4 rounded-xl bg-panel hover:bg-panel-hover border border-panel-border hover:border-slate-500 transition-all cursor-pointer group shadow-md"
                        >
                          {/* Card Top: ID & Priority */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-cyan-400 group-hover:underline">
                                {task.taskId}
                              </span>
                              {isCritical && (
                                <span className="flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40" title="Critical Path (Zero Slack)">
                                  <Sparkles className="w-2.5 h-2.5 text-amber-400" /> CPM
                                </span>
                              )}
                            </div>

                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${priorityStyle}`}>
                              {task.priority}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="text-xs font-semibold text-white mb-2 leading-snug line-clamp-2">
                            {task.title}
                          </h4>

                          {/* Blocked by or Dependencies */}
                          {task.status === 'Blocked' && (task.blockedBy || []).length > 0 && (
                            <div className="mb-2.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300">
                              <span className="font-semibold block mb-0.5">Blocked by:</span>
                              <div className="flex flex-wrap gap-1">
                                {task.blockedBy.map((b) => (
                                  <span key={b.taskId} className="font-mono font-bold">
                                    {b.taskId} ({b.status})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Downstream Blast Radius Badge */}
                          {(task.blastRadius?.impactCount || 0) > 0 && (
                            <div className="mb-2.5 flex items-center justify-between">
                              <button
                                onClick={(e) => handleInspectBlast(e, task.taskId)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-colors"
                              >
                                <Flame className="w-3 h-3 text-rose-400" />
                                <span>Impacts {task.blastRadius.impactCount} tasks</span>
                              </button>
                            </div>
                          )}

                          {/* Footer: Owner & Actions */}
                          <div className="flex items-center justify-between pt-2.5 border-t border-panel-border/80 text-[11px] text-slate-400">
                            <div className="flex items-center gap-2">
                              {task.owner?.avatar ? (
                                <img
                                  src={task.owner.avatar}
                                  alt={task.owner.name}
                                  className="w-5 h-5 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[9px] font-bold flex items-center justify-center shrink-0">
                                  {task.owner?.initials || 'UN'}
                                </div>
                              )}
                              <span className="truncate max-w-[80px]">
                                {task.owner?.name?.split(' ')[0]}
                              </span>
                            </div>

                            {/* Quick Advance Status Dropdown */}
                            {!isViewer && (
                              <div className="flex items-center gap-1">
                                {task.status === 'Ready' && (
                                  <button
                                    onClick={(e) => handleStatusChange(e, task.taskId, 'In Progress')}
                                    className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 text-[10px] font-medium"
                                  >
                                    Start Work
                                  </button>
                                )}
                                {task.status === 'In Progress' && (
                                  <button
                                    onClick={(e) => handleStatusChange(e, task.taskId, 'Completed')}
                                    className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 text-[10px] font-medium flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3 h-3" /> Done
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add task button in column footer */}
                {!isViewer && (
                  <button
                    onClick={() => setTaskModalData({ isOpen: true, mode: 'create', task: { status: col.id } })}
                    className="mt-3 w-full py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-panel border border-dashed border-panel-border flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
