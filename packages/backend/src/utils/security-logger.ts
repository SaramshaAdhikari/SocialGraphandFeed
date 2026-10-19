/**
 * Structured Security Logger per Universal Web App Security v2 Section 15.
 * Enforces mandatory inclusion of timestamp, request_id, actor, IP address,
 * and strict redaction of sensitive credentials (passwords, tokens, cookies).
 */

export interface SecurityLogEvent {
  event: 'auth_failed' | 'csrf_failed' | 'rate_limit_exceeded' | 'security_anomaly';
  timestamp: string;
  request_id?: string;
  actor?: string | null;
  ip: string;
  detail: string;
  metadata?: Record<string, unknown>;
}

function redact(obj: Record<string, unknown>): Record<string, unknown> {
  const SENSITIVE_KEYS = new Set([
    'password',
    'password_confirmation',
    'token',
    'csrf_token',
    'session_secret',
    'authorization',
    'cookie',
    'secret',
  ]);

  const cleaned: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      cleaned[key] = redact(val as Record<string, unknown>);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

export const securityLogger = {
  authFailed(opts: { ip: string; actor?: string; requestId?: string; reason: string }): void {
    const entry: SecurityLogEvent = {
      event: 'auth_failed',
      timestamp: new Date().toISOString(),
      request_id: opts.requestId,
      actor: opts.actor || 'anonymous',
      ip: opts.ip,
      detail: opts.reason,
    };
    console.warn(JSON.stringify(entry));
  },

  csrfFailed(opts: { ip: string; actor?: string; requestId?: string; method: string; path: string }): void {
    const entry: SecurityLogEvent = {
      event: 'csrf_failed',
      timestamp: new Date().toISOString(),
      request_id: opts.requestId,
      actor: opts.actor || 'anonymous',
      ip: opts.ip,
      detail: `CSRF verification failed on ${opts.method} ${opts.path}`,
    };
    console.warn(JSON.stringify(entry));
  },

  rateLimitHit(opts: { action: string; ip: string; userId?: string; requestId?: string; limit: number; windowSeconds: number }): void {
    const entry: SecurityLogEvent = {
      event: 'rate_limit_exceeded',
      timestamp: new Date().toISOString(),
      request_id: opts.requestId,
      actor: opts.userId || 'anonymous',
      ip: opts.ip,
      detail: `Rate limit hit for ${opts.action} (limit: ${opts.limit} in ${opts.windowSeconds}s)`,
      metadata: { action: opts.action, limit: opts.limit, windowSeconds: opts.windowSeconds },
    };
    console.warn(JSON.stringify(entry));
  },

  logAnomaly(opts: { ip: string; actor?: string; requestId?: string; detail: string; metadata?: Record<string, unknown> }): void {
    const entry: SecurityLogEvent = {
      event: 'security_anomaly',
      timestamp: new Date().toISOString(),
      request_id: opts.requestId,
      actor: opts.actor || 'anonymous',
      ip: opts.ip,
      detail: opts.detail,
      metadata: opts.metadata ? redact(opts.metadata) : undefined,
    };
    console.warn(JSON.stringify(entry));
  },
};
