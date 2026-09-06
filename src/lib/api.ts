/**
 * ITSA Web Platform — Typed Native Fetch API Client
 * Phase 5: Decoupled Neon / Express API Foundation
 */

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, code = 'UNKNOWN_ERROR', status = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
}

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE_URL = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, '') : '';

/**
 * Normalizes endpoint URL using VITE_API_BASE_URL (or root-relative fallback for Vite proxy).
 */
function resolveUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}

/**
 * Core native-fetch wrapper enforcing credentials: 'include' and envelope unwrapping.
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = resolveUrl(endpoint);
  const headers = new Headers(options.headers);

  let body = options.body;

  // Automatically JSON-serialize objects (excluding FormData, Blob, URLSearchParams)
  if (
    body !== undefined &&
    body !== null &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof URLSearchParams) &&
    typeof body !== 'string'
  ) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    body = JSON.stringify(body);
  }

  const config: RequestInit = {
    ...options,
    headers,
    body,
    credentials: 'include', // Always send and receive the HttpOnly itsa_session cookie
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (networkError: any) {
    throw new ApiError(
      networkError.message || 'Unable to connect to the ITSA API server.',
      'NETWORK_ERROR',
      0
    );
  }

  // Attempt to parse JSON envelope
  let json: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      json = await response.json();
    } catch {
      json = null;
    }
  }

  // If backend standard envelope exists: { success: true, data: ... }
  if (json && typeof json === 'object' && 'success' in json) {
    if (json.success === true) {
      return json.data as T;
    }

    const errPayload = json.error || {};
    throw new ApiError(
      errPayload.message || 'An API error occurred.',
      errPayload.code || 'API_ERROR',
      response.status,
      errPayload.details
    );
  }

  // Fallback if response is non-JSON or missing envelope
  if (!response.ok) {
    const errorText = json ? JSON.stringify(json) : await response.text().catch(() => '');
    throw new ApiError(
      errorText || response.statusText || `Request failed with status ${response.status}`,
      'HTTP_ERROR',
      response.status
    );
  }

  return json as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { ...options, method: 'DELETE', body }),

  raw: request,
};
