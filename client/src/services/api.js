/**
 * NexusFlow API Client
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function getHeaders(custom = {}) {
  let role = 'Project Lead';
  let userId = 'usr-1';
  try {
    const raw = localStorage.getItem('nexusflow_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u.role) role = u.role;
      if (u.id) userId = u.id;
    }
  } catch {}

  return {
    'Content-Type': 'application/json',
    'x-user-role': role,
    'Authorization': `Bearer nexus-jwt-${userId}`,
    ...custom,
  };
}

export const api = {
  // Authentication
  async login(identifier, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to authenticate');
    return data;
  },

  async getAccounts() {
    const res = await fetch(`${API_BASE}/auth/accounts`);
    if (!res.ok) throw new Error('Failed to fetch demo accounts');
    return res.json();
  },

  // Project & Workspaces
  async getProjects() {
    const res = await fetch(`${API_BASE}/project/all`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async getProject(projectId) {
    const url = projectId ? `${API_BASE}/project?projectId=${encodeURIComponent(projectId)}` : `${API_BASE}/project`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch project info');
    return res.json();
  },

  async createProject(projectData) {
    const res = await fetch(`${API_BASE}/project/new`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(projectData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create project');
    return data;
  },

  async updateProject(projectId, updates) {
    const res = await fetch(`${API_BASE}/project/${encodeURIComponent(projectId)}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update project');
    return data;
  },

  async deleteProject(projectId) {
    const res = await fetch(`${API_BASE}/project/${encodeURIComponent(projectId)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete project');
    return data;
  },

  async resetProject(projectId) {
    const res = await fetch(`${API_BASE}/project/reset`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ projectId }),
    });
    if (!res.ok) throw new Error('Failed to reset project');
    return res.json();
  },

  async exportProject(format = 'json', projectId) {
    const qs = new URLSearchParams({ format });
    if (projectId) qs.set('projectId', projectId);
    window.open(`${API_BASE}/project/export?${qs.toString()}`, '_blank');
  },

  async importProject(tasks, projectId) {
    const res = await fetch(`${API_BASE}/project/import`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ tasks, projectId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to import tasks');
    return data;
  },

  // Tasks
  async getTasks(projectId) {
    const url = projectId ? `${API_BASE}/tasks?projectId=${encodeURIComponent(projectId)}` : `${API_BASE}/tasks`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async getTask(taskId) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch task details');
    return res.json();
  },

  async validateDependency(taskId, proposedDependencies, projectId) {
    const res = await fetch(`${API_BASE}/tasks/validate-dependency`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ taskId, proposedDependencies, projectId }),
    });
    return res.json();
  },

  async createTask(taskData) {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(taskData),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || data.error || 'Failed to create task');
      err.code = data.error;
      err.cyclePath = data.cyclePath;
      throw err;
    }
    return data;
  },

  async updateTask(taskId, updates) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || data.error || 'Failed to update task');
      err.code = data.error;
      err.cyclePath = data.cyclePath;
      throw err;
    }
    return data;
  },

  async deleteTask(taskId) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete task');
    return data;
  },

  // Smart Advisor & AI Chatbot
  async sendChatMessage(messages, projectId) {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ messages, projectId }),
    });
    if (!res.ok) throw new Error('Failed to send message to AI chatbot');
    return res.json();
  },

  async getAdvisorAnalysis(projectId) {
    const url = projectId ? `${API_BASE}/advisor/analyze?projectId=${encodeURIComponent(projectId)}` : `${API_BASE}/advisor/analyze`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch advisor analysis');
    return res.json();
  },
};
