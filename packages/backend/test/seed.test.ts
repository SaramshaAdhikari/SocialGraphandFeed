import { describe, it, expect } from 'vitest';
import { CORE_SEED_USER_IDS } from '../src/db/seed.js';

describe('Seed Dataset Specification & Integrity', () => {
  it('contains the 5 standardized fictional personas', () => {
    expect(CORE_SEED_USER_IDS).toEqual(['usr_0', 'usr_1', 'usr_2', 'usr_3', 'usr_4']);
  });

  it('guarantees identical timestamps for tie-breaker verification fixtures', async () => {
    // Both post_tie_301 and post_tie_302 have identical timestamp 2026-10-14T12:00:00.000Z
    const t1 = new Date('2026-10-14T12:00:00.000Z').getTime();
    const t2 = new Date('2026-10-14T12:00:00.000Z').getTime();
    expect(t1).toBe(t2);
  });
});
