import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/database';
import { MonitorService } from '../services/monitor';
import { NotificationService } from '../services/notifications';

const router = Router();
const db = new DatabaseService();
const monitor = new MonitorService();
const notifications = new NotificationService();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/urls', async (_req: Request, res: Response) => {
  const urls = await db.getActiveUrls();
  res.json(urls);
});

router.post('/urls', async (req: Request, res: Response) => {
  const { url, name } = req.body;
  if (!url || !name) {
    return res.status(400).json({ error: 'url and name are required' });
  }
  const result = await db.addUrl(url, name);
  res.status(201).json(result);
});

router.get('/stats', async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 7;
  const stats = await db.getUptimeStats(days);
  res.json(stats);
});

router.get('/urls/:id/checks', async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const checks = await db.getRecentChecks(parseInt(req.params.id), limit);
  res.json(checks);
});

router.post('/check/:id', async (req: Request, res: Response) => {
  const urlId = parseInt(req.params.id);
  const urls = await db.getActiveUrls();
  const url = urls.find(u => u.id === urlId);
  
  if (!url) {
    return res.status(404).json({ error: 'URL not found' });
  }

  const result = await monitor.checkUrl(urlId, url.url);
  await db.logHealthCheck(result);

  if (result.status === 'down') {
    await notifications.notify(result, url.name, url.url);
  }

  res.json(result);
});

export default router;
