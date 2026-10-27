import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { query, initDbPool } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { logEvent } from './services/cloudwatchService.js';
import { loadParameterStoreConfig } from './services/ssmService.js';

import authRoutes from './routes/authRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Trust proxy for rate limiting behind EC2 reverse proxy or CloudFront
app.set('trust proxy', 1);

// Security & Parsing Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, postman) or matching origin
    if (!origin || origin === CLIENT_ORIGIN || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for college demonstration
  },
  credentials: true
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Structured Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl !== '/api/health') {
      logEvent('INFO', `${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: duration,
        ip: req.ip
      });
    }
  });
  next();
});

// General rate limiter
app.use('/api', apiRateLimiter);

// Health Check Endpoint: Validates database connectivity without exposing sensitive credentials or stack traces
app.get('/api/health', async (req, res) => {
  let isDbConnected = false;
  try {
    await query('SELECT 1');
    isDbConnected = true;
  } catch (err) {
    // Log detailed diagnostics internally for monitoring, but never leak error details to public HTTP caller
    logEvent('ERROR', 'Application health check DB ping failed', {
      error: err.message
    });
  }

  const statusCode = isDbConnected ? 200 : 503;
  res.status(statusCode).json({
    status: isDbConnected ? 'healthy' : 'degraded',
    service: 'FixMyCampus API Server',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    awsServicesEnabled: process.env.USE_AWS_SERVICES === 'true',
    database: isDbConnected ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Explicit 404 Handler for Unmatched API Endpoints
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// In Production on EC2: Serve Vite client build if present
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`[Static] Serving frontend static assets from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Central Error Handler
app.use(errorHandler);

let server = null;

async function startServer() {
  // Synchronize configuration from SSM Parameter Store before opening server port
  if (process.env.USE_AWS_SERVICES === 'true') {
    console.log('[Startup] Loading configuration from AWS Systems Manager Parameter Store...');
    await loadParameterStoreConfig();
    initDbPool();
  }

  server = app.listen(PORT, () => {
    console.log('====================================================');
    console.log(`🏛️  FixMyCampus Server Running on Port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`☁️  AWS Cloud Services: ${process.env.USE_AWS_SERVICES === 'true' ? 'ENABLED (EC2 Mode)' : 'LOCAL ADAPTERS (Dev Mode)'}`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
    console.log('====================================================');
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// Handle graceful shutdown
function handleGracefulShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Shutting down HTTP server gracefully...`);
  server.close(() => {
    console.log('[Server] Closed all remaining connections. Process exiting.');
    process.exit(0);
  });
}

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

export default app;
