export * from './database.js';

export interface HealthResponse {
  status: 'ok' | 'error' | 'unconfigured';
  uptime?: number;
  timestamp: string;
  environment: string;
}

export interface DatabaseHealthResponse {
  status: 'ok' | 'error' | 'unconfigured';
  database: 'connected' | 'disconnected' | 'unconfigured';
  latencyMs?: number;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}
