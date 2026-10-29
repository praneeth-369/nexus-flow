import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5000/api';

describe('NexusFlow REST API — Integration & RBAC Tests', () => {
  let testTaskId = `TEST-${Date.now().toString().slice(-4)}`;

  test('GET /api/health — returns 200 OK and online status', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'online');
    assert.equal(data.app, 'NexusFlow API');
  });

  test('POST /api/auth/login — authenticates valid Project Lead credentials', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'lead@nexusflow.io', password: 'lead123' }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.role, 'Project Lead');
    assert.ok(data.token);
  });

  test('POST /api/auth/login — rejects invalid credentials with 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'lead@nexusflow.io', password: 'wrongpassword' }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /invalid credentials/i);
  });

  test('GET /api/project/all — lists all workspaces with task summary stats', async () => {
    const res = await fetch(`${BASE_URL}/project/all`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.projects));
    assert.ok(data.projects.length >= 1);
  });

  test('GET /api/tasks — returns tasks enriched with CPM and readiness', async () => {
    const res = await fetch(`${BASE_URL}/tasks`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.tasks));
    assert.ok(data.cpm);
    assert.ok(Array.isArray(data.cpm.criticalPath));
  });

  test('POST /api/tasks/validate-dependency — checks proposed dependency validity', async () => {
    const res = await fetch(`${BASE_URL}/tasks/validate-dependency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: 'NX-101',
        proposedDependencies: ['NX-101'], // Self dependency
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.isValid, false);
    assert.equal(data.hasCycle, true);
  });

  test('RBAC Security: Rejects Viewer role mutation with 403 Forbidden', async () => {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'Viewer', // Read-only role
      },
      body: JSON.stringify({
        taskId: 'VIEW-FAIL',
        title: 'Viewer Attempt',
        dueDate: '2026-12-01',
      }),
    });

    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.error, 'FORBIDDEN');
  });

  test('POST /api/tasks — creates a new task when requested by Project Lead', async () => {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'Project Lead',
      },
      body: JSON.stringify({
        taskId: testTaskId,
        title: 'Automated Test Task',
        description: 'Created by automated integration test runner',
        priority: 'High',
        dueDate: '2026-11-30',
        estimatedDays: 3,
        dependencies: [],
      }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.task.taskId, testTaskId);
  });

  test('DELETE /api/tasks/:taskId — deletes task when requested by Project Lead', async () => {
    const res = await fetch(`${BASE_URL}/tasks/${testTaskId}`, {
      method: 'DELETE',
      headers: {
        'x-user-role': 'Project Lead',
      },
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
  });
});
