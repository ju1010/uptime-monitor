import dotenv from 'dotenv';
dotenv.config();

export const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
  },
  discord: {
    webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
  },
  monitor: {
    intervalMinutes: parseInt(process.env.CHECK_INTERVAL_MINUTES || '5'),
    timeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '10000'),
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
  },
  database: {
    path: process.env.DB_PATH || './data/uptime.db',
  },
};
