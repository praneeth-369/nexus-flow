# NexusFlow REST API Documentation

**Project:** NexusFlow (Problem Statement ID: `HACK-P395`)  
**Subject:** Backend Web Development  
**Base URL:** `http://localhost:5000/api`  
**Data Format:** `application/json`  
**Authentication Scheme:** Role-Based Access Control via `Authorization: Bearer <token>` or `x-user-role: <role>` header.

---

## 1. Authentication & Security (RBAC)

### Role Hierarchy & Permissions

| Role | Badge | Permissions | Modifying Access |
| :--- | :--- | :--- | :---: |
| **Project Lead** | `Admin` | Full CRUD, create/delete projects, dependency overrides, workspace reset. | ✅ Full |
| **Team Member** | `Editor` | Update task status, advance progress, add comments. | ⚠️ Task Updates Only |
| **Viewer** | `Read-only` | Read-only inspection of graph, CPM, timeline, and telemetry. | ❌ Read Only (`403 Forbidden`) |

---

## 2. API Endpoints Reference

### 2.1 System & Health

#### `GET /api/health`
Checks backend gateway status and database connectivity.
* **Headers:** None required.
* **Success Response (`200 OK`):**
```json
{
  "status": "online",
  "app": "NexusFlow API",
  "version": "1.0.0",
  "storage": {
    "mode": "mongodb",
    "connected": true,
    "isFallback": false,
    "database": "MongoDB Atlas"
  },
  "timestamp": "2026-10-29T17:15:00.000Z"
}
```

---

### 2.2 Authentication Endpoints

#### `POST /api/auth/login`
Authenticates a user by email or username and password.
* **Request Body:**
```json
{
  "identifier": "lead@nexusflow.io",
  "password": "lead123"
}
```
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Authenticated as Alex Rivera (Project Lead)",
  "user": {
    "id": "usr-1",
    "email": "lead@nexusflow.io",
    "username": "lead",
    "name": "Alex Rivera",
    "role": "Project Lead",
    "badge": "Admin",
    "initials": "AR"
  },
  "token": "nexus-jwt-usr-1"
}
```
* **Error Response (`401 Unauthorized`):**
```json
{
  "success": false,
  "error": "Invalid credentials. Please verify your email/username and password."
}
```

#### `GET /api/auth/accounts`
Retrieves pre-configured role accounts for demo auto-fill.
* **Success Response (`200 OK`):** Returns array of user profiles without password disclosure.

---

### 2.3 Project Workspace Endpoints

#### `GET /api/project/all`
Lists all project workspaces with aggregated task count and completion percentage.
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "projects": [
    {
      "projectId": "nexusflow-cloud-v2",
      "name": "Web Application Launch",
      "taskPrefix": "NX",
      "taskCount": 12,
      "completedCount": 4,
      "completionPercentage": 33
    }
  ]
}
```

#### `GET /api/project?projectId=nexusflow-cloud-v2`
Retrieves live KPIs, critical path duration, and bottleneck count for a workspace.
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "project": {
    "projectId": "nexusflow-cloud-v2",
    "name": "Web Application Launch",
    "targetDate": "2026-11-23",
    "taskPrefix": "NX"
  },
  "kpis": {
    "totalTasks": 12,
    "completedTasks": 4,
    "readyTasks": 1,
    "blockedTasks": 4,
    "inProgressTasks": 3,
    "overdueTasks": 1,
    "impactedDownstreamTasks": 4,
    "completionPercentage": 33,
    "estimatedProjectDuration": 21,
    "criticalPathLength": 5,
    "criticalPath": ["NX-101", "NX-103", "NX-105", "NX-110", "NX-112"]
  }
}
```

#### `POST /api/project/new` *(Requires Project Lead)*
Creates a new project workspace.
* **Headers:** `x-user-role: Project Lead`
* **Request Body:**
```json
{
  "name": "Mobile iOS & Android Launch",
  "description": "Production mobile app delivery",
  "taskPrefix": "MOB",
  "targetDate": "2026-12-15",
  "template": "starter"
}
```
* **Success Response (`201 Created`):** Returns created project object and seeded starter task count.

#### `PUT /api/project/:projectId` *(Requires Project Lead)*
Updates project metadata (name, target date, description).
* **Headers:** `x-user-role: Project Lead`
* **Success Response (`200 OK`)**

#### `DELETE /api/project/:projectId` *(Requires Project Lead)*
Deletes a custom project and all its associated tasks.

---

### 2.4 Task & Graph Endpoints

#### `GET /api/tasks?projectId=...`
Retrieves all tasks for the workspace, enriched with automated readiness status, Critical Path Method (CPM) metrics (Early Start, Early Finish, Late Start, Late Finish, Total Float/Slack), and blast radius downstream impact.
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "tasks": [
    {
      "taskId": "NX-105",
      "title": "Payment Gateway Integration",
      "status": "In Progress",
      "priority": "Critical",
      "estimatedDays": 5,
      "dueDate": "2026-10-27",
      "dependencies": ["NX-102", "NX-103"],
      "blastRadius": {
        "impactCount": 3,
        "directDownstream": ["NX-109", "NX-110"],
        "allImpacted": ["NX-109", "NX-110", "NX-111", "NX-112"]
      },
      "cpm": {
        "es": 5,
        "ef": 10,
        "ls": 5,
        "lf": 10,
        "slack": 0,
        "isCritical": true
      }
    }
  ],
  "cpm": {
    "projectDuration": 21,
    "criticalPath": ["NX-101", "NX-103", "NX-105", "NX-110", "NX-112"]
  }
}
```

#### `POST /api/tasks/validate-dependency`
Validates whether a proposed dependency relationship would introduce a circular cycle.
* **Request Body:**
```json
{
  "taskId": "NX-101",
  "proposedDependencies": ["NX-112"]
}
```
* **Response (Cycle Detected):**
```json
{
  "success": true,
  "isValid": false,
  "hasCycle": true,
  "cyclePath": ["NX-101", "NX-103", "NX-105", "NX-110", "NX-112", "NX-101"],
  "message": "Circular dependency detected: NX-101 → NX-103 → NX-105 → NX-110 → NX-112 → NX-101"
}
```

#### `POST /api/tasks` *(Requires Project Lead)*
Creates a new task. Rejects circular dependencies and self-dependencies.
* **Headers:** `x-user-role: Project Lead`
* **Success Response (`201 Created`)**
* **Error (`400 Bad Request` or `409 Conflict`)**

#### `PUT /api/tasks/:taskId` *(Requires Project Lead or Team Member)*
Updates task properties or advances status.
* **Headers:** `x-user-role: Team Member`

#### `DELETE /api/tasks/:taskId` *(Requires Project Lead)*
Deletes task and automatically purges its reference from any downstream dependent tasks.
* **Headers:** `x-user-role: Project Lead`

---

### 2.5 AI & Schedule Intelligence

#### `GET /api/advisor/analyze`
Generates comprehensive schedule health analysis, identifies top bottlenecks, and provides actionable recommendations.

#### `POST /api/chat`
Context-aware AI assistant with sub-75ms local mathematical execution and Gemini 3.5 Flash fallback.
* **Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "What is the top bottleneck?" }
  ],
  "projectId": "nexusflow-cloud-v2"
}
```
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "reply": "The #1 critical bottleneck is **NX-105: Payment Gateway Integration** (assigned to Dev Patel)...",
  "model": "NexusFlow Engine (71ms)",
  "latency": 71
}
```

---

## 3. Error Codes & HTTP Status Standards

| HTTP Code | Error Key | Scenario |
| :---: | :--- | :--- |
| `200` | `OK` | Successful GET, PUT, or DELETE operation. |
| `201` | `CREATED` | Resource successfully inserted into database. |
| `400` | `BAD_REQUEST` | Missing required fields or invalid payload. |
| `401` | `UNAUTHORIZED` | Invalid email/username or password. |
| `403` | `FORBIDDEN` | Role has insufficient permissions (e.g. Viewer attempting write). |
| `404` | `NOT_FOUND` | Task, project, or endpoint does not exist. |
| `409` | `CONFLICT` | Task ID duplicate or circular dependency validation failure. |
| `500` | `INTERNAL_SERVER_ERROR` | Unhandled database or system exception. |
