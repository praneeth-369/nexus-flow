# NexusFlow Automated Test Suite

This directory contains automated tests for the NexusFlow backend and graph calculation engine.

## How to Run Tests
From the root directory:
```bash
npm test
```
Or from the `server` directory:
```bash
cd server
npm test
```

## Test Suites Overview (19 Tests across 5 Suites)

### 1. `server/tests/api.test.js` — REST API & RBAC Integration Tests
* `GET /api/health`: 200 OK and online status check.
* `POST /api/auth/login`: Authenticates valid Project Lead credentials.
* `POST /api/auth/login`: Rejects invalid credentials with 401 Unauthorized.
* `GET /api/project/all`: Lists all workspaces with task summary metrics.
* `GET /api/tasks`: Returns tasks enriched with dynamic CPM and readiness states.
* `POST /api/tasks/validate-dependency`: Validates candidate dependencies prior to save.
* `RBAC Security`: Rejects `Viewer` role mutation requests with `403 Forbidden`.
* `POST /api/tasks`: Creates a new task with DFS cycle validation.
* `DELETE /api/tasks/:taskId`: Deletes a task and cleans up dependent edges.

### 2. `server/tests/graphEngine.test.js` — Mathematical Domain Logic
* **3-State DFS Cycle Detection ($O(V+E)$):**
  * Rejects self-dependency.
  * Allows valid sequential DAG chains.
  * Allows convergent diamond DAG patterns.
  * Detects direct 2-node cycles ($A \to B \to A$).
  * Detects deep multi-hop cycles ($T_4 \to T_1$ in $T_1 \to T_2 \to T_3 \to T_4$).
* **Automated Readiness State Machine:**
  * Locks task as `Blocked` if prerequisites are incomplete.
  * Transitions task to `Ready` when all prerequisites are `Completed`.
  * Preserves `In Progress` and `Completed` states.
* **Critical Path Method (CPM):**
  * Verifies forward pass ($ES, EF$), backward pass ($LS, LF$), total float, and zero-slack critical sequence.
* **BFS Blast Radius Analysis:**
  * Calculates downstream dependent count and cascade impact list.
