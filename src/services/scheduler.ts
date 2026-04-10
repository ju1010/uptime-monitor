import cron from 'node-cron';
import { config } from '../config';
import { DatabaseService } from './database';
import { MonitorService } from './monitor';
import { NotificationService } from './notifications';

export class SchedulerService {
  private db: DatabaseService;
  private monitor: MonitorService;
  private notifications: NotificationService;

  constructor() {
    this.db = new DatabaseService();
    this.monitor = new MonitorService();
    this.notifications = new NotificationService();
  }

  start(): void {
    const cronExpression = `*/${config.monitor.intervalMinutes} * * * *`;
    
    console.log(`🚀 Starting Uptime Monitor (every ${config.monitor.intervalMinutes} minutes)`);
    
    cron.schedule(cronExpression, () => {
      this.runChecks();
    });

    this.runChecks();
  }

  private async runChecks(): Promise<void> {
    const urls = await this.db.getActiveUrls();
    console.log(`[${new Date().toISOString()}] Checking ${urls.length} URLs...`);

    const results = await Promise.all(
      urls.map(url => this.checkAndNotify(url.id, url.url, url.name))
    );

    const failed = results.filter(r => r.status === 'down').length;
    console.log(`[${new Date().toISOString()}] Completed: ${results.length - failed} up, ${failed} down`);
  }

  private async checkAndNotify(urlId: number, url: string, name: string): Promise<any> {
    const result = await this.monitor.checkUrl(urlId, url);
    await this.db.logHealthCheck(result);

    if (result.status === 'down') {
      try {
        await this.notifications.notify(result, name, url);
      } catch (error) {
        console.error(`Failed to send notification for ${name}:`, error);
      }
    }

    return result;
  }

  stop(): void {
    this.db.close();
  }
}
