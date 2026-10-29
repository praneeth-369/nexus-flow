import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectCycle,
  computeTaskReadiness,
  computeBlastRadius,
  computeCriticalPath,
} from '../services/graphEngine.js';

describe('Graph Engine — 3-State DFS Cycle Detection', () => {
  const sampleTasks = [
    { taskId: 'T-1', dependencies: [] },
    { taskId: 'T-2', dependencies: ['T-1'] },
    { taskId: 'T-3', dependencies: ['T-2'] },
    { taskId: 'T-4', dependencies: ['T-3'] },
  ];

  test('Rejects self-dependency (task depending on itself)', () => {
    const result = detectCycle(sampleTasks, 'T-1', ['T-1']);
    assert.equal(result.hasCycle, true);
    assert.deepEqual(result.cyclePath, ['T-1', 'T-1']);
    assert.match(result.message, /cannot depend on itself/i);
  });

  test('Allows valid sequential dependency additions in a DAG', () => {
    const result = detectCycle(sampleTasks, 'T-5', ['T-4']);
    assert.equal(result.hasCycle, false);
    assert.equal(result.cyclePath, null);
  });

  test('Allows valid diamond / convergent DAG patterns', () => {
    // T-1 -> T-2 -> T-4 and T-1 -> T-3 -> T-4
    const diamondTasks = [
      { taskId: 'T-1', dependencies: [] },
      { taskId: 'T-2', dependencies: ['T-1'] },
      { taskId: 'T-3', dependencies: ['T-1'] },
    ];
    const result = detectCycle(diamondTasks, 'T-4', ['T-2', 'T-3']);
    assert.equal(result.hasCycle, false);
    assert.equal(result.cyclePath, null);
  });

  test('Detects direct 2-node cycle (A -> B -> A)', () => {
    // Existing: T-2 depends on T-1. Proposed: T-1 depends on T-2.
    const result = detectCycle(sampleTasks, 'T-1', ['T-2']);
    assert.equal(result.hasCycle, true);
    assert.ok(result.cyclePath.length >= 3);
    assert.equal(result.cyclePath[0], result.cyclePath[result.cyclePath.length - 1]);
  });

  test('Detects deep multi-hop cycle (T-4 -> T-1 in T-1 -> T-2 -> T-3 -> T-4)', () => {
    const result = detectCycle(sampleTasks, 'T-1', ['T-4']);
    assert.equal(result.hasCycle, true);
    assert.deepEqual(result.cyclePath, ['T-1', 'T-2', 'T-3', 'T-4', 'T-1']);
  });
});

describe('Graph Engine — Automated Readiness State Machine', () => {
  test('Transitions task to Blocked if any prerequisite is incomplete', () => {
    const tasks = [
      { taskId: 'A', status: 'In Progress', dependencies: [] },
      { taskId: 'B', status: 'Ready', dependencies: ['A'] },
    ];
    const computed = computeTaskReadiness(tasks);
    const taskB = computed.find(t => t.taskId === 'B');
    assert.equal(taskB.status, 'Blocked');
    assert.equal(taskB.isBlocked, true);
  });

  test('Transitions task to Ready if all prerequisites are Completed', () => {
    const tasks = [
      { taskId: 'A', status: 'Completed', dependencies: [] },
      { taskId: 'B', status: 'Blocked', dependencies: ['A'] },
    ];
    const computed = computeTaskReadiness(tasks);
    const taskB = computed.find(t => t.taskId === 'B');
    assert.equal(taskB.status, 'Ready');
    assert.equal(taskB.isBlocked, false);
  });

  test('Preserves Completed and In Progress states', () => {
    const tasks = [
      { taskId: 'A', status: 'Completed', dependencies: [] },
      { taskId: 'B', status: 'In Progress', dependencies: ['A'] },
      { taskId: 'C', status: 'Completed', dependencies: ['B'] },
    ];
    const computed = computeTaskReadiness(tasks);
    assert.equal(computed.find(t => t.taskId === 'B').status, 'In Progress');
    assert.equal(computed.find(t => t.taskId === 'C').status, 'Completed');
  });
});

describe('Graph Engine — Critical Path Method (CPM)', () => {
  test('Calculates forward pass, backward pass, float, and zero-slack critical chain', () => {
    // Pipeline:
    // A (3d) -> B (4d) -> D (3d) => 10 days (Critical Path)
    // A (3d) -> C (2d) -> D (3d) => 8 days (Float = 2 days on C)
    const tasks = [
      { taskId: 'A', estimatedDays: 3, dependencies: [] },
      { taskId: 'B', estimatedDays: 4, dependencies: ['A'] },
      { taskId: 'C', estimatedDays: 2, dependencies: ['A'] },
      { taskId: 'D', estimatedDays: 3, dependencies: ['B', 'C'] },
    ];

    const cpm = computeCriticalPath(tasks);

    // Total Project Duration should be max path = 3 + 4 + 3 = 10
    assert.equal(cpm.projectDuration, 10);

    // Critical Path tasks should have slack = 0
    assert.deepEqual(cpm.criticalPath, ['A', 'B', 'D']);
    assert.equal(cpm.taskMetrics['A'].slack, 0);
    assert.equal(cpm.taskMetrics['B'].slack, 0);
    assert.equal(cpm.taskMetrics['D'].slack, 0);

    // Task C should have float/slack of 2 days
    assert.equal(cpm.taskMetrics['C'].slack, 2);
    assert.equal(cpm.taskMetrics['C'].isCritical, false);
  });
});

describe('Graph Engine — BFS Blast Radius Analysis', () => {
  test('Computes downstream dependent count and impacted cascade list', () => {
    // Root A blocks B and C. B blocks D.
    const tasks = [
      { taskId: 'A', dependencies: [] },
      { taskId: 'B', dependencies: ['A'] },
      { taskId: 'C', dependencies: ['A'] },
      { taskId: 'D', dependencies: ['B'] },
      { taskId: 'E', dependencies: [] }, // Independent
    ];

    const blast = computeBlastRadius(tasks, 'A');
    assert.equal(blast.impactCount, 3);
    assert.deepEqual(blast.directDownstream.sort(), ['B', 'C'].sort());
    assert.deepEqual(blast.allImpacted.sort(), ['B', 'C', 'D'].sort());
    assert.equal(blast.allImpacted.includes('E'), false);
  });
});
