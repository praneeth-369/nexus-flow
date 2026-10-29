/**
 * Smart Schedule & Bottleneck Advisor
 * Computes deep topological impact, bottleneck scoring, and priority scheduling.
 * Enhances insights with Google Gemini API when configured, with seamless algorithmic fallback.
 */

export async function analyzeSchedule(tasks, cpmMetrics, blastRadiuses) {
  const { criticalPath = [], taskMetrics = {}, projectDuration = 0 } = cpmMetrics || {};

  // 1. Algorithmic Bottleneck Identification
  const activeTasks = tasks.filter(t => t.status !== 'Completed');
  const overdueTasks = tasks.filter(t => t.isOverdue || (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed'));
  const readyTasks = tasks.filter(t => t.status === 'Ready');
  const blockedTasks = tasks.filter(t => t.status === 'Blocked');

  // Score each active task
  const taskScores = activeTasks.map(task => {
    const blast = blastRadiuses[task.taskId] || { impactCount: 0, directDownstream: [] };
    const metric = taskMetrics[task.taskId] || { slack: 0, isCritical: false };
    const isCritical = criticalPath.includes(task.taskId) || metric.isCritical;
    const isOverdue = task.isOverdue || (task.dueDate && new Date(task.dueDate) < new Date());

    let score = 0;
    score += Math.min(40, blast.impactCount * 10);
    if (isCritical) score += 35;
    if (isOverdue) score += 25;
    if (task.priority === 'Critical') score += 10;
    if (task.priority === 'High') score += 5;

    return {
      task,
      score,
      isCritical,
      isOverdue,
      impactCount: blast.impactCount,
      directDownstream: blast.directDownstream,
      slack: metric.slack,
    };
  });

  taskScores.sort((a, b) => b.score - a.score);
  const primaryBottleneck = taskScores[0] || null;

  // 2. Compute Health Score
  const totalTasks = tasks.length || 1;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const completionRate = Math.round((completedCount / totalTasks) * 100);

  let healthScore = 100;
  healthScore -= overdueTasks.length * 15;
  healthScore -= blockedTasks.length * 8;
  if (primaryBottleneck && primaryBottleneck.isCritical) healthScore -= 10;
  healthScore = Math.max(15, Math.min(100, healthScore));

  // 3. Algorithmic Recommendations
  const recommendations = [];

  if (primaryBottleneck) {
    recommendations.push({
      id: 'rec-1',
      type: 'critical_bottleneck',
      priority: 'Urgent',
      title: `Resolve Blockade on ${primaryBottleneck.task.taskId} (${primaryBottleneck.task.title})`,
      description: `This task sits directly on the critical path and is holding back ${primaryBottleneck.impactCount} downstream task${primaryBottleneck.impactCount === 1 ? '' : 's'}. Expediting this task directly pulls in the final delivery date by up to ${primaryBottleneck.task.estimatedDays || 3} days.`,
      targetTaskId: primaryBottleneck.task.taskId,
      impact: `Unblocks ${primaryBottleneck.impactCount} dependent components`,
    });
  }

  if (readyTasks.length > 0) {
    const nextUp = readyTasks[0];
    recommendations.push({
      id: 'rec-2',
      type: 'ready_pickup',
      priority: 'High',
      title: `Assign & Start ${nextUp.taskId} (${nextUp.title})`,
      description: `All prerequisites are 100% completed. Picking this task up immediately avoids idle team float and keeps momentum active.`,
      targetTaskId: nextUp.taskId,
      impact: 'Maximizes team velocity & concurrency',
    });
  }

  if (overdueTasks.length > 0) {
    const mostOverdue = overdueTasks[0];
    if (!primaryBottleneck || primaryBottleneck.task.taskId !== mostOverdue.taskId) {
      recommendations.push({
        id: 'rec-3',
        type: 'overdue_mitigation',
        priority: 'High',
        title: `Mitigate Overdue Task: ${mostOverdue.taskId}`,
        description: `Due date passed on ${mostOverdue.dueDate}. Review resource allocation with owner (${mostOverdue.owner?.name || 'Assignee'}) or adjust scope buffer.`,
        targetTaskId: mostOverdue.taskId,
        impact: 'Prevents compounding schedule slippage',
      });
    }
  }

  recommendations.push({
    id: 'rec-4',
    type: 'cpm_optimization',
    priority: 'Medium',
    title: `Protect Zero-Slack Chain (${criticalPath.join(' → ')})`,
    description: `The project duration is currently determined by the ${criticalPath.length}-task critical chain (${projectDuration} days total). Any delay in these specific tasks shifts the entire launch target.`,
    impact: 'Controls total project delivery timeline',
  });

  const baseAnalysis = {
    source: 'algorithmic',
    healthScore,
    projectDuration,
    completionRate,
    summary: {
      totalTasks: tasks.length,
      completed: completedCount,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      ready: readyTasks.length,
      blocked: blockedTasks.length,
      overdue: overdueTasks.length,
      criticalPathLength: criticalPath.length,
    },
    primaryBottleneck: primaryBottleneck
      ? {
          taskId: primaryBottleneck.task.taskId,
          title: primaryBottleneck.task.title,
          owner: primaryBottleneck.task.owner,
          status: primaryBottleneck.task.status,
          impactCount: primaryBottleneck.impactCount,
          isCritical: primaryBottleneck.isCritical,
          isOverdue: primaryBottleneck.isOverdue,
          reason: `Holding up ${primaryBottleneck.impactCount} downstream tasks across the critical timeline.`,
        }
      : null,
    recommendations,
  };

  // 4. Check if Gemini API Key is available
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_optional')) {
    return baseAnalysis;
  }

  // Multi-model Gemini attempts with graceful fallback
  const candidateModels = [
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
  ];

  const promptText = `
You are an expert technical project management and critical path systems advisor.
Analyze the following project graph state:
- Project: Cloud Platform v2.0 Launch
- Total Tasks: ${tasks.length}
- Completed: ${completedCount}
- Blocked: ${blockedTasks.length}
- Overdue: ${overdueTasks.length}
- Critical Path: ${criticalPath.join(' -> ')}
- Calculated Project Duration: ${projectDuration} days
- Primary Bottleneck: ${primaryBottleneck ? primaryBottleneck.task.taskId + ': ' + primaryBottleneck.task.title : 'None'}

Provide a 2-3 paragraph executive engineering assessment:
1. The strategic root-cause risk for the delivery timeline.
2. Concrete resource reallocation or scope advice for the lead engineer.
Keep your response concise, professional, and formatted in clean markdown.
  `;

  for (const model of candidateModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
          }),
          signal: AbortSignal.timeout(5000),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText) {
          return {
            ...baseAnalysis,
            source: 'gemini_enhanced',
            modelUsed: model,
            aiExecutiveSummary: aiText,
          };
        }
      }
    } catch (err) {
      // Continue to next model or fallback
    }
  }

  return baseAnalysis;
}
