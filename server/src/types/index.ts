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

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface LoginResponseData {
  user: import('./database.js').SafeAdminUser;
}

export interface MeResponseData {
  user: import('./database.js').SafeAdminUser;
}

export interface LogoutResponseData {
  message: string;
}
