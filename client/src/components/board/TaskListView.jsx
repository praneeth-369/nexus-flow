import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../services/graphUtils';
import {
  Sparkles,
  Clock,
  Flame,
  MoreVertical,
  Edit2,
  Trash2,
  GitFork,
} from 'lucide-react';

export default function TaskListView() {
  const {
    filteredTasks,
    cpm,
    setSelectedTaskId,
    setBlastRadiusTaskId,
    setCurrentView,
    setTaskModalData,
    handleDeleteTask,
    currentRole,
  } = useProject();

  const criticalPathSet = new Set(cpm?.criticalPath || []);
  const isViewer = currentRole === 'Viewer';

  const handleInspectBlast = (e, taskId) => {
    e.stopPropagation();
    setSelectedTaskId(taskId);
    setBlastRadiusTaskId(taskId);
    setCurrentView('graph');
  };

  const handleEdit = (e, task) => {
    e.stopPropagation();
    if (isViewer) return;
    setTaskModalData({ isOpen: true, mode: 'edit', task });
  };

  const handleDelete = async (e, taskId) => {
    e.stopPropagation();
    if (isViewer) return;
    if (window.confirm(`Are you sure you want to delete task ${taskId}?`)) {
      await handleDeleteTask(taskId);
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-panel-border bg-panel-card glass-panel">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-panel-border bg-panel text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            <th className="py-3.5 px-4">Task ID</th>
            <th className="py-3.5 px-4">Title & Scope</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">Priority</th>
            <th className="py-3.5 px-4">Owner</th>
            <th className="py-3.5 px-4">Due Date</th>
            <th className="py-3.5 px-4">Duration</th>
            <th className="py-3.5 px-4">Prerequisites</th>
            <th className="py-3.5 px-4 text-center">Blast Radius</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-panel-border/60">
          {filteredTasks.length === 0 ? (
            <tr>
              <td colSpan={10} className="py-12 text-center text-slate-300">
                No tasks match current search or filter criteria.
              </td>
            </tr>
          ) : (
            filteredTasks.map((task) => {
              const statusStyle = STATUS_COLORS[task.status] || STATUS_COLORS.Ready;
              const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium;
              const isCritical = criticalPathSet.has(task.taskId);

              return (
                <tr
                  key={task.taskId}
                  onClick={() => setSelectedTaskId(task.taskId)}
                  className="hover:bg-panel-hover/80 transition-colors cursor-pointer group"
                >
                  {/* Task ID & CPM tag */}
                  <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-cyan-400 group-hover:underline">
                        {task.taskId}
                      </span>
                      {isCritical && (
                        <span className="flex items-center gap-0.5 text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40" title="Critical Path (Zero Slack)">
                          <Sparkles className="w-2.5 h-2.5 text-amber-400" /> CPM
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Title */}
                  <td className="py-3.5 px-4 min-w-[200px] max-w-[320px]">
                    <div className="font-semibold text-white truncate">{task.title}</div>
                    <div className="text-[11px] text-slate-300 truncate">{task.description}</div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {task.status}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${priorityStyle}`}>
                      {task.priority}
                    </span>
                  </td>

                  {/* Owner */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
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
                      <span className="text-slate-300 truncate">{task.owner?.name}</span>
                    </div>
                  </td>

                  {/* Due Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className={`flex items-center gap-1 font-mono text-[11px] ${task.isOverdue ? 'text-amber-400 font-semibold' : 'text-slate-300'}`}>
                      {task.dueDate}
                      {task.isOverdue && <Clock className="w-3 h-3 text-amber-400" />}
                    </div>
                  </td>

                  {/* Duration */}
                  <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                    {task.estimatedDays} days
                  </td>

                  {/* Prerequisites */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {(task.dependencies || []).length === 0 ? (
                      <span className="text-slate-300 font-mono text-[11px]">None</span>
                    ) : (
                      <div className="flex items-center gap-1 flex-wrap max-w-[140px]">
                        {task.dependencies.map((dep) => (
                          <span
                            key={dep}
                            className="px-1.5 py-0.2 rounded bg-panel-border text-[10px] font-mono text-slate-300"
                          >
                            {dep}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Blast Radius */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {(task.blastRadius?.impactCount || 0) > 0 ? (
                      <button
                        onClick={(e) => handleInspectBlast(e, task.taskId)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-colors"
                        title="Click to view downstream impact blast radius"
                      >
                        <Flame className="w-3 h-3 text-rose-400" />
                        <span>{task.blastRadius.impactCount} tasks</span>
                      </button>
                    ) : (
                      <span className="text-slate-300 font-mono text-[11px]">0</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => handleInspectBlast(e, task.taskId)}
                        className="p-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-panel transition-colors"
                        title="Inspect in Graph"
                      >
                        <GitFork className="w-3.5 h-3.5" />
                      </button>
                      {!isViewer && (
                        <>
                          <button
                            onClick={(e) => handleEdit(e, task)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-panel transition-colors"
                            title="Edit Task"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, task.taskId)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-panel transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
