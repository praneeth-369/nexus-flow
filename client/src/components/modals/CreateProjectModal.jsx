import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  FolderPlus,
  X,
  Layers,
  Calendar,
  Tag,
  FileText,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function CreateProjectModal() {
  const {
    isCreateProjectOpen,
    setIsCreateProjectOpen,
    handleCreateProject,
  } = useProject();

  const [name, setName] = useState('');
  const [taskPrefix, setTaskPrefix] = useState('PRJ');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [template, setTemplate] = useState('starter'); // 'starter' | 'empty'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isCreateProjectOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a project name');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await handleCreateProject({
        name: name.trim(),
        taskPrefix: (taskPrefix || 'PRJ').toUpperCase().trim(),
        description: description.trim(),
        targetDate,
        template,
      });

      if (res.success) {
        setName('');
        setDescription('');
        setTaskPrefix('PRJ');
        setIsCreateProjectOpen(false);
      } else {
        setError(res.error || 'Failed to create project');
      }
    } catch (err) {
      setError(err.message || 'Error creating project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-lg bg-panel-card border border-panel-border rounded-2xl shadow-2xl overflow-hidden glass-modal">
        {/* Header */}
        <div className="px-6 py-4 border-b border-panel-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FolderPlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Create New Project</h2>
              <p className="text-xs text-zinc-400">Initialize a new project DAG workspace with dependency tracking</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateProjectOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-panel transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                // Auto-suggest 3-letter prefix if user hasn't changed it manually
                if (taskPrefix === 'PRJ' || taskPrefix === '') {
                  const words = e.target.value.trim().split(/\s+/);
                  if (words.length >= 2) {
                    setTaskPrefix((words[0][0] + words[1][0] + (words[2]?.[0] || 'X')).toUpperCase());
                  } else if (words[0].length >= 3) {
                    setTaskPrefix(words[0].substring(0, 3).toUpperCase());
                  }
                }
              }}
              placeholder="e.g. Mobile iOS & Android Launch, Payment Gateway v2"
              className="w-full bg-panel border border-panel-border focus:border-emerald-500/60 text-xs text-white placeholder-zinc-500 px-3.5 py-2.5 rounded-xl outline-none transition-all"
            />
          </div>

          {/* Task Prefix & Target Date Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                Task ID Prefix
              </label>
              <input
                type="text"
                maxLength={6}
                value={taskPrefix}
                onChange={(e) => setTaskPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="e.g. MOB, PAY, API"
                className="w-full bg-panel border border-panel-border focus:border-emerald-500/60 text-xs font-mono font-semibold text-emerald-400 placeholder-zinc-500 px-3.5 py-2.5 rounded-xl outline-none transition-all uppercase"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block font-mono">Tasks will be {taskPrefix || 'PRJ'}-101, {taskPrefix || 'PRJ'}-102...</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                Target Launch Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-panel border border-panel-border focus:border-emerald-500/60 text-xs text-white px-3.5 py-2.5 rounded-xl outline-none transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              Description & Scope
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key project goals, deliverables, and release milestones..."
              className="w-full bg-panel border border-panel-border focus:border-emerald-500/60 text-xs text-white placeholder-zinc-500 p-3 rounded-xl outline-none transition-all resize-none"
            />
          </div>

          {/* Starter Template Options */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              Initial Setup Template
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTemplate('starter')}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  template === 'starter'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-white'
                    : 'border-panel-border bg-panel text-zinc-400 hover:text-zinc-200 hover:bg-panel-hover'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Starter DAG
                  </span>
                  {template === 'starter' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Includes 6 pre-linked tasks with architecture, API, UI, testing, and deployment.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTemplate('empty')}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  template === 'empty'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-white'
                    : 'border-panel-border bg-panel text-zinc-400 hover:text-zinc-200 hover:bg-panel-hover'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Empty Canvas</span>
                  {template === 'empty' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Clean slate with 0 tasks. Build custom dependency graph from scratch.
                </p>
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-panel-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateProjectOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-950 border-t-transparent animate-spin" />
                  <span>Creating Workspace...</span>
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4" />
                  <span>Create Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
