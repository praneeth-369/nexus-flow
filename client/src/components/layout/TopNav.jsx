import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  Plus,
  ShieldCheck,
  Eye,
  Download,
  UserCheck,
  LogOut,
  ChevronDown,
  FolderPlus,
  Layers,
  Trash2,
  Check,
  Settings,
} from 'lucide-react';

export default function TopNav() {
  const {
    project,
    projects,
    activeProjectId,
    switchProject,
    handleDeleteProject,
    setIsCreateProjectOpen,
    setIsEditProjectOpen,
    currentRole,
    currentUser,
    handleLogout,
    setTaskModalData,
    setIsImportExportOpen,
    kpis,
  } = useProject();

  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const isViewer = currentRole === 'Viewer';

  return (
    <header className="h-16 px-6 border-b border-panel-border bg-canvas/90 backdrop-blur-xl flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
      {/* Left: Project Selector Dropdown */}
      <div className="relative">
        <button
          onClick={() => {
            setProjectMenuOpen(!projectMenuOpen);
            setRoleMenuOpen(false);
            setFilterMenuOpen(false);
          }}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-panel-border bg-panel/80 hover:bg-panel-hover hover:border-zinc-600 text-left transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-zinc-300 group-hover:text-white transition-colors">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0 pr-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-tight truncate max-w-[180px] md:max-w-[260px]">
                {project?.name || 'Cloud Platform Launch'}
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {project?.taskPrefix || 'NX'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 truncate">
              <span>{kpis?.totalTasks || 0} tasks</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">{kpis?.completionPercentage || 0}% done</span>
            </div>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${projectMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Project Selector Menu */}
        {projectMenuOpen && (
          <div className="absolute left-0 mt-2 w-80 rounded-2xl p-2.5 bg-panel-card border border-panel-border shadow-2xl glass-modal z-50 text-xs animate-fade-in">
            <div className="px-2.5 py-1.5 border-b border-panel-border mb-2 flex items-center justify-between">
              <span className="font-semibold text-zinc-300 text-[11px] uppercase tracking-wider">
                Project Workspaces ({projects.length})
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Switch or create</span>
            </div>

            {/* List of projects */}
            <div className="space-y-1 max-h-60 overflow-y-auto pr-1 mb-2">
              {projects.map((p) => {
                const isActive = (p.projectId || 'nexusflow-cloud-v2') === activeProjectId;
                return (
                  <div
                    key={p.projectId}
                    className={`group/item flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-zinc-800/80 border border-zinc-700 text-white font-medium'
                        : 'hover:bg-panel text-zinc-300 hover:text-white border border-transparent'
                    }`}
                    onClick={() => {
                      switchProject(p.projectId);
                      setProjectMenuOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 shadow-glow-accent' : 'bg-zinc-600'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-semibold text-xs text-white">{p.name}</span>
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {p.taskPrefix || 'PRJ'}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block truncate">
                          {p.taskCount || 0} tasks • {p.completionPercentage || 0}% complete
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 ml-2">
                      {isActive && (
                        <>
                          {!isViewer && (
                            <button
                              title="Edit Project Settings"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProjectMenuOpen(false);
                                setIsEditProjectOpen(true);
                              }}
                              className="p-1 hover:text-white text-zinc-400 rounded hover:bg-zinc-700 transition-all"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <Check className="w-4 h-4 text-emerald-400" />
                        </>
                      )}
                      {!isViewer && p.projectId !== 'nexusflow-cloud-v2' && (
                        <button
                          title="Delete project"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete project "${p.name}" and all its tasks?`)) {
                              handleDeleteProject(p.projectId);
                            }
                          }}
                          className="opacity-0 group-hover/item:opacity-100 p-1 hover:text-rose-400 text-zinc-500 rounded transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* "+ New Project" Button */}
            <button
              onClick={() => {
                setProjectMenuOpen(false);
                setIsCreateProjectOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 font-semibold transition-colors text-xs shadow-sm"
            >
              <FolderPlus className="w-4 h-4 text-emerald-400" />
              <span>Create New Project</span>
            </button>
          </div>
        )}
      </div>



      {/* Right: Team Role Profile Menu, Export, and + New Task */}
      <div className="flex items-center gap-3">
        {/* User Account & Role Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-panel-border bg-panel hover:bg-panel-hover text-xs text-zinc-200 transition-colors"
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-5 h-5 rounded-full object-cover ring-1 ring-zinc-700"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-200 text-[10px] font-bold flex items-center justify-center">
                {currentUser?.initials || 'US'}
              </div>
            )}
            <div className="flex items-center gap-1.5 hidden md:flex">
              <span className="font-semibold text-white">{currentUser?.name || currentRole}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                {currentUser?.badge || currentRole}
              </span>
            </div>
          </button>

          {/* User Profile Dropdown Menu */}
          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl p-3 bg-panel-card border border-panel-border shadow-2xl glass-modal z-50 animate-fade-in text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-panel-border mb-3">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-zinc-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-200 text-xs font-bold flex items-center justify-center">
                    {currentUser?.initials || 'US'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-white text-sm block truncate">
                    {currentUser?.name || 'Authenticated User'}
                  </span>
                  <span className="text-[11px] text-zinc-400 truncate block">
                    {currentUser?.email || `${currentRole.toLowerCase()}@nexusflow.io`}
                  </span>
                  <span className="inline-block mt-1 text-[9px] font-mono font-bold px-2 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase">
                    {currentRole} ({currentUser?.badge || 'Active'})
                  </span>
                </div>
              </div>

              {/* Permissions scope */}
              <div className="p-2.5 rounded-xl bg-panel border border-panel-border mb-3 text-[11px] text-zinc-300">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Active Permissions
                </span>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  {currentUser?.description || 'Active role permissions boundary enforced.'}
                </p>
              </div>

              {/* Log out / Switch User */}
              <button
                onClick={() => {
                  setRoleMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold transition-colors text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out / Switch Account</span>
              </button>
            </div>
          )}
        </div>

        {/* Export / Import Button */}
        <button
          onClick={() => setIsImportExportOpen(true)}
          className="p-2 rounded-xl border border-panel-border bg-panel hover:bg-panel-hover text-zinc-300 hover:text-white transition-colors"
          title="Import / Export Project"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* "+ New Task" Button - Modern Crisp Obsidian / White */}
        <button
          disabled={isViewer}
          onClick={() => setTaskModalData({ isOpen: true, mode: 'create', task: null })}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isViewer
              ? 'opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-500 border border-zinc-700'
              : 'bg-zinc-100 hover:bg-white text-zinc-950 font-bold active:scale-95 shadow-sm'
          }`}
          title={isViewer ? 'Viewer role is read-only. Switch to Project Lead to add tasks.' : 'Create New Task'}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
}
