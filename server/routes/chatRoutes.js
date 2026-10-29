import express from 'express';
import { storage } from '../services/storageEngine.js';
import {
  computeTaskReadiness,
  computeBlastRadius,
  computeCriticalPath,
} from '../services/graphEngine.js';

const router = express.Router();

/**
 * High-speed intelligent project advisor generator.
 * Produces crisp, deterministic schedule intelligence in < 15ms.
 */
function generateFastPathReply(question, projectContext) {
  const q = question.toLowerCase().trim();
  const { project, tasks, cpm, primaryBottleneck, readyTasks, blockedTasks, overdueTasks, inProgressTasks } = projectContext;

  // 1. Bottlenecks / delays
  if (q.includes('bottleneck') || q.includes('delay') || q.includes('holding up') || q.includes('choke')) {
    if (primaryBottleneck) {
      const downstreamStr = primaryBottleneck.directDownstream?.length > 0
        ? primaryBottleneck.directDownstream.map(id => `**${id}**`).join(', ')
        : 'multiple dependent tasks';
      return {
        reply: `The #1 critical bottleneck is **${primaryBottleneck.taskId}: ${primaryBottleneck.title}** (assigned to ${primaryBottleneck.owner?.name || 'Unassigned'}).\n\n` +
          `• **Current Status:** ${primaryBottleneck.status}\n` +
          `• **Downstream Cascade:** Holding up **${primaryBottleneck.impactCount} task(s)** (${downstreamStr})\n` +
          `• **Recommendation:** Reallocate resources to clear ${primaryBottleneck.taskId} immediately to recover schedule float.`,
        matched: true,
      };
    }
    return {
      reply: `All dependencies are flowing smoothly. There are currently no active bottlenecks blocking downstream tasks in **${project?.name || 'this project'}**.`,
      matched: true,
    };
  }

  // 2. What can we start right now / Next tasks
  if (q.includes('start right now') || q.includes('next task') || q.includes('ready to start') || q.includes('pick up') || q.includes('what should i do')) {
    if (readyTasks.length > 0) {
      const taskList = readyTasks.slice(0, 3).map(t =>
        `• **${t.taskId}: ${t.title}** (${t.estimatedDays}d, assigned to ${t.owner?.name || 'Unassigned'}, Priority: ${t.priority})`
      ).join('\n');
      return {
        reply: `You have **${readyTasks.length} task(s) Ready to start immediately** with all prerequisites satisfied:\n\n${taskList}\n\n` +
          `💡 *Tip: Prioritize Critical and High-priority ready tasks to keep downstream pipelines fed.*`,
        matched: true,
      };
    }
    return {
      reply: `No tasks are currently in **Ready** state. All remaining tasks are either already **In Progress** (${inProgressTasks.length}) or **Blocked** (${blockedTasks.length}) by upstream work.`,
      matched: true,
    };
  }

  // 3. Critical Path / CPM
  if (q.includes('critical path') || q.includes('cpm') || q.includes('zero slack') || q.includes('longest path')) {
    if (cpm.criticalPath && cpm.criticalPath.length > 0) {
      const chain = cpm.criticalPath.map(id => `**${id}**`).join(' ➔ ');
      return {
        reply: `The **Critical Path** for **${project?.name || 'this project'}** is:\n\n${chain}\n\n` +
          `• **Minimum Duration:** ${cpm.projectDuration} work days\n` +
          `• **Total Critical Tasks:** ${cpm.criticalPath.length}\n` +
          `• **Schedule Slack:** 0 days (any delay on these specific tasks delays the final milestone).`,
        matched: true,
      };
    }
    return {
      reply: `The critical path calculation shows an empty or fully completed sequence for this project.`,
      matched: true,
    };
  }

  // 4. Overdue tasks / Risk
  if (q.includes('overdue') || q.includes('late') || q.includes('deadline')) {
    if (overdueTasks.length > 0) {
      const list = overdueTasks.map(t =>
        `• **${t.taskId}: ${t.title}** (Due: ${t.dueDate}, Owner: ${t.owner?.name || 'Unassigned'}, Status: ${t.status})`
      ).join('\n');
      return {
        reply: `⚠️ Found **${overdueTasks.length} overdue task(s)** requiring urgent attention:\n\n${list}\n\n` +
          `Overdue tasks create cascading slippage across downstream milestones.`,
        matched: true,
      };
    }
    return {
      reply: `🎉 Great news! None of the tasks in **${project?.name || 'this project'}** are currently overdue.`,
      matched: true,
    };
  }

  // 5. Blocked tasks
  if (q.includes('blocked') && !q.match(/[a-z0-9]+-\d+/)) {
    if (blockedTasks.length > 0) {
      const list = blockedTasks.slice(0, 4).map(t =>
        `• **${t.taskId}: ${t.title}** — blocked by ${(t.dependencies || []).map(d => `**${d}**`).join(', ')}`
      ).join('\n');
      return {
        reply: `There are **${blockedTasks.length} blocked task(s)** waiting on prerequisites:\n\n${list}\n\n` +
          `Once their upstream dependencies are marked **Completed**, NexusFlow will automatically unblock them into **Ready** status.`,
        matched: true,
      };
    }
    return {
      reply: `Zero tasks are blocked! All tasks are either Ready, In Progress, or Completed.`,
      matched: true,
    };
  }

  // 6. Specific task query (e.g. "why is NX-109 blocked?", "tell me about NX-105")
  const taskIdMatch = q.match(/\b([a-zA-Z0-9]+-\d+)\b/);
  if (taskIdMatch) {
    const requestedId = taskIdMatch[1].toUpperCase();
    const task = tasks.find(t => t.taskId.toUpperCase() === requestedId);
    if (task) {
      const deps = task.dependencies || [];
      const incompleteDeps = deps.filter(dId => {
        const depTask = tasks.find(t => t.taskId === dId);
        return !depTask || depTask.status !== 'Completed';
      });

      let statusExplanation = `Current Status: **${task.status}**`;
      if (task.status === 'Blocked') {
        statusExplanation += ` (Waiting on incomplete prerequisite(s): ${incompleteDeps.map(d => `**${d}**`).join(', ')})`;
      } else if (task.status === 'Ready') {
        statusExplanation += ` (All ${deps.length} prerequisites are completed, ready to pick up!)`;
      }

      return {
        reply: `**${task.taskId}: ${task.title}**\n\n` +
          `• **Status:** ${statusExplanation}\n` +
          `• **Owner:** ${task.owner?.name || 'Unassigned'} (${task.owner?.role || 'Contributor'})\n` +
          `• **Priority:** ${task.priority} | **Duration:** ${task.estimatedDays} days | **Due Date:** ${task.dueDate}\n` +
          `• **Prerequisites (${deps.length}):** ${deps.length > 0 ? deps.map(d => `**${d}**`).join(', ') : 'None (Root Task)'}\n` +
          `• **Description:** ${task.description || 'No description provided.'}`,
        matched: true,
      };
    }
  }

  // 7. General project status
  if (q.includes('status') || q.includes('overview') || q.includes('summary') || q.includes('health')) {
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    return {
      reply: `📊 **Project Telemetry for "${project?.name || 'Active Project'}"**:\n\n` +
        `• **Progress:** ${pct}% complete (${completed}/${tasks.length} tasks)\n` +
        `• **Ready to Start:** ${readyTasks.length} task(s)\n` +
        `• **In Progress:** ${inProgressTasks.length} task(s)\n` +
        `• **Blocked:** ${blockedTasks.length} task(s)\n` +
        `• **Overdue:** ${overdueTasks.length} task(s)\n` +
        `• **Critical Path:** ${cpm.criticalPath.map(id => `**${id}**`).join(' ➔ ')} (${cpm.projectDuration} days)\n` +
        `• **Primary Bottleneck:** ${primaryBottleneck ? `**${primaryBottleneck.taskId}** (${primaryBottleneck.title})` : 'None'}`,
      matched: true,
    };
  }

  return { matched: false };
}

/**
 * POST /api/chat
 * Ultra-fast context-aware project assistant:
 * 1. Checks Instant Deterministic Engine (< 15ms)
 * 2. Falls back to fast Gemini call (strict 2.5s timeout)
 * 3. Falls back to deep heuristic response
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();
  try {
    const { messages = [], projectId = null } = req.body;
    const lastUserMsg = messages[messages.length - 1]?.content || 'What is the project status?';

    // 1. Fetch live DAG state for active project
    const projectInfo = await storage.getProjectInfo(projectId);
    const rawTasks = await storage.getAllTasks(projectInfo?.projectId || projectId);
    const tasks = computeTaskReadiness(rawTasks);
    const cpm = computeCriticalPath(tasks);

    const blastRadiuses = {};
    for (const t of tasks) {
      blastRadiuses[t.taskId] = computeBlastRadius(tasks, t.taskId);
    }

    const activeTasks = tasks.filter(t => t.status !== 'Completed');
    const overdueTasks = tasks.filter(t => t.isOverdue);
    const readyTasks = tasks.filter(t => t.status === 'Ready');
    const blockedTasks = tasks.filter(t => t.status === 'Blocked');
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress');

    const topBottleneckTask = [...activeTasks].sort((a, b) => {
      const aImpact = blastRadiuses[a.taskId]?.impactCount || 0;
      const bImpact = blastRadiuses[b.taskId]?.impactCount || 0;
      return bImpact - aImpact;
    })[0];

    const projectContext = {
      project: projectInfo,
      tasks,
      cpm,
      primaryBottleneck: topBottleneckTask
        ? {
            taskId: topBottleneckTask.taskId,
            title: topBottleneckTask.title,
            owner: topBottleneckTask.owner,
            status: topBottleneckTask.status,
            impactCount: blastRadiuses[topBottleneckTask.taskId]?.impactCount || 0,
            directDownstream: blastRadiuses[topBottleneckTask.taskId]?.directDownstream || [],
          }
        : null,
      readyTasks,
      blockedTasks,
      overdueTasks,
      inProgressTasks,
    };

    // 2. INSTANT FAST-PATH CHECK (< 15ms)
    const fastPath = generateFastPathReply(lastUserMsg, projectContext);
    if (fastPath.matched) {
      const latency = Date.now() - startTime;
      return res.json({
        success: true,
        reply: fastPath.reply,
        model: `NexusFlow Engine (${latency}ms)`,
        isAi: false,
        latency,
      });
    }

    // 3. FAST GEMINI CALL (with tight 2500ms timeout)
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && !apiKey.includes('your_optional')) {
      const systemInstruction = `
You are NexusFlow AI, a decisive and concise project dependency & critical path advisor.
Real-time DAG Telemetry for "${projectInfo?.name || 'Project'}":
- Total Tasks: ${tasks.length}
- Completed: ${tasks.filter(t => t.status === 'Completed').map(t => t.taskId).join(', ') || 'None'}
- In Progress: ${inProgressTasks.map(t => t.taskId).join(', ') || 'None'}
- Ready: ${readyTasks.map(t => t.taskId).join(', ') || 'None'}
- Blocked: ${blockedTasks.map(t => `${t.taskId}(needs:${(t.dependencies||[]).join(';')})`).join(', ') || 'None'}
- Critical Path: ${cpm.criticalPath.join(' -> ')} (${cpm.projectDuration} days)
- Top Bottleneck: ${projectContext.primaryBottleneck ? `${projectContext.primaryBottleneck.taskId} (${projectContext.primaryBottleneck.title})` : 'None'}

Rules:
- Be clear, practical, direct, and concise (under 3 short paragraphs).
- Bold task IDs like **NX-105**.
      `;

      try {
        const contents = [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nUser Question: ${lastUserMsg}` }],
          },
        ];

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const latency = Date.now() - startTime;
            return res.json({
              success: true,
              reply: text.trim(),
              model: `Gemini 3.5 Flash (${(latency / 1000).toFixed(1)}s)`,
              isAi: true,
              latency,
            });
          }
        }
      } catch (geminiErr) {
        // Fall through immediately to fallback
      }
    }

    // 4. RICH FALLBACK ENGINE (Immediate)
    const fallbackText = `Here is the current analysis for **${projectInfo?.name || 'Active Project'}**:\n\n` +
      `• **Critical Chain:** ${cpm.criticalPath.map(id => `**${id}**`).join(' ➔ ')} (${cpm.projectDuration} days total)\n` +
      `• **Top Bottleneck:** ${projectContext.primaryBottleneck ? `**${projectContext.primaryBottleneck.taskId}** (${projectContext.primaryBottleneck.title}) blocking ${projectContext.primaryBottleneck.impactCount} tasks` : 'None currently'}\n` +
      `• **Ready to Start:** ${readyTasks.length} task(s) unblocked\n` +
      `• **Blocked:** ${blockedTasks.length} task(s) waiting on prerequisites\n\n` +
      `You can ask for specific details like *"Why is ${tasks[tasks.length - 1]?.taskId || 'a task'} blocked?"* or *"What is our Critical Path?"*.`;

    const latency = Date.now() - startTime;
    return res.json({
      success: true,
      reply: fallbackText,
      model: `NexusFlow Advisor (${latency}ms)`,
      isAi: false,
      latency,
    });
  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
