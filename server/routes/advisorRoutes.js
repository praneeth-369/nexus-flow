import express from 'express';
import { storage } from '../services/storageEngine.js';
import {
  computeTaskReadiness,
  computeBlastRadius,
  computeCriticalPath,
} from '../services/graphEngine.js';
import { analyzeSchedule } from '../services/geminiAdvisor.js';

const router = express.Router();

/**
 * GET /api/advisor/analyze
 * Returns deep bottleneck analysis and schedule recommendations.
 */
router.get('/analyze', async (req, res) => {
  try {
    const projectId = req.query.projectId || null;
    const rawTasks = await storage.getAllTasks(projectId);
    const tasks = computeTaskReadiness(rawTasks);
    const cpm = computeCriticalPath(tasks);

    // Compute blast radiuses for all tasks
    const blastRadiuses = {};
    for (const t of tasks) {
      blastRadiuses[t.taskId] = computeBlastRadius(tasks, t.taskId);
    }

    const analysis = await analyzeSchedule(tasks, cpm, blastRadiuses);
    res.json({
      success: true,
      analysis,
    });
  } catch (err) {
    console.error('Advisor analysis error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
