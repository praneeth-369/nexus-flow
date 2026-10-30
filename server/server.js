import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import advisorRoutes from './routes/advisorRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { storage } from './services/storageEngine.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/chat', chatRoutes);

// Root Welcome Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: 'NexusFlow API Gateway',
    version: '1.0.0',
    health: '/api/health',
    endpoints: {
      tasks: '/api/tasks',
      projects: '/api/project/all',
      auth: '/api/auth/accounts',
    },
    message: 'NexusFlow Project Dependency & Critical Path Management API is active.',
  });
});

// General Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'NexusFlow API',
    version: '1.0.0',
    storage: storage.getStatus(),
    timestamp: new Date().toISOString(),
  });
});

// Centralized 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'ENDPOINT_NOT_FOUND',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred',
  });
});

// Start Server
async function start() {
  try {
    await storage.connect();
    app.listen(PORT, () => {
      console.log(`
  🚀 NexusFlow Server running on http://localhost:${PORT}
  📦 Mode: ${storage.mode.toUpperCase()} (${storage.mode === 'mongodb' ? 'MongoDB Atlas' : 'Local Resilient Fallback'})
  🎯 Health Check: http://localhost:${PORT}/api/health
      `);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
