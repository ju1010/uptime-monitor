import express from 'express';
import { config } from './config';
import { SchedulerService } from './services/scheduler';
import apiRoutes from './routes/api';

const app = express();
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/', (_req, res) => {
  res.send(`
    <h1>Uptime Monitor API</h1>
    <ul>
      <li>GET /api/health - Health check</li>
      <li>GET /api/urls - List monitored URLs</li>
      <li>POST /api/urls - Add URL (body: {url, name})</li>
      <li>GET /api/stats?days=7 - Uptime statistics</li>
      <li>GET /api/urls/:id/checks - Recent checks for URL</li>
      <li>POST /api/check/:id - Trigger manual check</li>
    </ul>
  `);
});

const scheduler = new SchedulerService();
scheduler.start();

app.listen(config.server.port, () => {
  console.log(`📊 Dashboard API running on http://localhost:${config.server.port}`);
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  scheduler.stop();
  process.exit(0);
});
