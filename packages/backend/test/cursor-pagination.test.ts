import { describe, it, expect } from 'vitest';
import {
  calculateHotScore,
  encodeCursor,
  decodeCursor,
  buildCursorFilter,
  encodePostCursor,
} from '../src/utils/pagination.js';
import type { PostDoc } from '../src/db/types.js';

describe('Cursor-Based Pagination Engine', () => {
  describe('Hot Score Determinism', () => {
    it('computes identical hot score for identical inputs', () => {
      const date = new Date('2026-10-15T12:00:00.000Z');
      const score1 = calculateHotScore(150, date);
      const score2 = calculateHotScore(150, date);
      expect(score1).toBe(score2);
      expect(typeof score1).toBe('number');
    });

    it('ranks higher scores higher when timestamp is equal', () => {
      const date = new Date('2026-10-15T12:00:00.000Z');
      const low = calculateHotScore(10, date);
      const high = calculateHotScore(500, date);
      expect(high).toBeGreaterThan(low);
    });

    it('ranks newer posts higher when score is equal', () => {
      const older = new Date('2026-10-10T12:00:00.000Z');
      const newer = new Date('2026-10-15T12:00:00.000Z');
      const scoreOld = calculateHotScore(100, older);
      const scoreNew = calculateHotScore(100, newer);
      expect(scoreNew).toBeGreaterThan(scoreOld);
    });
  });

  describe('Cursor Encoding and Decoding', () => {
    it('encodes and decodes a "new" cursor round-trip', () => {
      const original = { t: 'new' as const, createdAt: '2026-10-15T12:00:00.000Z', id: 'post_123' };
      const encoded = encodeCursor(original);
      const decoded = decodeCursor(encoded, 'new');
      expect(decoded).toEqual(original);
    });

    it('encodes and decodes a "top" cursor with score round-trip', () => {
      const original = {
        t: 'top' as const,
        score: 420,
        createdAt: '2026-10-15T12:00:00.000Z',
        id: 'post_456',
      };
      const encoded = encodeCursor(original);
      const decoded = decodeCursor(encoded, 'top');
      expect(decoded).toEqual(original);
    });

    it('encodes and decodes a "hot" cursor with hotScore round-trip', () => {
      const original = {
        t: 'hot' as const,
        hotScore: 1952.8412,
        createdAt: '2026-10-15T12:00:00.000Z',
        id: 'post_789',
      };
      const encoded = encodeCursor(original);
      const decoded = decodeCursor(encoded, 'hot');
      expect(decoded).toEqual(original);
    });

    it('throws badRequest when cursor is not valid base64 or JSON', () => {
      expect(() => decodeCursor('not_base64_or_json')).toThrow(/Invalid or malformed pagination cursor/);
      expect(() => decodeCursor('!!!')).toThrow(/Invalid or malformed pagination cursor/);
    });

    it('throws badRequest when cursor sort type does not match expected sort', () => {
      const topCursor = encodeCursor({
        t: 'top',
        score: 100,
        createdAt: '2026-10-15T12:00:00.000Z',
        id: 'post_1',
      });
      expect(() => decodeCursor(topCursor, 'new')).toThrow(/does not match expected sort 'new'/);
    });
  });

  describe('MongoDB Cursor Query Boundaries', () => {
    it('builds a 2-tuple $or boundary for "new" sort (createdAt, _id)', () => {
      const cursor = encodeCursor({
        t: 'new',
        createdAt: '2026-10-15T12:00:00.000Z',
        id: 'post_tie_301',
      });
      const filter = buildCursorFilter('new', cursor);
      expect(filter).toBeDefined();
      expect(filter?.$or).toHaveLength(2);
      expect(filter?.$or?.[0]).toEqual({ created_at: { $lt: new Date('2026-10-15T12:00:00.000Z') } });
      expect(filter?.$or?.[1]).toEqual({
        created_at: new Date('2026-10-15T12:00:00.000Z'),
        _id: { $lt: 'post_tie_301' },
      });
    });

    it('builds a 3-tuple $or boundary for "top" sort (score, createdAt, _id)', () => {
      const cursor = encodeCursor({
        t: 'top',
        score: 50,
        createdAt: '2026-10-15T12:00:00.000Z',
        id: 'post_tie_301',
      });
      const filter = buildCursorFilter('top', cursor);
      expect(filter).toBeDefined();
      expect(filter?.$or).toHaveLength(3);
      expect(filter?.$or?.[0]).toEqual({ score: { $lt: 50 } });
      expect(filter?.$or?.[1]).toEqual({
        score: 50,
        created_at: { $lt: new Date('2026-10-15T12:00:00.000Z') },
      });
      expect(filter?.$or?.[2]).toEqual({
        score: 50,
        created_at: new Date('2026-10-15T12:00:00.000Z'),
        _id: { $lt: 'post_tie_301' },
      });
    });

    it('builds a 3-tuple $or boundary for "hot" sort (hot_score, createdAt, _id)', () => {
      const cursor = encodeCursor({
        t: 'hot',
        hotScore: 1200.5,
        createdAt: '2026-10-15T12:00:00.000Z',
        id: 'post_tie_301',
      });
      const filter = buildCursorFilter('hot', cursor);
      expect(filter).toBeDefined();
      expect(filter?.$or).toHaveLength(3);
      expect(filter?.$or?.[0]).toEqual({ hot_score: { $lt: 1200.5 } });
      expect(filter?.$or?.[1]).toEqual({
        hot_score: 1200.5,
        created_at: { $lt: new Date('2026-10-15T12:00:00.000Z') },
      });
      expect(filter?.$or?.[2]).toEqual({
        hot_score: 1200.5,
        created_at: new Date('2026-10-15T12:00:00.000Z'),
        _id: { $lt: 'post_tie_301' },
      });
    });

    it('encodePostCursor properly selects sort mode payload', () => {
      const mockPost: PostDoc = {
        _id: 'post_test_99',
        post_type: 'discussion',
        author_id: 'usr_0',
        title: 'Test',
        score: 75,
        hot_score: 1500,
        comments_count: 0,
        created_at: new Date('2026-10-15T12:00:00.000Z'),
        updated_at: new Date('2026-10-15T12:00:00.000Z'),
      };

      const newCursor = encodePostCursor(mockPost, 'new');
      expect(decodeCursor(newCursor, 'new')).toEqual({
        t: 'new',
        createdAt: '2026-10-15T12:00:00.000Z',
        id: 'post_test_99',
      });

      const topCursor = encodePostCursor(mockPost, 'top');
      expect(decodeCursor(topCursor, 'top')).toEqual({
        t: 'top',
        score: 75,
        createdAt: '2026-10-15T12:00:00.000Z',
        id: 'post_test_99',
      });

      const hotCursor = encodePostCursor(mockPost, 'hot');
      expect(decodeCursor(hotCursor, 'hot')).toEqual({
        t: 'hot',
        hotScore: 1500,
        createdAt: '2026-10-15T12:00:00.000Z',
        id: 'post_test_99',
      });
    });
  });
});
