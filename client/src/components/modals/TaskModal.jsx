import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { willCreateCycle } from '../../services/graphUtils';
import { X, Plus, Trash2, AlertCircle, Check, Search } from 'lucide-react';

const TEAM_MEMBERS = [
  { name: 'Alex Rivera', role: 'System Architect', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', initials: 'AR' },
  { name: 'Marcus Chen', role: 'Backend Lead', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', initials: 'MC' },
  { name: 'Elena Rostova', role: 'Frontend Lead', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80', initials: 'ER' },
  { name: 'Dev Patel', role: 'Cloud Engineer', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80', initials: 'DP' },
  { name: 'Sofia Kim', role: 'UI Engineer', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80', initials: 'SK' },
  { name: 'Jordan Miller', role: 'Security SecOps', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80', initials: 'JM' },
  { name: 'Sarah Jenkins', role: 'QA Engineer', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80', initials: 'SJ' },
];

export default function TaskModal() {
  const {
    taskModalData,
    setTaskModalData,
    tasks,
    handleCreateTask,
    handleUpdateTask,
    addNotification,
  } = useProject();

  const isOpen = taskModalData?.isOpen;
  const isEdit = taskModalData?.mode === 'edit';
  const editingTask = taskModalData?.task;

  // Form State
  const [taskId, setTaskId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState(TEAM_MEMBERS[0]);
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Ready');
  const [dueDate, setDueDate] = useState('');
  const [estimatedDays, setEstimatedDays] = useState(3);
  const [selectedDependencies, setSelectedDependencies] = useState([]);
  const [prereqSearch, setPrereqSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Initialize form fields
  useEffect(() => {
    if (!isOpen) return;

    if (isEdit && editingTask) {
      setTaskId(editingTask.taskId || '');
      setTitle(editingTask.title || '');
      setDescription(editingTask.description || '');
      const matchedOwner = TEAM_MEMBERS.find((m) => m.name === editingTask.owner?.name) || editingTask.owner || TEAM_MEMBERS[0];
      setOwner(matchedOwner);
      setPriority(editingTask.priority || 'Medium');
      setStatus(editingTask.status || 'Ready');
      setDueDate(editingTask.dueDate || new Date().toISOString().split('T')[0]);
      setEstimatedDays(editingTask.estimatedDays || 3);
      setSelectedDependencies(editingTask.dependencies || []);
    } else {
      // Auto-generate next Task ID e.g. NX-113
      let nextNum = 101;
      const existingNums = tasks
        .map((t) => {
          const match = t.taskId.match(/^NX-(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => n > 0);
      if (existingNums.length > 0) {
        nextNum = Math.max(...existingNums) + 1;
      }
      setTaskId(`NX-${nextNum}`);
      setTitle('');
      setDescription('');
      setOwner(TEAM_MEMBERS[0]);
      setPriority('Medium');
      setStatus(editingTask?.status || 'Ready');

      const d = new Date();
      d.setDate(d.getDate() + 7);
      setDueDate(d.toISOString().split('T')[0]);
      setEstimatedDays(4);
      setSelectedDependencies([]);
    }
  }, [isOpen, isEdit, editingTask, tasks]);

  if (!isOpen) return null;

  const handleClose = () => {
    setTaskModalData({ isOpen: false, mode: 'create', task: null });
  };

  const toggleDependency = (depId) => {
    if (selectedDependencies.includes(depId)) {
      setSelectedDependencies(selectedDependencies.filter((id) => id !== depId));
    } else {
      // Self-check
      if (depId === taskId) {
        addNotification('error', 'A task cannot depend on itself.');
        return;
      }
      setSelectedDependencies([...selectedDependencies, depId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      addNotification('error', 'Task title is required.');
      return;
    }

    setSubmitting(true);
    const payload = {
      taskId: taskId.trim().toUpperCase(),
      title: title.trim(),
      description: description.trim(),
      owner,
      priority,
      status,
      dueDate,
      estimatedDays: Number(estimatedDays) || 1,
      dependencies: selectedDependencies,
      tags: ['NexusFlow'],
    };

    if (isEdit) {
      await handleUpdateTask(taskId, payload);
    } else {
      await handleCreateTask(payload);
    }
    setSubmitting(false);
  };

  // Filter available prerequisites (excluding current task)
  const availablePrereqs = tasks
    .filter((t) => t.taskId !== taskId)
    .filter((t) => {
      if (!prereqSearch.trim()) return true;
      const q = prereqSearch.toLowerCase();
      return (
        t.taskId.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.owner?.name || '').toLowerCase().includes(q)
      );
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-panel-card border border-panel-border shadow-2xl p-6 md:p-8 glass-modal animate-slide-up my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-panel-border mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {isEdit ? `Edit Task ${taskId}` : 'Create New Orchestrated Task'}
            </h3>
            <span className="text-xs text-slate-400">
              {isEdit
                ? 'Update task properties, assignee, and prerequisite dependencies'
                : 'Define scope, schedule parameters, and Directed Acyclic Graph (DAG) dependencies'}
            </span>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-panel transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: ID & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Task ID
              </label>
              <input
                type="text"
                value={taskId}
                disabled={isEdit}
                onChange={(e) => setTaskId(e.target.value)}
                placeholder="e.g. NX-113"
                className="w-full bg-panel border border-panel-border rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-cyan-400 focus:border-cyan-500 outline-none disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-panel border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
              >
                <option value="Critical">Critical (P0)</option>
                <option value="High">High (P1)</option>
                <option value="Medium">Medium (P2)</option>
                <option value="Low">Low (P3)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-panel border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
              >
                <option value="Ready">Ready</option>
                <option value="In Progress">In Progress</option>
                <option value="Blocked">Blocked</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Row 2: Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Ingress Controller & SSL Automation"
              className="w-full bg-panel border border-panel-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
              required
            />
          </div>

          {/* Row 3: Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description / Engineering Scope
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide technical context, deliverables, and acceptance criteria..."
              className="w-full bg-panel border border-panel-border rounded-xl px-3.5 py-2 text-xs text-white focus:border-cyan-500 outline-none resize-none"
            />
          </div>

          {/* Row 4: Owner, Due Date, Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Assignee
              </label>
              <select
                value={owner.name}
                onChange={(e) => {
                  const m = TEAM_MEMBERS.find((mem) => mem.name === e.target.value);
                  if (m) setOwner(m);
                }}
                className="w-full bg-panel border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
              >
                {TEAM_MEMBERS.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-panel border border-panel-border rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Estimated Days (Duration)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(e.target.value)}
                className="w-full bg-panel border border-panel-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Row 5: Prerequisite Picker (Searchable Multi-Select) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Prerequisite Dependencies ("This task cannot start until...")
              </label>
              <span className="text-[11px] font-mono text-cyan-400">
                {selectedDependencies.length} selected
              </span>
            </div>

            {/* Selected Prereq Pills */}
            {selectedDependencies.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-3 rounded-xl bg-panel border border-panel-border">
                {selectedDependencies.map((depId) => {
                  const depTask = tasks.find((t) => t.taskId === depId);
                  return (
                    <span
                      key={depId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                    >
                      <span>{depId}</span>
                      {depTask && (
                        <span className="text-[10px] text-slate-400 font-sans max-w-[120px] truncate">
                          ({depTask.title})
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleDependency(depId)}
                        className="hover:text-rose-400 transition-colors ml-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search Box */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={prereqSearch}
                onChange={(e) => setPrereqSearch(e.target.value)}
                placeholder="Search potential prerequisite tasks by ID, title, or assignee..."
                className="w-full bg-panel border border-panel-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
              />
            </div>

            {/* Scrollable Tasks List to pick from */}
            <div className="max-h-40 overflow-y-auto rounded-xl border border-panel-border divide-y divide-panel-border/50 bg-panel/50">
              {availablePrereqs.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500">
                  No matching tasks available.
                </div>
              ) : (
                availablePrereqs.map((t) => {
                  const isSelected = selectedDependencies.includes(t.taskId);
                  return (
                    <div
                      key={t.taskId}
                      onClick={() => toggleDependency(t.taskId)}
                      className={`p-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-cyan-500/10 text-cyan-200'
                          : 'hover:bg-panel-hover text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                              : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="font-mono font-bold text-cyan-400 shrink-0">
                          {t.taskId}
                        </span>
                        <span className="truncate">{t.title}</span>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                        {t.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-panel-border">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-panel transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 transition-all shadow-glow-cyan active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Saving Task...' : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
