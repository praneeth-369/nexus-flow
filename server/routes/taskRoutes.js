import express from 'express';
import { storage } from '../services/storageEngine.js';
import {
  detectCycle,
  computeTaskReadiness,
  computeBlastRadius,
  computeCriticalPath,
} from '../services/graphEngine.js';
import { requireEditor, requireLead } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/tasks?projectId=...
 * Returns all tasks enriched with readiness computation, CPM slack, and blast radiuses.
 */
router.get('/', async (req, res) => {
  try {
    const projectId = req.query.projectId || null;
    const rawTasks = await storage.getAllTasks(projectId);
    const readinessTasks = computeTaskReadiness(rawTasks);
    const cpm = computeCriticalPath(readinessTasks);

    // Compute blast radiuses
    const enriched = readinessTasks.map(task => {
      const blast = computeBlastRadius(readinessTasks, task.taskId);
      const metric = cpm.taskMetrics[task.taskId] || {};
      return {
        ...task,
        blastRadius: {
          impactCount: blast.impactCount,
          directDownstream: blast.directDownstream,
          allImpacted: blast.allImpacted,
        },
        cpm: {
          es: metric.es ?? 0,
          ef: metric.ef ?? (metric.es + (task.estimatedDays || 1)),
          ls: metric.ls ?? 0,
          lf: metric.lf ?? 0,
          slack: metric.slack ?? 0,
          isCritical: Boolean(metric.isCritical),
        },
      };
    });

    res.json({
      success: true,
      tasks: enriched,
      cpm: {
        projectDuration: cpm.projectDuration,
        criticalPath: cpm.criticalPath,
      },
    });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/tasks/:taskId
 * Returns single task with comprehensive upstream and downstream context.
 */
router.get('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await storage.getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const allTasks = await storage.getAllTasks(task.projectId);
    const readinessTasks = computeTaskReadiness(allTasks);
    const blast = computeBlastRadius(readinessTasks, taskId);
    const cpm = computeCriticalPath(readinessTasks);

    res.json({
      success: true,
      task,
      blastRadius: blast,
      cpmMetric: cpm.taskMetrics[taskId] || null,
      isCritical: cpm.criticalPath.includes(taskId),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tasks/validate-dependency
 * Checks if adding or modifying a dependency would create a cycle or self-dependency.
 */
router.post('/validate-dependency', async (req, res) => {
  try {
    const { taskId, proposedDependencies, projectId } = req.body;
    if (!taskId || !Array.isArray(proposedDependencies)) {
      return res.status(400).json({ success: false, error: 'taskId and proposedDependencies array are required' });
    }

    const tasks = await storage.getAllTasks(projectId);
    const cycleResult = detectCycle(tasks, taskId, proposedDependencies);

    res.json({
      success: true,
      isValid: !cycleResult.hasCycle,
      ...cycleResult,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tasks
 * Create a new task. Validates cycle before saving.
 */
router.post('/', requireLead, async (req, res) => {
  try {
    const {
      taskId,
      projectId,
      title,
      description,
      owner,
      priority,
      status,
      dueDate,
      estimatedDays,
      dependencies,
      tags,
    } = req.body;

    if (!taskId || !title || !dueDate) {
      return res.status(400).json({
        success: false,
        error: 'taskId, title, and dueDate are required fields',
      });
    }

    const existing = await storage.getTaskById(taskId);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Task with ID ${taskId} already exists`,
      });
    }

    const allTasks = await storage.getAllTasks(projectId);
    const proposedDeps = Array.isArray(dependencies) ? dependencies : [];

    // Cycle check
    const cycleCheck = detectCycle(allTasks, taskId, proposedDeps);
    if (cycleCheck.hasCycle) {
      return res.status(400).json({
        success: false,
        error: 'CIRCULAR_DEPENDENCY',
        message: cycleCheck.message,
        cyclePath: cycleCheck.cyclePath,
      });
    }

    const created = await storage.createTask({
      taskId: taskId.trim().toUpperCase(),
      projectId: projectId || 'nexusflow-cloud-v2',
      title: title.trim(),
      description: description || '',
      owner: owner || { name: 'Unassigned', role: 'Contributor', initials: 'UN' },
      priority: priority || 'Medium',
      status: status || 'Ready',
      dueDate,
      estimatedDays: Number(estimatedDays) || 3,
      dependencies: proposedDeps,
      tags: Array.isArray(tags) ? tags : [],
    });

    res.status(201).json({ success: true, task: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/tasks/:taskId
 * Update existing task. If dependencies changed, runs DFS cycle check.
 */
router.put('/:taskId', requireEditor, async (req, res) => {
  try {
    const { taskId } = req.params;
    const existing = await storage.getTaskById(taskId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const allTasks = await storage.getAllTasks(existing.projectId);
    const proposedDeps = req.body.dependencies !== undefined
      ? req.body.dependencies
      : existing.dependencies;

    // Cycle check if dependencies are being modified
    if (req.body.dependencies !== undefined) {
      const cycleCheck = detectCycle(allTasks, taskId, proposedDeps);
      if (cycleCheck.hasCycle) {
        return res.status(400).json({
          success: false,
          error: 'CIRCULAR_DEPENDENCY',
          message: cycleCheck.message,
          cyclePath: cycleCheck.cyclePath,
        });
      }
    }

    const updates = { ...req.body };
    delete updates._id;
    delete updates.taskId; // Immutable ID

    const updated = await storage.updateTask(taskId, updates);
    res.json({ success: true, task: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/tasks/:taskId
 * Remove task and update all dependent tasks.
 */
router.delete('/:taskId', requireLead, async (req, res) => {
  try {
    const { taskId } = req.params;
    const existing = await storage.getTaskById(taskId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    await storage.deleteTask(taskId);
    res.json({ success: true, message: `Task ${taskId} deleted successfully` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
