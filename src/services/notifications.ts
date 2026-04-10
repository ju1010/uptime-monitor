import axios from 'axios';
import { config } from '../config';
import { HealthCheckResult } from '../models/types';

export class NotificationService {
  async notify(result: HealthCheckResult, urlName: string, url: string): Promise<void> {
    const message = this.formatMessage(result, urlName, url);
    
    await Promise.allSettled([
      this.sendTelegram(message),
      this.sendDiscord(message),
    ]);
  }

  private formatMessage(result: HealthCheckResult, urlName: string, url: string): string {
    const emoji = result.status === 'down' ? '🔴' : '🟢';
    const timestamp = new Date(result.checkedAt).toISOString();
    
    let message = `${emoji} *Uptime Alert*\n`;
    message += `*Site:* ${urlName}\n`;
    message += `*URL:* ${url}\n`;
    message += `*Status:* ${result.status.toUpperCase()}\n`;
    
    if (result.statusCode) {
      message += `*HTTP Code:* ${result.statusCode}\n`;
    }
    if (result.responseTime) {
      message += `*Response Time:* ${result.responseTime}ms\n`;
    }
    if (result.error) {
      message += `*Error:* ${result.error}\n`;
    }
    message += `*Time:* ${timestamp}`;
    
    return message;
  }

  private async sendTelegram(message: string): Promise<void> {
    if (!config.telegram.botToken || !config.telegram.chatId) {
      return;
    }

    const url = `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`;
    await axios.post(url, {
      chat_id: config.telegram.chatId,
      text: message,
      parse_mode: 'Markdown',
    });
  }

  private async sendDiscord(message: string): Promise<void> {
    if (!config.discord.webhookUrl) {
      return;
    }

    const color = 0xff0000;
    const embed = {
      title: 'Uptime Monitor Alert',
      description: message,
      color,
      timestamp: new Date().toISOString(),
    };

    await axios.post(config.discord.webhookUrl, {
      embeds: [embed],
    });
  }
}
