import type { Filter } from 'mongodb';
import { AppError } from '@socialgraph/shared';
import type { PostDoc } from '../db/types.js';

export const EPOCH_SECONDS = 1704067200; // 2024-01-01T00:00:00.000Z

export function calculateHotScore(score: number, createdAt: Date): number {
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  const seconds = createdAt.getTime() / 1000 - EPOCH_SECONDS;
  return Number((sign * order + seconds / 45000).toFixed(7));
}

export type CursorPayload =
  | { t: 'new'; createdAt: string; id: string }
  | { t: 'top'; score: number; createdAt: string; id: string }
  | { t: 'hot'; hotScore: number; createdAt: string; id: string }
  | { t: 'discovery'; createdAt: string; id: string };

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor(cursorStr: string, expectedType?: 'new' | 'top' | 'hot' | 'discovery'): CursorPayload {
  try {
    const jsonStr = Buffer.from(cursorStr, 'base64url').toString('utf8');
    const parsed = JSON.parse(jsonStr);

    if (!parsed || typeof parsed !== 'object' || typeof parsed.t !== 'string') {
      throw new Error('Cursor missing type');
    }

    if (expectedType && parsed.t !== expectedType) {
      throw new Error(`Cursor type '${parsed.t}' does not match expected sort '${expectedType}'`);
    }

    if (parsed.t === 'new') {
      if (!parsed.createdAt || !parsed.id) throw new Error('Malformed new cursor');
      return { t: 'new', createdAt: String(parsed.createdAt), id: String(parsed.id) };
    }

    if (parsed.t === 'top') {
      if (typeof parsed.score !== 'number' || !parsed.createdAt || !parsed.id) {
        throw new Error('Malformed top cursor');
      }
      return { t: 'top', score: Number(parsed.score), createdAt: String(parsed.createdAt), id: String(parsed.id) };
    }

    if (parsed.t === 'hot') {
      if (typeof parsed.hotScore !== 'number' || !parsed.createdAt || !parsed.id) {
        throw new Error('Malformed hot cursor');
      }
      return { t: 'hot', hotScore: Number(parsed.hotScore), createdAt: String(parsed.createdAt), id: String(parsed.id) };
    }

    if (parsed.t === 'discovery') {
      if (!parsed.createdAt || !parsed.id) throw new Error('Malformed discovery cursor');
      return { t: 'discovery', createdAt: String(parsed.createdAt), id: String(parsed.id) };
    }

    throw new Error(`Unsupported cursor type '${parsed.t}'`);
  } catch (err: any) {
    throw AppError.badRequest(`Invalid or malformed pagination cursor: ${err?.message || 'decoding failed'}`);
  }
}

export function buildCursorFilter(
  sort: 'new' | 'top' | 'hot',
  cursorStr?: string
): Filter<PostDoc> | null {
  if (!cursorStr) return null;

  const cursor = decodeCursor(cursorStr, sort);

  if (cursor.t === 'new') {
    const cursorDate = new Date(cursor.createdAt);
    return {
      $or: [
        { created_at: { $lt: cursorDate } },
        { created_at: cursorDate, _id: { $lt: cursor.id } },
      ],
    };
  }

  if (cursor.t === 'top') {
    const cursorDate = new Date(cursor.createdAt);
    return {
      $or: [
        { score: { $lt: cursor.score } },
        { score: cursor.score, created_at: { $lt: cursorDate } },
        { score: cursor.score, created_at: cursorDate, _id: { $lt: cursor.id } },
      ],
    };
  }

  if (cursor.t === 'hot') {
    const cursorDate = new Date(cursor.createdAt);
    return {
      $or: [
        { hot_score: { $lt: cursor.hotScore } },
        { hot_score: cursor.hotScore, created_at: { $lt: cursorDate } },
        { hot_score: cursor.hotScore, created_at: cursorDate, _id: { $lt: cursor.id } },
      ],
    };
  }

  return null;
}

export function encodePostCursor(post: PostDoc, sort: 'new' | 'top' | 'hot'): string {
  const createdAt = post.created_at.toISOString();
  if (sort === 'new') {
    return encodeCursor({ t: 'new', createdAt, id: post._id });
  }
  if (sort === 'top') {
    return encodeCursor({ t: 'top', score: post.score, createdAt, id: post._id });
  }
  return encodeCursor({
    t: 'hot',
    hotScore: post.hot_score ?? calculateHotScore(post.score, post.created_at),
    createdAt,
    id: post._id,
  });
}
