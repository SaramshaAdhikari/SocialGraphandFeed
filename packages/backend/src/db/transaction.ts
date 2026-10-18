import type { ClientSession } from 'mongodb';
import { getMongoClient } from './mongo.js';

/** Atomically apply writes spanning domain documents. MongoDB must be a replica set or sharded cluster. */
export async function runInTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
  const client = getMongoClient();
  if (!client) throw new Error('MongoDB must be connected before starting a transaction.');

  // A concurrent insert may surface as E11000 rather than TransientTransactionError.
  // Retry the whole state transition so a toggle observes the committed state.
  for (let attempt = 0; ; attempt += 1) {
    const session = client.startSession();
    try {
      let result!: T;
      await session.withTransaction(async () => {
        result = await work(session);
      });
      return result;
    } catch (error: any) {
      if (error?.code !== 11000 || attempt >= 2) throw error;
    } finally {
      await session.endSession();
    }
  }
}
