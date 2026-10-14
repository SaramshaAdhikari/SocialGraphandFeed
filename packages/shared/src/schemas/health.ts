import { Type, type Static } from '@sinclair/typebox';

export const ServiceHealthSchema = Type.Object({
  status: Type.Union([Type.Literal('connected'), Type.Literal('disconnected'), Type.Literal('degraded')]),
  latency_ms: Type.Optional(Type.Number({ minimum: 0 })),
  error: Type.Optional(Type.String()),
});

export const HealthStatusSchema = Type.Object({
  status: Type.Union([Type.Literal('ok'), Type.Literal('degraded'), Type.Literal('error')]),
  timestamp: Type.String({ format: 'date-time' }),
  uptime_seconds: Type.Number({ minimum: 0 }),
  version: Type.String(),
  services: Type.Object({
    mongodb: ServiceHealthSchema,
    redis: ServiceHealthSchema,
  }),
});

export type HealthStatus = Static<typeof HealthStatusSchema>;
export type ServiceHealth = Static<typeof ServiceHealthSchema>;
