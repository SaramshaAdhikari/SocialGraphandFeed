import { Type, type Static } from '@sinclair/typebox';

export const ReportReasonSchema = Type.Union([
  Type.Literal('spam'),
  Type.Literal('harassment'),
  Type.Literal('hate_speech'),
  Type.Literal('misinformation'),
  Type.Literal('inappropriate'),
  Type.Literal('other'),
]);
export type ReportReason = Static<typeof ReportReasonSchema>;

export const ReportTargetTypeSchema = Type.Union([
  Type.Literal('post'),
  Type.Literal('comment'),
  Type.Literal('user'),
]);
export type ReportTargetType = Static<typeof ReportTargetTypeSchema>;

export const ReportStatusSchema = Type.Union([
  Type.Literal('pending'),
  Type.Literal('resolved'),
  Type.Literal('dismissed'),
]);
export type ReportStatus = Static<typeof ReportStatusSchema>;

export const CreateReportInputSchema = Type.Object(
  {
    target_type: ReportTargetTypeSchema,
    target_id: Type.String({ minLength: 1, maxLength: 128 }),
    reason: ReportReasonSchema,
    description: Type.Optional(Type.String({ maxLength: 500 })),
  },
  { additionalProperties: false }
);
export type CreateReportInput = Static<typeof CreateReportInputSchema>;

export const ReportResponseSchema = Type.Object({
  id: Type.String(),
  reporter_id: Type.String(),
  target_type: ReportTargetTypeSchema,
  target_id: Type.String(),
  reason: ReportReasonSchema,
  description: Type.Optional(Type.String()),
  status: ReportStatusSchema,
  action_taken: Type.Optional(Type.Union([Type.Literal('none'), Type.Literal('removed'), Type.Literal('dismissed')])),
  resolved_by: Type.Optional(Type.String()),
  resolved_at: Type.Optional(Type.String({ format: 'date-time' })),
  created_at: Type.String({ format: 'date-time' }),
});
export type ReportResponse = Static<typeof ReportResponseSchema>;

export const AdminResolveReportInputSchema = Type.Object(
  {
    status: Type.Union([Type.Literal('resolved'), Type.Literal('dismissed')]),
    action: Type.Optional(Type.Union([Type.Literal('none'), Type.Literal('remove_content')])),
    notes: Type.Optional(Type.String({ maxLength: 500 })),
  },
  { additionalProperties: false }
);
export type AdminResolveReportInput = Static<typeof AdminResolveReportInputSchema>;

export const ReportsListQuerySchema = Type.Object(
  {
    status: Type.Optional(ReportStatusSchema),
    target_type: Type.Optional(ReportTargetTypeSchema),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50 })),
    cursor: Type.Optional(Type.String()),
  },
  { additionalProperties: false }
);
export type ReportsListQuery = Static<typeof ReportsListQuerySchema>;

export const ReportsListResponseSchema = Type.Object({
  data: Type.Array(ReportResponseSchema),
  total_count: Type.Integer({ minimum: 0 }),
  next_cursor: Type.Union([Type.String(), Type.Null()]),
  has_more: Type.Boolean(),
});
export type ReportsListResponse = Static<typeof ReportsListResponseSchema>;
