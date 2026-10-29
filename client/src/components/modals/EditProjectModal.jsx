import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  FolderEdit,
  X,
  Calendar,
  Tag,
  FileText,
  Save,
} from 'lucide-react';

export default function EditProjectModal() {
  const {
    project,
    isEditProjectOpen,
    setIsEditProjectOpen,
    handleUpdateProject,
    currentRole,
  } = useProject();

  const [name, setName] = useState('');
  const [taskPrefix, setTaskPrefix] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setTaskPrefix(project.taskPrefix || 'PRJ');
      setDescription(project.description || '');
      setTargetDate(project.targetDate || '');
    }
  }, [project, isEditProjectOpen]);

  if (!isEditProjectOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await handleUpdateProject({
        name: name.trim(),
        taskPrefix: (taskPrefix || 'PRJ').toUpperCase().trim(),
        description: description.trim(),
        targetDate,
      });

      if (!res.success) {
        setError(res.error || 'Failed to update project');
      }
    } catch (err) {
      setError(err.message || 'Error updating project');
    } finally {
      setSubmitting(false);
    }
  };

  const isViewer = currentRole === 'Viewer';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-lg bg-panel-card border border-panel-border rounded-2xl shadow-2xl overflow-hidden glass-modal">
        {/* Header */}
        <div className="px-6 py-4 border-b border-panel-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 text-emerald-400 flex items-center justify-center">
              <FolderEdit className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Project Settings</h2>
              <p className="text-xs text-zinc-400">Update project name, target schedule, and task prefix</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditProjectOpen(false)}
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
              disabled={isViewer}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cloud Platform v2.0 Launch"
              className="w-full bg-panel border border-panel-border focus:border-zinc-500 text-xs text-white placeholder-zinc-500 px-3.5 py-2.5 rounded-xl outline-none transition-all disabled:opacity-50"
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
                disabled={isViewer}
                maxLength={6}
                value={taskPrefix}
                onChange={(e) => setTaskPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="e.g. NX, MOB"
                className="w-full bg-panel border border-panel-border focus:border-zinc-500 text-xs font-mono font-semibold text-emerald-400 placeholder-zinc-500 px-3.5 py-2.5 rounded-xl outline-none transition-all uppercase disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                Target Launch Date
              </label>
              <input
                type="date"
                disabled={isViewer}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-panel border border-panel-border focus:border-zinc-500 text-xs text-white px-3.5 py-2.5 rounded-xl outline-none transition-all [color-scheme:dark] disabled:opacity-50"
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
              rows={3}
              disabled={isViewer}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key project goals, deliverables, and release milestones..."
              className="w-full bg-panel border border-panel-border focus:border-zinc-500 text-xs text-white placeholder-zinc-500 p-3 rounded-xl outline-none transition-all resize-none disabled:opacity-50"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-panel-border flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-500">ID: {project?.projectId}</span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditProjectOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || isViewer}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-white text-zinc-950 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-950 border-t-transparent animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
