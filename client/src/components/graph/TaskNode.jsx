import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../services/graphUtils';
import { Clock, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

function TaskNode({ data, selected }) {
  const {
    task,
    isCritical,
    isBlastImpacted,
    isBlastRoot,
    isDimmed,
    targetPosition = Position.Left,
    sourcePosition = Position.Right,
    onSelect,
  } = data;

  const statusStyle = STATUS_COLORS[task.status] || STATUS_COLORS.Ready;
  const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium;

  // Determine border and glow classes
  let borderClasses = 'border-panel-border hover:border-zinc-500';
  let glowClasses = '';

  if (isBlastRoot) {
    borderClasses = 'border-rose-500 ring-2 ring-rose-500/50';
    glowClasses = 'shadow-glow-rose';
  } else if (isBlastImpacted) {
    borderClasses = 'border-rose-400/80 ring-1 ring-rose-400/40';
    glowClasses = 'shadow-glow-rose/60 animate-pulse-subtle';
  } else if (isCritical) {
    borderClasses = 'border-amber-500 ring-1 ring-amber-500/40';
    glowClasses = 'shadow-glow-amber/60';
  } else if (selected) {
    borderClasses = 'border-emerald-400 ring-2 ring-emerald-400/40';
    glowClasses = 'shadow-glow-accent';
  }

  return (
    <div
      onClick={() => onSelect && onSelect(task.taskId)}
      className={`relative w-[280px] rounded-2xl bg-panel-card p-4 transition-all duration-200 cursor-pointer border select-none ${borderClasses} ${glowClasses} ${
        isDimmed ? 'opacity-30 blur-[0.5px]' : 'opacity-100'
      }`}
    >
      {/* Input Handle (Prerequisites) */}
      <Handle
        type="target"
        position={targetPosition}
        className="!w-3 !h-3 !bg-zinc-700 hover:!bg-emerald-400 !border-2 !border-panel-card !-ml-1.5 transition-colors"
      />

      {/* Output Handle (Dependents) */}
      <Handle
        type="source"
        position={sourcePosition}
        className="!w-3 !h-3 !bg-zinc-500 hover:!bg-emerald-400 !border-2 !border-panel-card !-mr-1.5 transition-colors"
      />

      {/* Top Header: ID, Priority, Critical Badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-bold text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
            {task.taskId}
          </span>
          {isCritical && (
            <span className="flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40" title="On Critical Path (Zero Slack)">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" /> CPM
            </span>
          )}
        </div>

        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${priorityStyle}`}>
          {task.priority}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-xs font-semibold text-white line-clamp-2 mb-2.5 leading-snug">
        {task.title}
      </h4>

      {/* Status Badge & Overdue Indicator */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
          {task.status}
        </span>

        {task.isOverdue && (
          <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Overdue
          </span>
        )}

        {task.status === 'Completed' && (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        )}
      </div>

      {/* Footer: Assignee & Duration */}
      <div className="flex items-center justify-between pt-2.5 border-t border-panel-border/80 text-[11px] text-zinc-400">
        <div className="flex items-center gap-2 min-w-0">
          {task.owner?.avatar ? (
            <img
              src={task.owner.avatar}
              alt={task.owner.name}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-zinc-700 shrink-0"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-200 text-[9px] font-bold flex items-center justify-center shrink-0">
              {task.owner?.initials || 'UN'}
            </div>
          )}
          <span className="truncate text-zinc-300 text-[11px]">
            {task.owner?.name?.split(' ')[0] || 'Unassigned'}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] shrink-0">
          <span className="text-zinc-400">{task.estimatedDays}d</span>
          {(task.blastRadius?.impactCount || 0) > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded font-mono ${
                task.status === 'Blocked' || task.isOverdue
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
              title={`${task.blastRadius?.impactCount} downstream dependent tasks`}
            >
              +{task.blastRadius?.impactCount} dep
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(TaskNode);
