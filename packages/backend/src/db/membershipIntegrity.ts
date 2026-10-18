import type { Db, MongoClient } from 'mongodb';
import { COLLECTIONS } from './collections.js';
import type { CommunityDoc, CommunityMembershipDoc } from './types.js';

/**
 * Repair only the denormalized community member counters from authoritative
 * membership rows. No membership records are inserted or removed here.
 */
export async function reconcileCommunityMemberCounts(db: Db, client: MongoClient): Promise<number> {
  const session = client.startSession();
  let repairedCount = 0;
  try {
    await session.withTransaction(async () => {
      const communities = await db.collection<CommunityDoc>(COLLECTIONS.COMMUNITIES)
        .find({}, { session })
        .toArray();
      const counts = await db.collection<CommunityMembershipDoc>(COLLECTIONS.COMMUNITY_MEMBERSHIPS)
        .aggregate<{ _id: string; count: number }>([
          { $group: { _id: '$community_id', count: { $sum: 1 } } },
        ], { session })
        .toArray();
      const countByCommunityId = new Map(counts.map((item) => [item._id, item.count]));

      repairedCount = 0;
      for (const community of communities) {
        const expected = countByCommunityId.get(community._id) ?? 0;
        if (community.members_count === expected) continue;
        const result = await db.collection<CommunityDoc>(COLLECTIONS.COMMUNITIES).updateOne(
          { _id: community._id },
          { $set: { members_count: expected } },
          { session }
        );
        repairedCount += result.modifiedCount;
      }
    });
  } finally {
    await session.endSession();
  }
  return repairedCount;
}
