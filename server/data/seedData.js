export const defaultProject = {
  projectId: 'nexusflow-cloud-v2',
  name: 'Web Application Launch',
  description: 'Full-stack software application release with dependency tracking and critical path scheduling.',
  targetDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  status: 'active',
  taskPrefix: 'NX',
};

const today = new Date();
const addDays = (days) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const defaultTasks = [
  {
    taskId: 'NX-101',
    title: 'Project Setup & Database Schema',
    description: 'Set up project repository, folder structure, and database tables.',
    owner: {
      name: 'Alex Rivera',
      role: 'Project Lead',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      initials: 'AR',
    },
    priority: 'Critical',
    status: 'Completed',
    dueDate: addDays(-14),
    estimatedDays: 3,
    dependencies: [],
    tags: ['Setup', 'Database'],
  },
  {
    taskId: 'NX-102',
    title: 'User Authentication & Login',
    description: 'Build user signup, login, password hashing, and token verification.',
    owner: {
      name: 'Marcus Chen',
      role: 'Backend Lead',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      initials: 'MC',
    },
    priority: 'High',
    status: 'Completed',
    dueDate: addDays(-10),
    estimatedDays: 4,
    dependencies: ['NX-101'],
    tags: ['Auth', 'Security'],
  },
  {
    taskId: 'NX-103',
    title: 'Core Backend APIs',
    description: 'Create CRUD endpoints for data models, validation, and database operations.',
    owner: {
      name: 'Marcus Chen',
      role: 'Backend Lead',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      initials: 'MC',
    },
    priority: 'Critical',
    status: 'Completed',
    dueDate: addDays(-8),
    estimatedDays: 5,
    dependencies: ['NX-101'],
    tags: ['Backend', 'API'],
  },
  {
    taskId: 'NX-104',
    title: 'UI Design & Component Layout',
    description: 'Build navigation bar, sidebar layout, forms, and responsive page styling.',
    owner: {
      name: 'Elena Rostova',
      role: 'Frontend Lead',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      initials: 'ER',
    },
    priority: 'High',
    status: 'Completed',
    dueDate: addDays(-7),
    estimatedDays: 4,
    dependencies: ['NX-101'],
    tags: ['Design', 'UI'],
  },
  {
    taskId: 'NX-105',
    title: 'Payment Gateway Integration',
    description: 'Connect checkout API, card payments, and billing webhook handlers.',
    owner: {
      name: 'Dev Patel',
      role: 'Full Stack Dev',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      initials: 'DP',
    },
    priority: 'Critical',
    status: 'In Progress',
    dueDate: addDays(-2), // Overdue bottleneck
    estimatedDays: 5,
    dependencies: ['NX-102', 'NX-103'],
    tags: ['Payments', 'Billing'],
  },
  {
    taskId: 'NX-106',
    title: 'User Dashboard & Profile Page',
    description: 'Create user dashboard widgets, profile editing, and account settings.',
    owner: {
      name: 'Elena Rostova',
      role: 'Frontend Lead',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      initials: 'ER',
    },
    priority: 'High',
    status: 'In Progress',
    dueDate: addDays(4),
    estimatedDays: 6,
    dependencies: ['NX-104', 'NX-103'],
    tags: ['Frontend', 'Dashboard'],
  },
  {
    taskId: 'NX-107',
    title: 'Email Notifications System',
    description: 'Send automated welcome emails, password reset links, and task notifications.',
    owner: {
      name: 'Dev Patel',
      role: 'Full Stack Dev',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      initials: 'DP',
    },
    priority: 'Medium',
    status: 'Ready', // All prerequisites (NX-103) done!
    dueDate: addDays(6),
    estimatedDays: 3,
    dependencies: ['NX-103'],
    tags: ['Email', 'Alerts'],
  },
  {
    taskId: 'NX-108',
    title: 'Analytics & Reports View',
    description: 'Add summary charts, usage statistics, and downloadable data reports.',
    owner: {
      name: 'Sofia Kim',
      role: 'UI Engineer',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
      initials: 'SK',
    },
    priority: 'Medium',
    status: 'In Progress',
    dueDate: addDays(7),
    estimatedDays: 4,
    dependencies: ['NX-104', 'NX-106'],
    tags: ['Analytics', 'Reports'],
  },
  {
    taskId: 'NX-109',
    title: 'Security & Access Control',
    description: 'Implement role-based permissions, protect routes, and sanitize user inputs.',
    owner: {
      name: 'Jordan Miller',
      role: 'Security Engineer',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
      initials: 'JM',
    },
    priority: 'Critical',
    status: 'Blocked', // Blocked by NX-105
    dueDate: addDays(10),
    estimatedDays: 3,
    dependencies: ['NX-105'],
    tags: ['Security', 'RBAC'],
  },
  {
    taskId: 'NX-110',
    title: 'End-to-End Testing & Bug Fixes',
    description: 'Test all user workflows, fix identified bugs, and verify API responses.',
    owner: {
      name: 'Sarah Jenkins',
      role: 'QA Engineer',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      initials: 'SJ',
    },
    priority: 'High',
    status: 'Blocked', // Blocked by NX-105 and NX-106
    dueDate: addDays(13),
    estimatedDays: 4,
    dependencies: ['NX-105', 'NX-106'],
    tags: ['QA', 'Testing'],
  },
  {
    taskId: 'NX-111',
    title: 'Documentation & User Guide',
    description: 'Write setup guide, API endpoint documentation, and user instructions.',
    owner: {
      name: 'Jordan Miller',
      role: 'Security Engineer',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
      initials: 'JM',
    },
    priority: 'Medium',
    status: 'Blocked', // Blocked by NX-109
    dueDate: addDays(16),
    estimatedDays: 2,
    dependencies: ['NX-109'],
    tags: ['Docs', 'Manual'],
  },
  {
    taskId: 'NX-112',
    title: 'Production Deployment',
    description: 'Deploy frontend and backend to production hosting with database connection.',
    owner: {
      name: 'Alex Rivera',
      role: 'Project Lead',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      initials: 'AR',
    },
    priority: 'Critical',
    status: 'Blocked', // Blocked by NX-110 and NX-111
    dueDate: addDays(20),
    estimatedDays: 3,
    dependencies: ['NX-110', 'NX-111'],
    tags: ['Deployment', 'Release'],
  },
];

// Ensure default tasks have projectId
defaultTasks.forEach(t => {
  t.projectId = 'nexusflow-cloud-v2';
});

/**
 * Generates an initial starter set of tasks for newly created projects
 */
export function createStarterTasks(projectId, prefix = 'PRJ', projectName = 'New Project') {
  const p = (prefix || 'PRJ').toUpperCase().trim();
  return [
    {
      taskId: `${p}-101`,
      projectId,
      title: 'Project Architecture & Setup',
      description: `Establish repository, architecture design, and environment configuration for ${projectName}.`,
      owner: {
        name: 'Alex Rivera',
        role: 'Project Lead',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        initials: 'AR',
      },
      priority: 'Critical',
      status: 'Completed',
      dueDate: addDays(-7),
      estimatedDays: 3,
      dependencies: [],
      tags: ['Architecture', 'Setup'],
    },
    {
      taskId: `${p}-102`,
      projectId,
      title: 'Database Schema & Migrations',
      description: 'Define relational entities, data schemas, and indexing strategies.',
      owner: {
        name: 'Marcus Chen',
        role: 'Backend Lead',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        initials: 'MC',
      },
      priority: 'High',
      status: 'Completed',
      dueDate: addDays(-4),
      estimatedDays: 4,
      dependencies: [`${p}-101`],
      tags: ['Database', 'Backend'],
    },
    {
      taskId: `${p}-103`,
      projectId,
      title: 'Core API Services',
      description: 'Implement core business logic controllers and RESTful endpoints.',
      owner: {
        name: 'Dev Patel',
        role: 'Full Stack Dev',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
        initials: 'DP',
      },
      priority: 'Critical',
      status: 'In Progress',
      dueDate: addDays(3),
      estimatedDays: 5,
      dependencies: [`${p}-102`],
      tags: ['API', 'Services'],
    },
    {
      taskId: `${p}-104`,
      projectId,
      title: 'Frontend Components & UX Flow',
      description: 'Build interface pages, design system tokens, and interactive views.',
      owner: {
        name: 'Elena Rostova',
        role: 'Frontend Lead',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
        initials: 'ER',
      },
      priority: 'High',
      status: 'Ready',
      dueDate: addDays(6),
      estimatedDays: 4,
      dependencies: [`${p}-101`],
      tags: ['Frontend', 'UI'],
    },
    {
      taskId: `${p}-105`,
      projectId,
      title: 'End-to-End Integration Testing',
      description: 'Automated integration tests across frontend client and backend API.',
      owner: {
        name: 'Sarah Jenkins',
        role: 'QA Engineer',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
        initials: 'SJ',
      },
      priority: 'High',
      status: 'Blocked',
      dueDate: addDays(10),
      estimatedDays: 3,
      dependencies: [`${p}-103`, `${p}-104`],
      tags: ['QA', 'Testing'],
    },
    {
      taskId: `${p}-106`,
      projectId,
      title: 'Production Staging & Launch',
      description: 'Deploy release candidates to production cluster with load testing.',
      owner: {
        name: 'Alex Rivera',
        role: 'Project Lead',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        initials: 'AR',
      },
      priority: 'Critical',
      status: 'Blocked',
      dueDate: addDays(14),
      estimatedDays: 2,
      dependencies: [`${p}-105`],
      tags: ['Release', 'Deployment'],
    },
  ];
}
