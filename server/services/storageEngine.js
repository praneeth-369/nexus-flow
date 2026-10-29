import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { defaultTasks, defaultProject, createStarterTasks } from '../data/seedData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FALLBACK_FILE = path.join(__dirname, '../data/localFallbackStore.json');

class DualStorageEngine {
  constructor() {
    this.mode = 'local_fallback'; // 'mongodb' | 'local_fallback'
    this.connected = false;
    this.fallbackTasks = [];
    this.fallbackProjects = [{ ...defaultProject }];
    this.mongoUri = process.env.MONGODB_URI || '';
  }

  // Helper to ensure fallback file exists
  initFallbackFile() {
    try {
      if (fs.existsSync(FALLBACK_FILE)) {
        const raw = fs.readFileSync(FALLBACK_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.fallbackTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [...defaultTasks];
        // Ensure every fallback task has projectId
        this.fallbackTasks.forEach(t => {
          if (!t.projectId) t.projectId = defaultProject.projectId;
        });

        if (Array.isArray(parsed.projects) && parsed.projects.length > 0) {
          this.fallbackProjects = parsed.projects;
        } else if (parsed.project) {
          this.fallbackProjects = [parsed.project];
        } else {
          this.fallbackProjects = [{ ...defaultProject }];
        }
      } else {
        this.fallbackTasks = [...defaultTasks];
        this.fallbackProjects = [{ ...defaultProject }];
        this.persistFallbackFile();
      }
    } catch (err) {
      console.warn('[StorageEngine] Error reading local fallback file, initializing with defaults:', err.message);
      this.fallbackTasks = [...defaultTasks];
      this.fallbackProjects = [{ ...defaultProject }];
    }
  }

  persistFallbackFile() {
    try {
      fs.writeFileSync(
        FALLBACK_FILE,
        JSON.stringify(
          {
            projects: this.fallbackProjects,
            project: this.fallbackProjects[0] || defaultProject,
            tasks: this.fallbackTasks,
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (err) {
      console.error('[StorageEngine] Failed to persist fallback file:', err.message);
    }
  }

  async connect() {
    this.initFallbackFile();
    this.mongoUri = process.env.MONGODB_URI || this.mongoUri;

    if (!this.mongoUri || this.mongoUri.includes('<username>') || this.mongoUri.includes('<password>')) {
      console.log('⚡ [NexusFlow Storage] Using Local Resilient Storage Mode (No valid MongoDB URI configured).');
      this.mode = 'local_fallback';
      this.connected = true;
      return;
    }

    try {
      console.log('🔄 [NexusFlow Storage] Connecting to MongoDB Atlas...');
      mongoose.set('strictQuery', false);
      await mongoose.connect(this.mongoUri, {
        serverSelectionTimeoutMS: 6000,
      });

      this.mode = 'mongodb';
      this.connected = true;
      console.log('✅ [NexusFlow Storage] Connected successfully to MongoDB Atlas!');

      // Ensure default project exists
      await Project.findOneAndUpdate(
        { projectId: defaultProject.projectId },
        defaultProject,
        { upsert: true, new: true }
      );

      // Backfill any existing tasks without projectId to defaultProject.projectId
      await Task.updateMany(
        { $or: [{ projectId: { $exists: false } }, { projectId: null }, { projectId: '' }] },
        { $set: { projectId: defaultProject.projectId } }
      );

      // Check if tasks exist, if not seed default tasks
      const count = await Task.countDocuments({ projectId: defaultProject.projectId });
      if (count === 0) {
        console.log('🌱 [NexusFlow Storage] Initializing database with Cloud Platform v2.0 seed tasks...');
        await Task.insertMany(defaultTasks);
      }
    } catch (err) {
      console.warn('⚠️ [NexusFlow Storage] MongoDB connection failed or timed out:', err.message);
      console.log('🛡️ [NexusFlow Storage] Seamlessly switching to Local Resilient Fallback Engine.');
      this.mode = 'local_fallback';
      this.connected = true;
    }
  }

  getStatus() {
    const maskedUri = this.mongoUri
      ? this.mongoUri.replace(/:([^:@]+)@/, ':****@')
      : 'None';
    return {
      mode: this.mode,
      connected: this.connected,
      isFallback: this.mode === 'local_fallback',
      database: this.mode === 'mongodb' ? 'MongoDB Atlas' : 'Local In-Memory / JSON Cache',
      uri: maskedUri,
    };
  }

  // --- Project Operations ---

  async getAllProjects() {
    let projects = [];
    if (this.mode === 'mongodb') {
      projects = await Project.find().sort({ createdAt: 1 }).lean();
      if (projects.length === 0) {
        const p = await Project.create(defaultProject);
        projects = [p.toObject()];
      }
    } else {
      projects = [...this.fallbackProjects];
    }

    // Enrich each project with quick task stats
    const allTasks = await (this.mode === 'mongodb' ? Task.find().lean() : Promise.resolve(this.fallbackTasks));

    return projects.map(proj => {
      const projTasks = allTasks.filter(t => (t.projectId || defaultProject.projectId) === proj.projectId);
      const total = projTasks.length;
      const completed = projTasks.filter(t => t.status === 'Completed').length;
      return {
        ...proj,
        taskCount: total,
        completedCount: completed,
        completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  }

  async getProjectInfo(projectId) {
    const targetId = projectId || defaultProject.projectId;
    if (this.mode === 'mongodb') {
      let p = await Project.findOne({ projectId: targetId }).lean();
      if (!p && targetId === defaultProject.projectId) {
        p = await Project.create(defaultProject);
        return p.toObject();
      }
      return p;
    }
    const found = this.fallbackProjects.find(p => p.projectId === targetId);
    return found ? { ...found } : { ...this.fallbackProjects[0] };
  }

  async createProject({ name, description = '', targetDate = '', taskPrefix = 'PRJ', template = 'starter' }) {
    // Generate clean slug for projectId
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'project-' + Date.now().toString(36);
    
    const projectId = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
    const prefix = (taskPrefix || 'PRJ').toUpperCase().trim();

    const newProject = {
      projectId,
      name: name.trim(),
      description: description.trim(),
      targetDate: targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      taskPrefix: prefix,
    };

    let starterTasks = [];
    if (template === 'starter') {
      starterTasks = createStarterTasks(projectId, prefix, name.trim());
    }

    if (this.mode === 'mongodb') {
      const created = await Project.create(newProject);
      if (starterTasks.length > 0) {
        await Task.insertMany(starterTasks);
      }
      return { project: created.toObject(), taskCount: starterTasks.length };
    }

    this.fallbackProjects.push(newProject);
    if (starterTasks.length > 0) {
      this.fallbackTasks.push(...starterTasks);
    }
    this.persistFallbackFile();
    return { project: newProject, taskCount: starterTasks.length };
  }

  async deleteProject(projectId) {
    if (projectId === defaultProject.projectId) {
      throw new Error('The default baseline project cannot be deleted.');
    }

    if (this.mode === 'mongodb') {
      const proj = await Project.findOneAndDelete({ projectId });
      await Task.deleteMany({ projectId });
      return { success: true, deletedProject: proj };
    }

    const idx = this.fallbackProjects.findIndex(p => p.projectId === projectId);
    if (idx === -1) throw new Error('Project not found');

    const [deleted] = this.fallbackProjects.splice(idx, 1);
    this.fallbackTasks = this.fallbackTasks.filter(t => t.projectId !== projectId);
    this.persistFallbackFile();
    return { success: true, deletedProject: deleted };
  }

  async updateProjectInfo(projectId, updates) {
    const targetId = projectId || defaultProject.projectId;
    if (this.mode === 'mongodb') {
      const p = await Project.findOneAndUpdate(
        { projectId: targetId },
        { ...updates, updatedAt: new Date() },
        { upsert: true, new: true }
      ).lean();
      return p;
    }
    const idx = this.fallbackProjects.findIndex(p => p.projectId === targetId);
    if (idx !== -1) {
      this.fallbackProjects[idx] = { ...this.fallbackProjects[idx], ...updates };
      this.persistFallbackFile();
      return this.fallbackProjects[idx];
    }
    return null;
  }

  // --- Task Operations ---

  async getAllTasks(projectId) {
    const targetId = projectId || defaultProject.projectId;
    if (this.mode === 'mongodb') {
      // Find tasks matching target projectId or fallback to default if task has no projectId
      const tasks = await Task.find({
        $or: [{ projectId: targetId }, { projectId: { $exists: false } }],
      }).lean();
      return tasks.map(t => ({ ...t, id: t.taskId, projectId: t.projectId || targetId }));
    }
    return this.fallbackTasks
      .filter(t => (t.projectId || defaultProject.projectId) === targetId)
      .map(t => ({ ...t, id: t.taskId, projectId: t.projectId || targetId }));
  }

  async getTaskById(taskId) {
    if (this.mode === 'mongodb') {
      const task = await Task.findOne({ taskId }).lean();
      return task ? { ...task, id: task.taskId } : null;
    }
    const found = this.fallbackTasks.find(t => t.taskId === taskId);
    return found ? { ...found } : null;
  }

  async createTask(taskData) {
    const targetProjectId = taskData.projectId || defaultProject.projectId;
    const taskPayload = {
      ...taskData,
      projectId: targetProjectId,
    };

    if (this.mode === 'mongodb') {
      const created = await Task.create(taskPayload);
      return created.toObject();
    }
    const newTask = {
      ...taskPayload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.fallbackTasks.push(newTask);
    this.persistFallbackFile();
    return newTask;
  }

  async updateTask(taskId, updates) {
    if (this.mode === 'mongodb') {
      const updated = await Task.findOneAndUpdate(
        { taskId },
        { ...updates, updatedAt: new Date() },
        { new: true }
      ).lean();
      return updated;
    }
    const index = this.fallbackTasks.findIndex(t => t.taskId === taskId);
    if (index === -1) return null;

    this.fallbackTasks[index] = {
      ...this.fallbackTasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persistFallbackFile();
    return this.fallbackTasks[index];
  }

  async deleteTask(taskId) {
    if (this.mode === 'mongodb') {
      const taskToDelete = await Task.findOne({ taskId });
      const projectId = taskToDelete?.projectId || defaultProject.projectId;
      const res = await Task.findOneAndDelete({ taskId });
      // Remove this task from any other task's dependencies in the same project
      await Task.updateMany(
        { projectId, dependencies: taskId },
        { $pull: { dependencies: taskId } }
      );
      return res;
    }
    const index = this.fallbackTasks.findIndex(t => t.taskId === taskId);
    if (index === -1) return null;

    const [deleted] = this.fallbackTasks.splice(index, 1);
    const projectId = deleted.projectId || defaultProject.projectId;
    for (const t of this.fallbackTasks) {
      if ((t.projectId || defaultProject.projectId) === projectId && t.dependencies && t.dependencies.includes(taskId)) {
        t.dependencies = t.dependencies.filter(id => id !== taskId);
      }
    }
    this.persistFallbackFile();
    return deleted;
  }

  async resetToSeedData(projectId) {
    const targetId = projectId || defaultProject.projectId;
    if (this.mode === 'mongodb') {
      await Task.deleteMany({ projectId: targetId });
      if (targetId === defaultProject.projectId) {
        await Task.insertMany(defaultTasks);
      }
      return { success: true, count: targetId === defaultProject.projectId ? defaultTasks.length : 0 };
    }

    this.fallbackTasks = this.fallbackTasks.filter(t => (t.projectId || defaultProject.projectId) !== targetId);
    if (targetId === defaultProject.projectId) {
      this.fallbackTasks.push(...JSON.parse(JSON.stringify(defaultTasks)));
    }
    this.persistFallbackFile();
    return { success: true, count: targetId === defaultProject.projectId ? defaultTasks.length : 0 };
  }

  async importTasks(newTasks, projectId) {
    const targetId = projectId || defaultProject.projectId;
    const enrichedTasks = newTasks.map(t => ({
      ...t,
      projectId: targetId,
    }));

    if (this.mode === 'mongodb') {
      await Task.deleteMany({ projectId: targetId });
      await Task.insertMany(enrichedTasks);
      return { success: true, count: enrichedTasks.length };
    }
    this.fallbackTasks = this.fallbackTasks.filter(t => (t.projectId || defaultProject.projectId) !== targetId);
    this.fallbackTasks.push(...JSON.parse(JSON.stringify(enrichedTasks)));
    this.persistFallbackFile();
    return { success: true, count: enrichedTasks.length };
  }
}

export const storage = new DualStorageEngine();
