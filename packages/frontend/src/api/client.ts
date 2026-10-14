import type { HealthStatus, ApiErrorResponse } from '@socialgraph/shared';

export class ApiClientError extends Error {
  public readonly problem: ApiErrorResponse;

  constructor(problem: ApiErrorResponse) {
    super(problem.detail);
    this.name = 'ApiClientError';
    this.problem = problem;
  }
}

export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
      let problem: ApiErrorResponse;
      try {
        problem = await res.json();
      } catch {
        problem = {
          type: 'https://socialgraph.dev/errors/unknown',
          title: 'HTTP Error',
          status: res.status,
          detail: res.statusText || 'An unexpected HTTP error occurred.',
          code: 'HTTP_ERROR',
          timestamp: new Date().toISOString(),
        };
      }
      throw new ApiClientError(problem);
    }

    return res.json() as Promise<T>;
  }

  public async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/api/v1/health');
  }

  public async getMetrics(): Promise<{ uptime_seconds: number; node_version: string }> {
    return this.request('/api/v1/metrics');
  }
}

export const api = new ApiClient();
