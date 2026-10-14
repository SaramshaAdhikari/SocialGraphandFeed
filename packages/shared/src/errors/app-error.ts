import type { ApiErrorResponse } from '../schemas/common.js';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_SERVER_ERROR';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly detail: string;
  public readonly invalidParams?: Array<{ name: string; reason: string }>;
  public readonly type: string;

  constructor(opts: {
    code: ErrorCode;
    statusCode: number;
    title: string;
    detail: string;
    invalidParams?: Array<{ name: string; reason: string }>;
    type?: string;
  }) {
    super(opts.detail);
    this.name = 'AppError';
    this.code = opts.code;
    this.statusCode = opts.statusCode;
    this.detail = opts.detail;
    this.invalidParams = opts.invalidParams;
    this.type = opts.type ?? `https://socialgraph.dev/errors/${opts.code.toLowerCase().replace(/_/g, '-')}`;
  }

  public toRfc7807(instance?: string): ApiErrorResponse {
    return {
      type: this.type,
      title: this.messageTitle(),
      status: this.statusCode,
      detail: this.detail,
      instance,
      code: this.code,
      invalidParams: this.invalidParams,
      timestamp: new Date().toISOString(),
    };
  }

  private messageTitle(): string {
    switch (this.code) {
      case 'NOT_FOUND':
        return 'Resource Not Found';
      case 'VALIDATION_ERROR':
        return 'Validation Error';
      case 'BAD_REQUEST':
        return 'Bad Request';
      case 'UNAUTHORIZED':
        return 'Authentication Required';
      case 'FORBIDDEN':
        return 'Action Forbidden';
      case 'CONFLICT':
        return 'Resource Conflict';
      case 'RATE_LIMITED':
        return 'Rate Limit Exceeded';
      case 'SERVICE_UNAVAILABLE':
        return 'Service Temporarily Unavailable';
      default:
        return 'Internal Server Error';
    }
  }

  public static notFound(resource: string, id?: string): AppError {
    return new AppError({
      code: 'NOT_FOUND',
      statusCode: 404,
      title: 'Resource Not Found',
      detail: id ? `${resource} with id '${id}' was not found.` : `${resource} was not found.`,
    });
  }

  public static badRequest(detail: string, invalidParams?: Array<{ name: string; reason: string }>): AppError {
    return new AppError({
      code: 'BAD_REQUEST',
      statusCode: 400,
      title: 'Bad Request',
      detail,
      invalidParams,
    });
  }

  public static validationError(invalidParams: Array<{ name: string; reason: string }>): AppError {
    return new AppError({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
      title: 'Validation Error',
      detail: 'One or more request parameters failed validation.',
      invalidParams,
    });
  }

  public static unauthorized(detail = 'Authentication credentials are required'): AppError {
    return new AppError({
      code: 'UNAUTHORIZED',
      statusCode: 401,
      title: 'Authentication Required',
      detail,
    });
  }

  public static forbidden(detail = 'You do not have permission to perform this action'): AppError {
    return new AppError({
      code: 'FORBIDDEN',
      statusCode: 403,
      title: 'Action Forbidden',
      detail,
    });
  }

  public static serviceUnavailable(detail = 'A required downstream service is unavailable'): AppError {
    return new AppError({
      code: 'SERVICE_UNAVAILABLE',
      statusCode: 503,
      title: 'Service Temporarily Unavailable',
      detail,
    });
  }
}
