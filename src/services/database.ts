import { config } from '../config';
import { MonitoredUrl, HealthCheckResult, UptimeStats } from '../models/types';
import * as fs from 'fs';
import * as path from 'path';

let initSqlJs: any;
try {
  initSqlJs = require('sql.js');
} catch (e) {
  console.error('sql.js not found, run npm install');
  process.exit(1);
}

export class DatabaseService {
  private db: any = null;
  private dbPath: string;
  private initPromise: Promise<void>;

  constructor() {
    this.dbPath = path.resolve(config.database.path);
    this.initPromise = this.init();
  }

  private async init(): Promise<void> {
    const SQL = await initSqlJs();
    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }
    this.createTables();
  }

  private async ensureReady(): Promise<void> {
    await this.initPromise;
  }

  private createTables(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS urls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS health_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        status_code INTEGER,
        response_time INTEGER,
        error TEXT,
        error_type TEXT,
        checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (url_id) REFERENCES urls(id)
      )
    `);
    this.save();
  }

  private save(): void {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.dbPath, buffer);
  }

  async addUrl(url: string, name: string): Promise<MonitoredUrl> {
    await this.ensureReady();
    this.db.run('INSERT INTO urls (url, name) VALUES (?, ?)', [url, name]);
    const result = this.db.exec('SELECT last_insert_rowid() as id');
    const id = result[0]?.values[0]?.[0] as number;
    this.save();
    return { id, url, name, isActive: true, createdAt: new Date().toISOString() };
  }

  async getActiveUrls(): Promise<MonitoredUrl[]> {
    await this.ensureReady();
    const result = this.db.exec('SELECT * FROM urls WHERE is_active = 1');
    if (!result.length) return [];
    return result[0].values.map((row: any[]) => ({
      id: row[0] as number,
      url: row[1] as string,
      name: row[2] as string,
      isActive: Boolean(row[3]),
      createdAt: row[4] as string,
    }));
  }

  async logHealthCheck(result: HealthCheckResult): Promise<void> {
    await this.ensureReady();
    this.db.run(
      `INSERT INTO health_checks (url_id, status, status_code, response_time, error, error_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [result.urlId, result.status, result.statusCode || null, result.responseTime || null, result.error || null, result.errorType || null]
    );
    this.save();
  }

  async getUptimeStats(days: number = 7): Promise<UptimeStats[]> {
    await this.ensureReady();
    const result = this.db.exec(`
      SELECT 
        u.id as urlId,
        u.url,
        u.name,
        COUNT(h.id) as totalChecks,
        SUM(CASE WHEN h.status = 'up' THEN 1 ELSE 0 END) as successfulChecks,
        SUM(CASE WHEN h.status = 'down' THEN 1 ELSE 0 END) as failedChecks,
        ROUND(CAST(SUM(CASE WHEN h.status = 'up' THEN 1 ELSE 0 END) AS FLOAT) / 
              NULLIF(COUNT(h.id), 0) * 100, 2) as uptimePercent
      FROM urls u
      LEFT JOIN health_checks h ON u.id = h.url_id 
        AND h.checked_at >= datetime('now', '-${days} days')
      WHERE u.is_active = 1
      GROUP BY u.id
    `);
    if (!result.length) return [];
    return result[0].values.map((row: any[]) => ({
      urlId: row[0] as number,
      url: row[1] as string,
      name: row[2] as string,
      totalChecks: row[3] as number,
      successfulChecks: row[4] as number,
      failedChecks: row[5] as number,
      uptimePercent: (row[6] as number) || 0,
    }));
  }

  async getRecentChecks(urlId: number, limit: number = 100): Promise<HealthCheckResult[]> {
    await this.ensureReady();
    const result = this.db.exec(
      `SELECT * FROM health_checks WHERE url_id = ${urlId} ORDER BY checked_at DESC LIMIT ${limit}`
    );
    if (!result.length) return [];
    return result[0].values.map((row: any[]) => ({
      id: row[0] as number,
      urlId: row[1] as number,
      status: row[2] as 'up' | 'down',
      statusCode: row[3] as number | undefined,
      responseTime: row[4] as number | undefined,
      error: row[5] as string | undefined,
      errorType: row[6] as string | undefined,
      checkedAt: row[7] as string,
    }));
  }

  close(): void {
    if (this.db) {
      this.save();
      this.db.close();
    }
  }
}
