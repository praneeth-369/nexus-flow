import React from 'react';
import { useProject } from '../../context/ProjectContext';
import KpiCard from './KpiCard';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  GitFork,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Flame,
  Calendar,
} from 'lucide-react';

export default function OverviewDashboard() {
  const {
    project,
    tasks,
    kpis,
    cpm,
    setCurrentView,
    setSelectedTaskId,
    setBlastRadiusTaskId,
    setShowCriticalPath,
    setIsAdvisorOpen,
  } = useProject();

  const completedCount = kpis?.completedTasks || 0;
  const readyCount = kpis?.readyTasks || 0;
  const blockedCount = kpis?.blockedTasks || 0;
  const overdueCount = kpis?.overdueTasks || 0;
  const impactedDownstreamCount = kpis?.impactedDownstreamTasks || 0;
  const completionPercentage = kpis?.completionPercentage || 0;
  const projectDuration = kpis?.estimatedProjectDuration || 0;
  const criticalPath = cpm?.criticalPath || [];

  const blockedTasks = tasks.filter((t) => t.status === 'Blocked');
  const readyTasks = tasks.filter((t) => t.status === 'Ready');
  const overdueTasks = tasks.filter((t) => t.isOverdue);

  const topBottleneck = [...tasks]
    .filter((t) => t.status !== 'Completed')
    .sort((a, b) => (b.blastRadius?.impactCount || 0) - (a.blastRadius?.impactCount || 0))[0];

  const handleInspectBlastRadius = (taskId) => {
    setSelectedTaskId(taskId);
    setBlastRadiusTaskId(taskId);
    setCurrentView('graph');
  };

  const handleInspectCriticalPath = () => {
    setShowCriticalPath(true);
    setCurrentView('graph');
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in select-none">
      {/* Top Banner / Project Target */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-panel-card border border-panel-border glass-panel">
        <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-800/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-zinc-800 text-emerald-400 border border-zinc-700">
                NexusFlow Project Telemetry
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {tasks.length} Total Orchestrated Tasks
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-sans">
              {project?.name || 'Cloud Platform Launch'}
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              {project?.description || 'Real-time Directed Acyclic Graph (DAG) dependency tracking, critical path calculations, and blast-radius bottleneck prevention.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsAdvisorOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-white text-zinc-950 shadow-sm transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Advisor</span>
            </button>
            <button
              onClick={handleInspectCriticalPath}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 hover:border-amber-400 transition-all"
            >
              <GitFork className="w-4 h-4 text-amber-400" />
              <span>Critical Path</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-6 border-t border-panel-border">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-zinc-300">Overall Milestone Progress</span>
            <span className="font-mono font-bold text-emerald-400">{completionPercentage}% Completed</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-900 border border-panel-border overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          title="Completion"
          value={`${completionPercentage}%`}
          subtitle={`${completedCount} of ${tasks.length} tasks`}
          icon={CheckCircle2}
          color="emerald"
        />
        <KpiCard
          title="Ready to Start"
          value={readyCount}
          subtitle="All prerequisites done"
          icon={PlayCircle}
          color="emerald"
          highlight={readyCount > 0}
        />
        <KpiCard
          title="Blocked Tasks"
          value={blockedCount}
          subtitle={`${impactedDownstreamCount} downstream affected`}
          icon={ShieldAlert}
          color="rose"
          highlight={blockedCount > 0}
        />
        <KpiCard
          title="Overdue / Risk"
          value={overdueCount}
          subtitle="Past planned due date"
          icon={AlertTriangle}
          color="amber"
          highlight={overdueCount > 0}
        />
        <KpiCard
          title="Project Duration"
          value={`${projectDuration}d`}
          subtitle="Critical Path baseline"
          icon={Clock}
          color="zinc"
        />
        <KpiCard
          title="Critical Chain"
          value={criticalPath.length}
          subtitle="Zero-slack tasks"
          icon={GitFork}
          color="amber"
          highlight
        />
      </div>

      {/* Main Two-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Bottlenecks & Ready Tasks */}
        <div className="lg:col-span-7 space-y-6">
          {/* Primary Bottleneck Spotlight */}
          {topBottleneck && (
            <div className="p-6 rounded-2xl bg-panel-card border border-rose-500/30 glass-panel shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Highest-Impact Bottleneck
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {topBottleneck.blastRadius?.impactCount || 0} Downstream Dependents
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                      {topBottleneck.taskId}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {topBottleneck.title}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                    {topBottleneck.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      Status: <strong className="text-white">{topBottleneck.status}</strong>
                    </span>
                    <span>•</span>
                    <span>Owner: <strong className="text-white">{topBottleneck.owner?.name}</strong></span>
                    <span>•</span>
                    <span>Due: <strong className="text-rose-400">{topBottleneck.dueDate}</strong></span>
                  </div>
                </div>

                <button
                  onClick={() => handleInspectBlastRadius(topBottleneck.taskId)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 flex items-center gap-1.5 shrink-0 transition-all hover:scale-105"
                >
                  <span>Inspect Blast Radius</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Ready to Pick Up Tasks */}
          <div className="p-6 rounded-2xl bg-panel-card border border-panel-border glass-panel">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Ready to Pick Up ({readyTasks.length})</h3>
              </div>
              <button
                onClick={() => setCurrentView('board')}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                View on Board <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {readyTasks.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">No idle ready tasks currently.</p>
            ) : (
              <div className="space-y-2.5">
                {readyTasks.map((task) => (
                  <div
                    key={task.taskId}
                    onClick={() => {
                      setSelectedTaskId(task.taskId);
                      setCurrentView('board');
                    }}
                    className="p-3.5 rounded-xl bg-panel hover:bg-panel-hover border border-panel-border hover:border-zinc-600 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-400">
                            {task.taskId}
                          </span>
                          <span className="text-xs font-medium text-white truncate">
                            {task.title}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400">
                          {task.owner?.name} • Duration: {task.estimatedDays}d
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                      Prerequisites Done
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Blocked Tasks Summary */}
          <div className="p-6 rounded-2xl bg-panel-card border border-panel-border glass-panel">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Currently Blocked Tasks ({blockedTasks.length})</h3>
              </div>
              <button
                onClick={() => setCurrentView('graph')}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
              >
                Inspect in Graph <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {blockedTasks.slice(0, 4).map((task) => (
                <div
                  key={task.taskId}
                  onClick={() => handleInspectBlastRadius(task.taskId)}
                  className="p-3.5 rounded-xl bg-panel hover:bg-panel-hover border border-panel-border hover:border-rose-500/40 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-rose-400">
                          {task.taskId}
                        </span>
                        <span className="text-xs font-medium text-white truncate">
                          {task.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        Waiting on: {(task.dependencies || []).join(', ') || 'Prerequisites'}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-rose-500/10 text-rose-300 border border-rose-500/30 shrink-0">
                    {task.blastRadius?.impactCount || 0} impacted
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Overdue, Critical Path, Quick Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Overdue / High Risk Tasks */}
          <div className="p-6 rounded-2xl bg-panel-card border border-panel-border glass-panel">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Overdue & Schedule Slippage</h3>
              </div>
              <span className="text-xs font-mono text-amber-400">{overdueTasks.length} At Risk</span>
            </div>

            {overdueTasks.length === 0 ? (
              <p className="text-xs text-zinc-400 py-3 text-center">All active tasks are currently on schedule.</p>
            ) : (
              <div className="space-y-3">
                {overdueTasks.map((t) => (
                  <div
                    key={t.taskId}
                    className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400">{t.taskId}</span>
                        <span className="text-xs font-medium text-white">{t.title}</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1">
                        Owner: {t.owner?.name} • Due Date: {t.dueDate}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 shrink-0">
                      Overdue
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Critical Path Flow Overview */}
          <div className="p-6 rounded-2xl bg-panel-card border border-amber-500/30 glass-panel shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Critical Path Sequence</h3>
              </div>
              <span className="text-[11px] font-mono text-amber-300">{projectDuration} Days Total</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              These zero-slack tasks directly establish the earliest possible project completion date:
            </p>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              {criticalPath.map((id, index) => (
                <React.Fragment key={id}>
                  <button
                    onClick={() => {
                      setSelectedTaskId(id);
                      setCurrentView('graph');
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 hover:border-amber-400 transition-all"
                  >
                    {id}
                  </button>
                  {index < criticalPath.length - 1 && (
                    <span className="text-zinc-500 text-xs font-bold">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            <button
              onClick={handleInspectCriticalPath}
              className="w-full py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 text-center transition-all"
            >
              Highlight Critical Path in Interactive Graph
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="p-5 rounded-2xl bg-panel-card border border-panel-border glass-panel space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
              Fast Navigation
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setCurrentView('graph')}
                className="p-3 rounded-xl bg-panel hover:bg-panel-hover border border-panel-border text-left text-zinc-200 hover:text-white transition-all flex flex-col gap-1"
              >
                <GitFork className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">Graph</span>
                <span className="text-[10px] text-zinc-400">Drag & drop dependencies</span>
              </button>
              <button
                onClick={() => setCurrentView('timeline')}
                className="p-3 rounded-xl bg-panel hover:bg-panel-hover border border-panel-border text-left text-zinc-200 hover:text-white transition-all flex flex-col gap-1"
              >
                <Calendar className="w-4 h-4 text-zinc-300" />
                <span className="font-semibold">Timeline</span>
                <span className="text-[10px] text-zinc-400">Duration & real calendar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
