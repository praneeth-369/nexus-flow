import React from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import LoginPage from './components/auth/LoginPage';
import AIChatbot from './components/chat/AIChatbot';
import Sidebar from './components/layout/Sidebar';
import TopNav from './components/layout/TopNav';
import NotificationToast from './components/layout/NotificationToast';
import OverviewDashboard from './components/dashboard/OverviewDashboard';
import DependencyGraphView from './components/graph/DependencyGraphView';
import TaskBoardView from './components/board/TaskBoardView';
import TimelineGanttView from './components/timeline/TimelineGanttView';
import TaskModal from './components/modals/TaskModal';
import CycleConflictModal from './components/modals/CycleConflictModal';
import TaskDetailDrawer from './components/modals/TaskDetailDrawer';
import SmartAdvisorDrawer from './components/advisor/SmartAdvisorDrawer';
import ImportExportModal from './components/modals/ImportExportModal';
import CreateProjectModal from './components/modals/CreateProjectModal';
import EditProjectModal from './components/modals/EditProjectModal';

function WorkspaceLayout() {
  const { currentView, loading } = useProject();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-zinc-100 font-sans">
      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main Workspace Column */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Top Workspace Navigation Bar */}
        <TopNav />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto bg-canvas relative">
          {loading ? (
            <div className="h-full w-full flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <span className="text-xs text-zinc-400 font-mono">
                Computing DAG dependency graph & critical path...
              </span>
            </div>
          ) : (
            <>
              {currentView === 'dashboard' && <OverviewDashboard />}
              {currentView === 'graph' && <DependencyGraphView />}
              {currentView === 'board' && <TaskBoardView />}
              {currentView === 'timeline' && <TimelineGanttView />}
            </>
          )}
        </main>
      </div>

      {/* Drawers & Modals */}
      <TaskModal />
      <CycleConflictModal />
      <TaskDetailDrawer />
      <SmartAdvisorDrawer />
      <ImportExportModal />
      <CreateProjectModal />
      <EditProjectModal />
      <AIChatbot />
      <NotificationToast />
    </div>
  );
}

function AppContent() {
  const { currentUser } = useProject();

  if (!currentUser) {
    return (
      <>
        <LoginPage />
        <NotificationToast />
      </>
    );
  }

  return <WorkspaceLayout />;
}

export default function App() {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
}
