import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [cpm, setCpm] = useState({ projectDuration: 0, criticalPath: [] });
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(() => {
    return localStorage.getItem('nexusflow_active_project_id') || 'nexusflow-cloud-v2';
  });
  const [kpis, setKpis] = useState(null);
  const [storageStatus, setStorageStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // User Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nexusflow_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const currentRole = currentUser?.role || 'Viewer';

  // Workspace Navigation & Controls
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'graph' | 'board' | 'timeline'
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [blastRadiusTaskId, setBlastRadiusTaskId] = useState(null);
  const [showCriticalPath, setShowCriticalPath] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');

  // Modals & Drawers
  const [taskModalData, setTaskModalData] = useState({ isOpen: false, mode: 'create', task: null });
  const [cycleModalData, setCycleModalData] = useState({ isOpen: false, cyclePath: [], message: '' });
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((type, message) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4500);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Fetch all tasks and graph metrics for active project
  const loadWorkspaceData = useCallback(async (quiet = false, targetProjectId = null) => {
    const projId = targetProjectId || activeProjectId;
    try {
      if (!quiet) setLoading(true);
      const [tasksRes, projectRes, projectsRes] = await Promise.all([
        api.getTasks(projId),
        api.getProject(projId),
        api.getProjects(),
      ]);

      if (tasksRes.success) {
        setTasks(tasksRes.tasks || []);
        setCpm(tasksRes.cpm || { projectDuration: 0, criticalPath: [] });
      }

      if (projectRes.success) {
        setProject(projectRes.project);
        setKpis(projectRes.kpis);
        setStorageStatus(projectRes.storageStatus);
      }

      if (projectsRes.success) {
        setProjects(projectsRes.projects || []);
      }
    } catch (err) {
      console.error('Failed to load workspace data:', err);
      addNotification('error', `Connection error: ${err.message}`);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [activeProjectId, addNotification]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // Switch Active Project
  const switchProject = async (newProjectId) => {
    if (newProjectId === activeProjectId) return;
    setActiveProjectId(newProjectId);
    localStorage.setItem('nexusflow_active_project_id', newProjectId);
    setSelectedTaskId(null);
    setBlastRadiusTaskId(null);
    await loadWorkspaceData(false, newProjectId);
    addNotification('info', `Switched workspace to project.`);
  };

  // Create Project
  const handleCreateProject = async (projectData) => {
    try {
      const res = await api.createProject(projectData);
      if (res.success && res.project) {
        const newId = res.project.projectId;
        setActiveProjectId(newId);
        localStorage.setItem('nexusflow_active_project_id', newId);
        setSelectedTaskId(null);
        setBlastRadiusTaskId(null);
        addNotification('success', `Created project "${res.project.name}" with ${res.taskCount || 0} tasks!`);
        await loadWorkspaceData(false, newId);
        return { success: true };
      }
      return { success: false, error: 'Project creation returned incomplete payload' };
    } catch (err) {
      addNotification('error', err.message);
      return { success: false, error: err.message };
    }
  };

  // Delete Project
  const handleDeleteProject = async (projectIdToDelete) => {
    try {
      await api.deleteProject(projectIdToDelete);
      addNotification('success', 'Project workspace deleted.');
      const fallbackId = 'nexusflow-cloud-v2';
      setActiveProjectId(fallbackId);
      localStorage.setItem('nexusflow_active_project_id', fallbackId);
      setSelectedTaskId(null);
      setBlastRadiusTaskId(null);
      await loadWorkspaceData(false, fallbackId);
      return { success: true };
    } catch (err) {
      addNotification('error', err.message);
      return { success: false, error: err.message };
    }
  };

  // Update Project Settings
  const handleUpdateProject = async (updates) => {
    try {
      const res = await api.updateProject(activeProjectId, updates);
      addNotification('success', `Project "${res.project.name}" updated successfully.`);
      await loadWorkspaceData(true, activeProjectId);
      setIsEditProjectOpen(false);
      return { success: true };
    } catch (err) {
      addNotification('error', err.message);
      return { success: false, error: err.message };
    }
  };

  // Task Actions
  const handleCreateTask = async (taskData) => {
    try {
      const payload = {
        ...taskData,
        projectId: activeProjectId,
      };
      const res = await api.createTask(payload);
      addNotification('success', `Task ${res.task.taskId} created successfully.`);
      await loadWorkspaceData(true, activeProjectId);
      setTaskModalData({ isOpen: false, mode: 'create', task: null });
      return { success: true };
    } catch (err) {
      if (err.code === 'CIRCULAR_DEPENDENCY') {
        setCycleModalData({
          isOpen: true,
          cyclePath: err.cyclePath || [],
          message: err.message,
        });
      } else {
        addNotification('error', err.message);
      }
      return { success: false, error: err.message };
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const prevTask = tasks.find(t => t.taskId === taskId);
      const res = await api.updateTask(taskId, updates);
      
      if (updates.status === 'Completed' && prevTask?.status !== 'Completed') {
        addNotification('success', `Completed ${taskId}! Recalculating downstream dependencies...`);
      } else {
        addNotification('success', `Task ${taskId} updated.`);
      }

      await loadWorkspaceData(true, activeProjectId);
      setTaskModalData({ isOpen: false, mode: 'edit', task: null });
      return { success: true };
    } catch (err) {
      if (err.code === 'CIRCULAR_DEPENDENCY') {
        setCycleModalData({
          isOpen: true,
          cyclePath: err.cyclePath || [],
          message: err.message,
        });
      } else {
        addNotification('error', err.message);
      }
      return { success: false, error: err.message };
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.deleteTask(taskId);
      addNotification('success', `Task ${taskId} and associated dependencies deleted.`);
      if (selectedTaskId === taskId) setSelectedTaskId(null);
      if (blastRadiusTaskId === taskId) setBlastRadiusTaskId(null);
      await loadWorkspaceData(true, activeProjectId);
      return { success: true };
    } catch (err) {
      addNotification('error', err.message);
      return { success: false, error: err.message };
    }
  };

  const handleResetWorkspace = async () => {
    try {
      await api.resetProject(activeProjectId);
      addNotification('success', 'Workspace reset to baseline seed data.');
      setSelectedTaskId(null);
      setBlastRadiusTaskId(null);
      await loadWorkspaceData(true, activeProjectId);
    } catch (err) {
      addNotification('error', err.message);
    }
  };

  const handleLogin = async (identifier, password) => {
    try {
      const res = await api.login(identifier, password);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        localStorage.setItem('nexusflow_user', JSON.stringify(res.user));
        addNotification('success', `Welcome back, ${res.user.name} (${res.user.role})!`);
        return { success: true };
      }
    } catch (err) {
      addNotification('error', err.message);
      return { success: false, error: err.message };
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('nexusflow_user');
    addNotification('info', 'Logged out successfully.');
  };

  // Filtered Tasks
  const filteredTasks = tasks.filter(task => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = task.taskId.toLowerCase().includes(q);
      const matchTitle = (task.title || '').toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      const matchOwner = (task.owner?.name || '').toLowerCase().includes(q);
      const matchTag = (task.tags || []).some(t => t.toLowerCase().includes(q));
      if (!matchId && !matchTitle && !matchDesc && !matchOwner && !matchTag) return false;
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'Overdue') {
        if (!task.isOverdue) return false;
      } else if (task.status !== filterStatus) {
        return false;
      }
    }

    if (filterPriority !== 'all' && task.priority !== filterPriority) {
      return false;
    }

    if (filterAssignee !== 'all' && task.owner?.name !== filterAssignee) {
      return false;
    }

    return true;
  });

  const selectedTask = tasks.find(t => t.taskId === selectedTaskId) || null;

  const value = {
    tasks,
    filteredTasks,
    cpm,
    project,
    projects,
    activeProjectId,
    switchProject,
    handleCreateProject,
    handleDeleteProject,
    handleUpdateProject,
    isCreateProjectOpen,
    setIsCreateProjectOpen,
    isEditProjectOpen,
    setIsEditProjectOpen,
    kpis,
    storageStatus,
    loading,
    currentUser,
    handleLogin,
    handleLogout,
    currentView,
    setCurrentView,
    currentRole,
    selectedTaskId,
    setSelectedTaskId,
    selectedTask,
    blastRadiusTaskId,
    setBlastRadiusTaskId,
    showCriticalPath,
    setShowCriticalPath,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    filterAssignee,
    setFilterAssignee,
    taskModalData,
    setTaskModalData,
    cycleModalData,
    setCycleModalData,
    isAdvisorOpen,
    setIsAdvisorOpen,
    isImportExportOpen,
    setIsImportExportOpen,
    notifications,
    addNotification,
    removeNotification,
    loadWorkspaceData,
    handleCreateTask,
    handleUpdateTask,
    handleDeleteTask,
    handleResetWorkspace,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
