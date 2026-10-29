/**
 * NexusFlow Real-Time Dependency & Critical Path Graph Engine
 * Enforces DAG integrity, 3-state DFS cycle detection, BFS blast radius,
 * automated readiness calculation, and CPM (Critical Path Method) solver.
 */

/**
 * Validates whether adding an edge (or updating dependencies) creates a cycle.
 * @param {Array} tasks - Array of task objects { taskId, dependencies: [] }
 * @param {string} taskId - The task whose dependencies are being updated
 * @param {Array<string>} proposedDependencies - Array of prerequisite taskIds
 * @returns {{ hasCycle: boolean, cyclePath: Array<string>|null }}
 */
export function detectCycle(tasks, taskId, proposedDependencies) {
  // 1. Self-dependency check
  if (proposedDependencies.includes(taskId)) {
    return {
      hasCycle: true,
      cyclePath: [taskId, taskId],
      message: `Self-dependency detected: Task ${taskId} cannot depend on itself.`
    };
  }

  // 2. Build adjacency list: prerequisite -> [dependent tasks]
  // In our model: task.dependencies = [A, B] means A -> task and B -> task
  const adj = new Map();
  const allTaskIds = new Set();

  for (const t of tasks) {
    allTaskIds.add(t.taskId);
    if (!adj.has(t.taskId)) adj.set(t.taskId, []);
  }
  allTaskIds.add(taskId);
  if (!adj.has(taskId)) adj.set(taskId, []);

  // Populate edges
  for (const t of tasks) {
    const deps = t.taskId === taskId ? proposedDependencies : (t.dependencies || []);
    for (const depId of deps) {
      allTaskIds.add(depId);
      if (!adj.has(depId)) adj.set(depId, []);
      adj.get(depId).push(t.taskId);
    }
  }

  // 3-state DFS: 0 = UNVISITED, 1 = VISITING, 2 = VISITED
  const UNVISITED = 0;
  const VISITING = 1;
  const VISITED = 2;

  const state = new Map();
  const parent = new Map();
  for (const id of allTaskIds) {
    state.set(id, UNVISITED);
  }

  let cycleFound = null;

  function dfs(u, path) {
    state.set(u, VISITING);
    path.push(u);

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (state.get(v) === VISITING) {
        // Cycle detected! Reconstruct the cycle loop
        const cycleStartIndex = path.indexOf(v);
        cycleFound = path.slice(cycleStartIndex).concat(v);
        return true;
      }
      if (state.get(v) === UNVISITED) {
        if (dfs(v, path)) return true;
      }
    }

    path.pop();
    state.set(u, VISITED);
    return false;
  }

  for (const id of allTaskIds) {
    if (state.get(id) === UNVISITED) {
      if (dfs(id, [])) {
        break;
      }
    }
  }

  if (cycleFound) {
    return {
      hasCycle: true,
      cyclePath: cycleFound,
      message: `Circular dependency detected: ${cycleFound.join(' → ')}`
    };
  }

  return { hasCycle: false, cyclePath: null };
}

/**
 * Calculates real-time status and readiness for all tasks in a project.
 * - If status is 'Completed', it remains 'Completed'.
 * - If all prerequisites are 'Completed', it is 'Ready' (or 'In Progress' if already started).
 * - If any prerequisite is not 'Completed', it is automatically 'Blocked' by those tasks.
 * @param {Array} tasks
 * @returns {Array} Updated tasks with computed status, blockedBy, and isReady attributes
 */
export function computeTaskReadiness(tasks) {
  const taskMap = new Map();
  for (const t of tasks) {
    taskMap.set(t.taskId, t);
  }

  return tasks.map(task => {
    const deps = task.dependencies || [];
    const blockedBy = [];

    for (const depId of deps) {
      const depTask = taskMap.get(depId);
      if (!depTask || depTask.status !== 'Completed') {
        blockedBy.push({
          taskId: depId,
          title: depTask ? depTask.title : 'External Task',
          status: depTask ? depTask.status : 'Unknown',
        });
      }
    }

    const hasIncompleteDeps = blockedBy.length > 0;
    let computedStatus = task.status;

    if (task.status === 'Completed') {
      computedStatus = 'Completed';
    } else if (hasIncompleteDeps) {
      computedStatus = 'Blocked';
    } else if (task.status === 'Blocked' && !hasIncompleteDeps) {
      // Transition from blocked to ready once prerequisites finish
      computedStatus = 'Ready';
    } else if (!task.status || task.status === 'Ready') {
      computedStatus = hasIncompleteDeps ? 'Blocked' : 'Ready';
    }

    // Check if task is overdue
    const isOverdue = computedStatus !== 'Completed' && task.dueDate && new Date(task.dueDate) < new Date();

    return {
      ...task,
      status: computedStatus,
      blockedBy,
      isBlocked: hasIncompleteDeps,
      isReady: !hasIncompleteDeps && computedStatus !== 'Completed',
      isOverdue: Boolean(isOverdue),
    };
  });
}

/**
 * Computes Downstream Impact ("Blast Radius") via Breadth-First Search (BFS).
 * Finds all direct and transitive tasks that depend on the given task.
 * @param {Array} tasks
 * @param {string} rootTaskId
 * @returns {{ directDownstream: Array<string>, allImpacted: Array<string>, impactCount: number, tree: Object }}
 */
export function computeBlastRadius(tasks, rootTaskId) {
  // Build reverse adjacency: prerequisite -> list of dependent tasks
  const downstreamMap = new Map();
  for (const t of tasks) {
    downstreamMap.set(t.taskId, []);
  }

  for (const t of tasks) {
    const deps = t.dependencies || [];
    for (const depId of deps) {
      if (downstreamMap.has(depId)) {
        downstreamMap.get(depId).push(t.taskId);
      }
    }
  }

  const directDownstream = downstreamMap.get(rootTaskId) || [];
  const allImpacted = new Set();
  const queue = [...directDownstream];
  const depthMap = new Map();

  for (const id of directDownstream) {
    depthMap.set(id, 1);
  }

  while (queue.length > 0) {
    const curr = queue.shift();
    if (!allImpacted.has(curr)) {
      allImpacted.add(curr);
      const currDepth = depthMap.get(curr) || 1;
      const children = downstreamMap.get(curr) || [];
      for (const ch of children) {
        if (!allImpacted.has(ch) && !queue.includes(ch)) {
          depthMap.set(ch, currDepth + 1);
          queue.push(ch);
        }
      }
    }
  }

  return {
    rootTaskId,
    directDownstream,
    allImpacted: Array.from(allImpacted),
    impactCount: allImpacted.size,
    depthMap: Object.fromEntries(depthMap),
  };
}

/**
 * Critical Path Method (CPM) Solver
 * Computes Earliest Start (ES), Earliest Finish (EF), Latest Start (LS),
 * Latest Finish (LF), and Total Slack / Float for each task.
 * Highlights the zero-slack critical path chain that drives total project delivery.
 * @param {Array} tasks
 * @returns {{ projectDuration: number, criticalPath: Array<string>, taskMetrics: Object }}
 */
export function computeCriticalPath(tasks) {
  if (!tasks || tasks.length === 0) {
    return { projectDuration: 0, criticalPath: [], taskMetrics: {} };
  }

  const taskMap = new Map();
  const durationMap = new Map();
  const downstreamMap = new Map();
  const upstreamMap = new Map();

  for (const t of tasks) {
    taskMap.set(t.taskId, t);
    durationMap.set(t.taskId, Number(t.estimatedDays) || 1);
    downstreamMap.set(t.taskId, []);
    upstreamMap.set(t.taskId, t.dependencies || []);
  }

  for (const t of tasks) {
    for (const depId of t.dependencies || []) {
      if (downstreamMap.has(depId)) {
        downstreamMap.get(depId).push(t.taskId);
      }
    }
  }

  // 1. Topological Sort (Kahn's algorithm)
  const inDegree = new Map();
  for (const t of tasks) {
    inDegree.set(t.taskId, (t.dependencies || []).length);
  }

  const topoQueue = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) {
      topoQueue.push(id);
    }
  }

  const topoOrder = [];
  while (topoQueue.length > 0) {
    const u = topoQueue.shift();
    topoOrder.push(u);

    for (const v of downstreamMap.get(u) || []) {
      inDegree.set(v, inDegree.get(v) - 1);
      if (inDegree.get(v) === 0) {
        topoQueue.push(v);
      }
    }
  }

  // If graph had cycles, fallback gracefully
  if (topoOrder.length < tasks.length) {
    for (const t of tasks) {
      if (!topoOrder.includes(t.taskId)) {
        topoOrder.push(t.taskId);
      }
    }
  }

  // 2. Forward Pass: Earliest Start (ES) and Earliest Finish (EF)
  const ES = new Map();
  const EF = new Map();

  for (const id of topoOrder) {
    const deps = upstreamMap.get(id) || [];
    let maxPrevEF = 0;
    for (const depId of deps) {
      const prevEF = EF.get(depId) || 0;
      if (prevEF > maxPrevEF) {
        maxPrevEF = prevEF;
      }
    }
    const es = maxPrevEF;
    const dur = durationMap.get(id) || 1;
    const ef = es + dur;
    ES.set(id, es);
    EF.set(id, ef);
  }

  // Total project duration is max of all EF
  let projectDuration = 0;
  for (const ef of EF.values()) {
    if (ef > projectDuration) {
      projectDuration = ef;
    }
  }

  // 3. Backward Pass: Latest Finish (LF) and Latest Start (LS)
  const LF = new Map();
  const LS = new Map();

  // Reverse topological order
  const reverseTopo = [...topoOrder].reverse();
  for (const id of reverseTopo) {
    const downstream = downstreamMap.get(id) || [];
    let minNextLS = projectDuration;

    if (downstream.length > 0) {
      minNextLS = Infinity;
      for (const nextId of downstream) {
        const nextLS = LS.has(nextId) ? LS.get(nextId) : projectDuration;
        if (nextLS < minNextLS) {
          minNextLS = nextLS;
        }
      }
      if (minNextLS === Infinity) minNextLS = projectDuration;
    }

    const lf = minNextLS;
    const dur = durationMap.get(id) || 1;
    const ls = lf - dur;
    LF.set(id, lf);
    LS.set(id, ls);
  }

  // 4. Compute Slack (Float) and Critical Path
  const taskMetrics = {};
  const criticalPath = [];

  for (const t of tasks) {
    const id = t.taskId;
    const es = ES.get(id) ?? 0;
    const ef = EF.get(id) ?? (es + (durationMap.get(id) || 1));
    const lf = LF.get(id) ?? projectDuration;
    const ls = LS.get(id) ?? (lf - (durationMap.get(id) || 1));
    const slack = Math.max(0, ls - es);
    const isCritical = slack === 0;

    if (isCritical) {
      criticalPath.push(id);
    }

    taskMetrics[id] = {
      es,
      ef,
      ls,
      lf,
      slack,
      isCritical,
      duration: durationMap.get(id) || 1,
    };
  }

  return {
    projectDuration,
    criticalPath,
    taskMetrics,
  };
}
