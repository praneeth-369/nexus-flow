import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  LayoutDashboard,
  GitFork,
  Kanban,
  Calendar,
  Sparkles,
  Database,
  ChevronLeft,
  ChevronRight,
  Layers,
  Settings,
} from 'lucide-react';

export default function Sidebar() {
  const {
    currentView,
    setCurrentView,
    storageStatus,
    setIsAdvisorOpen,
    setIsImportExportOpen,
    setIsEditProjectOpen,
    kpis,
    project,
  } = useProject();

  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'graph',
      label: 'Graph',
      icon: GitFork,
      badge: kpis?.criticalPathLength ? `${kpis.criticalPathLength} CPM` : null,
      badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    },
    {
      id: 'board',
      label: 'Board',
      icon: Kanban,
      badge: kpis?.totalTasks ? `${kpis.totalTasks}` : null,
      badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: Calendar,
      badge: kpis?.estimatedProjectDuration ? `${kpis.estimatedProjectDuration}d` : null,
      badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    },
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col justify-between border-r border-panel-border bg-canvas-darker transition-all duration-300 ease-in-out shrink-0 select-none ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Top Branding */}
      <div>
        <div className="flex items-center justify-between h-16 px-4 border-b border-panel-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 text-white shrink-0 shadow-sm">
              <Layers className="w-5 h-5 text-zinc-200" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-canvas-darker" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5 font-sans">
                  NexusFlow
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-zinc-800 text-emerald-400 border border-zinc-700">
                    SaaS
                  </span>
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">Dependency Engine</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-panel-hover transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* View Switcher */}
        <div className="p-3 space-y-1">
          <div className={`px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 ${collapsed ? 'text-center' : ''}`}>
            {collapsed ? '•••' : 'Workspace Views'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                  isActive
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-panel-hover border border-transparent'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                />
                {!collapsed && (
                  <div className="flex items-center justify-between w-full overflow-hidden">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono border ${item.badgeColor || 'bg-panel text-zinc-300 border-panel-border'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-panel-card border border-panel-border text-white text-[11px] rounded-md shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Smart Advisor & Database Status */}
      <div className="p-3 border-t border-panel-border space-y-2">
        {/* Smart Advisor Button */}
        <button
          onClick={() => setIsAdvisorOpen(true)}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-zinc-600 transition-all group relative`}
          title={collapsed ? 'Advisor' : undefined}
        >
          <Sparkles className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform shrink-0" />
          {!collapsed && (
            <div className="flex items-center justify-between w-full">
              <span>Advisor</span>
              <span className="text-[9px] bg-zinc-800 text-emerald-400 border border-zinc-700 px-1.5 py-0.5 rounded font-mono uppercase">
                AI
              </span>
            </div>
          )}
        </button>

        {/* Database Status */}
        <div
          onClick={() => setIsImportExportOpen(true)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] bg-panel-card border border-panel-border text-zinc-300 hover:border-zinc-600 transition-colors cursor-pointer group`}
          title={storageStatus?.database || 'Storage Engine'}
        >
          <Database className={`w-3.5 h-3.5 shrink-0 ${storageStatus?.connected ? 'text-emerald-400' : 'text-amber-400'}`} />
          {!collapsed && (
            <div className="flex flex-col overflow-hidden w-full">
              <span className="font-medium text-zinc-200 truncate flex items-center justify-between">
                {storageStatus?.mode === 'mongodb' ? 'MongoDB Atlas' : 'Local Fallback'}
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[10px] text-zinc-400 truncate">
                {storageStatus?.mode === 'mongodb' ? 'Live Cloud Cluster' : 'Resilient Memory Cache'}
              </span>
            </div>
          )}
        </div>

        {/* Settings & Reset */}
        <button
          onClick={() => setIsEditProjectOpen(true)}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] text-zinc-400 hover:text-zinc-100 hover:bg-panel-hover transition-colors`}
        >
          <Settings className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && <span>Workspace Settings</span>}
        </button>
      </div>
    </aside>
  );
}
