import express from 'express';

const router = express.Router();

// Defined role accounts with secure demo passwords
export const DEFAULT_USERS = [
  {
    id: 'usr-1',
    email: 'lead@nexusflow.io',
    username: 'lead',
    password: 'lead123',
    name: 'Alex Rivera',
    role: 'Project Lead',
    badge: 'Admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    initials: 'AR',
    permissions: ['create_task', 'edit_task', 'delete_task', 'manage_dependencies', 'export_data', 'reset_workspace'],
    description: 'Full administrative access across DAG engine, tasks, and dependency validation.',
  },
  {
    id: 'usr-2',
    email: 'member@nexusflow.io',
    username: 'member',
    password: 'member123',
    name: 'Elena Rostova',
    role: 'Team Member',
    badge: 'Editor',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    initials: 'ER',
    permissions: ['update_status', 'edit_assigned_tasks', 'view_metrics'],
    description: 'Can advance task progress (Ready → In Progress → Completed) and inspect assignments.',
  },
  {
    id: 'usr-3',
    email: 'viewer@nexusflow.io',
    username: 'viewer',
    password: 'viewer123',
    name: 'Jordan Miller',
    role: 'Viewer',
    badge: 'Read-only',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    initials: 'JM',
    permissions: ['view_only'],
    description: 'Read-only access to explore dependency graph, timeline, and telemetry dashboards.',
  },
];

/**
 * POST /api/auth/login
 * Validates credentials and logs in as the respective role.
 */
router.post('/login', (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or username

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      error: 'Identifier (email/username) and password are required.',
    });
  }

  const cleanIdentifier = identifier.trim().toLowerCase();
  const user = DEFAULT_USERS.find(
    (u) =>
      u.email.toLowerCase() === cleanIdentifier ||
      u.username.toLowerCase() === cleanIdentifier
  );

  if (!user || user.password !== password.trim()) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials. Please verify your email/username and password.',
    });
  }

  // Safe user payload (exclude plain password in response)
  const safeUser = { ...user };
  delete safeUser.password;

  res.json({
    success: true,
    message: `Authenticated as ${user.name} (${user.role})`,
    user: safeUser,
    token: `nexus-jwt-${user.id}-${Date.now()}`,
  });
});

/**
 * GET /api/auth/accounts
 * Returns public list of demo accounts for quick-fill assistance.
 */
router.get('/accounts', (req, res) => {
  const safeAccounts = DEFAULT_USERS.map((u) => ({
    email: u.email,
    username: u.username,
    name: u.name,
    role: u.role,
    badge: u.badge,
    avatar: u.avatar,
    initials: u.initials,
    description: u.description,
    demoPassword: u.password,
  }));

  res.json({
    success: true,
    accounts: safeAccounts,
  });
});

export default router;
