export interface MonitoredUrl {
  id: number;
  url: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface HealthCheckResult {
  id?: number;
  urlId: number;
  status: 'up' | 'down';
  statusCode?: number;
  responseTime?: number;
  error?: string;
  errorType?: string;
  checkedAt: string;
}

export interface UptimeStats {
  urlId: number;
  url: string;
  name: string;
  uptimePercent: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
}
