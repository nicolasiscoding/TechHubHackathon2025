import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import incidentsRouter from './routes/incidents';
import routesRouter from './routes/routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/incidents', incidentsRouter);
app.use('/api/routes', routesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌀 Community Map Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoints:`);
  console.log(`  POST http://localhost:${PORT}/api/incidents - Create incident`);
  console.log(`  GET  http://localhost:${PORT}/api/incidents - Get all incidents`);
  console.log(`  GET  http://localhost:${PORT}/api/incidents/exclusions - Get Valhalla exclusions`);
  console.log(`  POST http://localhost:${PORT}/api/routes - Calculate route with incident avoidance`);
  console.log(`  GET  http://localhost:${PORT}/api/routes/test - Test Valhalla routing`);
});

export default app;