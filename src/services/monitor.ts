import axios from 'axios';
import { config } from '../config';
import { HealthCheckResult } from '../models/types';

export class MonitorService {
  async checkUrl(urlId: number, url: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(url, {
        timeout: config.monitor.timeoutMs,
        validateStatus: () => true,
      });

      const responseTime = Date.now() - startTime;
      const isUp = response.status === 200;

      return {
        urlId,
        status: isUp ? 'up' : 'down',
        statusCode: response.status,
        responseTime,
        error: isUp ? undefined : `HTTP ${response.status}`,
        errorType: this.getErrorType(response.status),
        checkedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const errorType = this.getErrorTypeFromException(error);
      
      return {
        urlId,
        status: 'down',
        responseTime,
        error: error.message,
        errorType,
        checkedAt: new Date().toISOString(),
      };
    }
  }

  private getErrorType(statusCode: number): string {
    if (statusCode >= 500) return 'SERVER_ERROR';
    if (statusCode >= 400) return 'CLIENT_ERROR';
    if (statusCode >= 300) return 'REDIRECT';
    return 'UNKNOWN';
  }

  private getErrorTypeFromException(error: any): string {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return 'TIMEOUT';
    }
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return 'CONNECTION_ERROR';
    }
    return 'NETWORK_ERROR';
  }
}
