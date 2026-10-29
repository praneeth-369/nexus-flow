import express from 'express';
import { storage } from '../services/storageEngine.js';
import {
  computeTaskReadiness,
  computeBlastRadius,
  computeCriticalPath,
} from '../services/graphEngine.js';
import { requireLead } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/project/all
 * List all projects with summarized task stats.
 */
router.get('/all', async (req, res) => {
  try {
    const projects = await storage.getAllProjects();
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/project/new
 * Create a new project workspace. Requires Project Lead role.
 */
router.post('/new', requireLead, async (req, res) => {
  try {
    const { name, description, targetDate, taskPrefix, template } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Project name is required' });
    }

    const result = await storage.createProject({
      name: name.trim(),
      description,
      targetDate,
      taskPrefix: taskPrefix || 'PRJ',
      template: template || 'starter',
    });

    res.status(201).json({
      success: true,
      message: `Project "${result.project.name}" created with ${result.taskCount} tasks.`,
      project: result.project,
      taskCount: result.taskCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/project/:projectId
 * Update an existing project's metadata. Requires Project Lead role.
 */
router.put('/:projectId', requireLead, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, targetDate, taskPrefix } = req.body;

    const updates = {};
    if (name) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (targetDate) updates.targetDate = targetDate;
    if (taskPrefix) updates.taskPrefix = taskPrefix.toUpperCase().trim();

    const updated = await storage.updateProjectInfo(projectId, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({
      success: true,
      message: `Project "${updated.name}" updated successfully.`,
      project: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/project/:projectId
 * Delete a custom project and its tasks. Requires Project Lead role.
 */
router.delete('/:projectId', requireLead, async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await storage.deleteProject(projectId);
    res.json({ success: true, message: 'Project deleted successfully', result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/project
 * Get project overview, KPIs, and storage health for the specified projectId (or default).
 */
router.get('/', async (req, res) => {
  try {
    const projectId = req.query.projectId || null;
    const projectInfo = await storage.getProjectInfo(projectId);
    const rawTasks = await storage.getAllTasks(projectInfo?.projectId || projectId);
    const tasks = computeTaskReadiness(rawTasks);
    const cpm = computeCriticalPath(tasks);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const readyTasks = tasks.filter(t => t.status === 'Ready').length;
    const blockedTasks = tasks.filter(t => t.status === 'Blocked').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const overdueTasks = tasks.filter(t => t.isOverdue).length;

    // Total downstream impacted tasks across all currently blocked or overdue tasks
    const impactedSet = new Set();
    for (const t of tasks) {
      if (t.status === 'Blocked' || t.isOverdue) {
        const blast = computeBlastRadius(tasks, t.taskId);
        for (const id of blast.allImpacted) {
          impactedSet.add(id);
        }
      }
    }

    const completionPercentage = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    res.json({
      success: true,
      project: projectInfo,
      storageStatus: storage.getStatus(),
      kpis: {
        totalTasks,
        completedTasks,
        readyTasks,
        blockedTasks,
        inProgressTasks,
        overdueTasks,
        impactedDownstreamTasks: impactedSet.size,
        completionPercentage,
        estimatedProjectDuration: cpm.projectDuration,
        criticalPathLength: cpm.criticalPath.length,
        criticalPath: cpm.criticalPath,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/project/reset
 * Restore workspace to default seed tasks. Requires Project Lead role.
 */
router.post('/reset', requireLead, async (req, res) => {
  try {
    const { projectId } = req.body;
    const result = await storage.resetToSeedData(projectId);
    res.json({
      success: true,
      message: 'Workspace successfully reset to baseline seed data',
      result,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/project/export?format=json|csv&projectId=...
 * Export tasks and project data.
 */
router.get('/export', async (req, res) => {
  try {
    const format = (req.query.format || 'json').toLowerCase();
    const projectId = req.query.projectId || null;
    const project = await storage.getProjectInfo(projectId);
    const tasks = await storage.getAllTasks(project?.projectId || projectId);

    if (format === 'csv') {
      const headers = ['taskId', 'projectId', 'title', 'ownerName', 'ownerRole', 'priority', 'status', 'dueDate', 'estimatedDays', 'dependencies', 'tags'];
      const rows = tasks.map(t => [
        `"${t.taskId}"`,
        `"${t.projectId || ''}"`,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${(t.owner?.name || '').replace(/"/g, '""')}"`,
        `"${(t.owner?.role || '').replace(/"/g, '""')}"`,
        `"${t.priority || 'Medium'}"`,
        `"${t.status || 'Ready'}"`,
        `"${t.dueDate || ''}"`,
        t.estimatedDays || 1,
        `"${(t.dependencies || []).join(';')}"`,
        `"${(t.tags || []).join(';')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${project?.projectId || 'nexusflow'}-tasks.csv"`);
      return res.send(csvContent);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${project?.projectId || 'nexusflow'}-workspace.json"`);
    res.json({
      exportedAt: new Date().toISOString(),
      project,
      tasks,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/project/import
 * Import project tasks from JSON file. Requires Project Lead role.
 */
router.post('/import', requireLead, async (req, res) => {
  try {
    const { tasks, projectId } = req.body;
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ success: false, error: 'A valid non-empty array of tasks is required' });
    }

    for (const t of tasks) {
      if (!t.taskId || !t.title) {
        return res.status(400).json({
          success: false,
          error: `Task missing required taskId or title: ${JSON.stringify(t)}`,
        });
      }
    }

    await storage.importTasks(tasks, projectId);
    res.json({
      success: true,
      message: `Successfully imported ${tasks.length} tasks`,
      count: tasks.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
