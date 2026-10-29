import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../services/api';
import {
  Download,
  Upload,
  RotateCcw,
  Database,
  X,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function ImportExportModal() {
  const {
    isImportExportOpen,
    setIsImportExportOpen,
    storageStatus,
    handleResetWorkspace,
    loadWorkspaceData,
    addNotification,
  } = useProject();

  const [importing, setImporting] = useState(false);
  const [resetting, setResetting] = useState(false);

  if (!isImportExportOpen) return null;

  const handleExport = (format) => {
    api.exportProject(format);
    addNotification('success', `Exporting project as ${format.toUpperCase()}...`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setImporting(true);
        const parsed = JSON.parse(event.target.result);
        const tasksToImport = Array.isArray(parsed) ? parsed : parsed.tasks;

        if (!Array.isArray(tasksToImport) || tasksToImport.length === 0) {
          throw new Error('Import file must contain a valid array of tasks.');
        }

        await api.importProject(tasksToImport);
        addNotification('success', `Imported ${tasksToImport.length} tasks successfully.`);
        await loadWorkspaceData(true);
        setIsImportExportOpen(false);
      } catch (err) {
        addNotification('error', `Import failed: ${err.message}`);
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    if (
      window.confirm(
        'Are you sure you want to restore the workspace to default Cloud Platform v2.0 seed tasks? Any custom tasks will be replaced.'
      )
    ) {
      setResetting(true);
      await handleResetWorkspace();
      setResetting(false);
      setIsImportExportOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-panel-card border border-panel-border shadow-2xl p-6 md:p-8 glass-modal animate-slide-up text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-panel-border mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Workspace Data & Portability
            </h3>
            <span className="text-slate-400 text-xs">
              Import, export, backup, or restore project baseline state
            </span>
          </div>

          <button
            onClick={() => setIsImportExportOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-panel transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database Engine Status */}
        <div className="p-4 rounded-2xl bg-panel border border-panel-border mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-400" />
              Active Storage Engine
            </span>
            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              {storageStatus?.mode === 'mongodb' ? 'MongoDB Atlas' : 'Local Resilient Fallback'}
            </span>
          </div>
          <div className="text-[11px] text-slate-300 font-mono truncate">
            URI: {storageStatus?.uri || 'Connected'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Dual-Mode Storage Engine maintains zero-downtime cache with automatic cloud cluster synchronization.
          </p>
        </div>

        {/* Export Section */}
        <div className="mb-6">
          <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export Project Data
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleExport('json')}
              className="p-3.5 rounded-xl bg-panel hover:bg-panel-hover border border-panel-border hover:border-cyan-500/40 text-left transition-all group"
            >
              <div className="flex items-center gap-2 mb-1">
                <FileJson className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-white">JSON Archive</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Complete DAG graph, task properties, and metadata.
              </p>
            </button>

            <button
              onClick={() => handleExport('csv')}
              className="p-3.5 rounded-xl bg-panel hover:bg-panel-hover border border-panel-border hover:border-emerald-500/40 text-left transition-all group"
            >
              <div className="flex items-center gap-2 mb-1">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-white">CSV Spreadsheet</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Tabular format for Excel, Google Sheets, or reporting.
              </p>
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="mb-6">
          <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            Import Project JSON
          </h4>
          <label className="block p-4 rounded-xl border border-dashed border-panel-border hover:border-cyan-500/60 bg-panel/60 cursor-pointer text-center transition-all group">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              disabled={importing}
              className="hidden"
            />
            <span className="text-xs font-semibold text-cyan-400 group-hover:underline">
              {importing ? 'Importing file...' : 'Choose a JSON file or drag & drop'}
            </span>
            <span className="block text-[10px] text-slate-500 mt-0.5">
              Accepts NexusFlow exported workspace JSON
            </span>
          </label>
        </div>

        {/* Restore Workspace Baseline */}
        <div className="pt-4 border-t border-panel-border flex items-center justify-between">
          <div>
            <span className="font-semibold text-white block">Reset Default Workspace</span>
            <span className="text-[10px] text-slate-400">
              Restore the 12 interconnected Cloud Platform v2.0 tasks
            </span>
          </div>

          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Restoring...' : 'Restore Defaults'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
