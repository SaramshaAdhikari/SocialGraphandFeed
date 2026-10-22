import type { Db, Filter } from 'mongodb';
import {
  AppError,
  type CreateReportInput,
  type ReportResponse,
  type ReportsListQuery,
  type ReportsListResponse,
  type AdminResolveReportInput,
} from '@socialgraph/shared';
import { getDb } from '../db/mongo.js';
import { runInTransaction } from '../db/transaction.js';
import { COLLECTIONS } from '../db/collections.js';
import type { ReportDoc, PostDoc, CommentDoc, UserDoc } from '../db/types.js';
import { encodeCursor, decodeCursor } from '../utils/pagination.js';
import type { PostService } from './PostService.js';

function toReportResponse(doc: ReportDoc): ReportResponse {
  return {
    id: doc._id,
    reporter_id: doc.reporter_id,
    target_type: doc.target_type,
    target_id: doc.target_id,
    reason: doc.reason,
    description: doc.description,
    status: doc.status,
    action_taken: doc.action_taken,
    resolved_by: doc.resolved_by,
    resolved_at: doc.resolved_at?.toISOString(),
    created_at: doc.created_at.toISOString(),
  };
}

export class ModerationService {
  private get db(): Db {
    return getDb();
  }

  public async createReport(
    reporterId: string,
    input: CreateReportInput
  ): Promise<ReportResponse> {
    const reportsCol = this.db.collection<ReportDoc>(COLLECTIONS.REPORTS);
    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const commentsCol = this.db.collection<CommentDoc>(COLLECTIONS.COMMENTS);
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);

    // 1. Verify existence of target and prevent self-reporting
    if (input.target_type === 'post') {
      const post = await postsCol.findOne({ _id: input.target_id });
      if (!post) {
        throw AppError.notFound(`Reported post with ID ${input.target_id} was not found`);
      }
      if (post.author_id === reporterId) {
        throw AppError.badRequest('You cannot report your own post');
      }
    } else if (input.target_type === 'comment') {
      const comment = await commentsCol.findOne({ _id: input.target_id });
      if (!comment) {
        throw AppError.notFound(`Reported comment with ID ${input.target_id} was not found`);
      }
      if (comment.author_id === reporterId) {
        throw AppError.badRequest('You cannot report your own comment');
      }
    } else if (input.target_type === 'user') {
      const user = await usersCol.findOne({ _id: input.target_id });
      if (!user) {
        throw AppError.notFound(`Reported user with ID ${input.target_id} was not found`);
      }
      if (user._id === reporterId) {
        throw AppError.badRequest('You cannot report yourself');
      }
    }

    // 2. Prevent duplicate report by the same user
    const existing = await reportsCol.findOne({
      reporter_id: reporterId,
      target_type: input.target_type,
      target_id: input.target_id,
    });
    if (existing) {
      throw AppError.conflict(`You have already submitted a report for this ${input.target_type}`);
    }

    // 3. Persist report document
    const now = new Date();
    const reportDoc: ReportDoc = {
      _id: `rpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      reporter_id: reporterId,
      target_type: input.target_type,
      target_id: input.target_id,
      reason: input.reason,
      description: input.description,
      status: 'pending',
      action_taken: 'none',
      created_at: now,
      updated_at: now,
    };

    try {
      await reportsCol.insertOne(reportDoc);
    } catch (err: any) {
      if (err?.code === 11000) {
        throw AppError.conflict(`You have already submitted a report for this ${input.target_type}`);
      }
      throw err;
    }

    return toReportResponse(reportDoc);
  }

  public async getReports(query: ReportsListQuery): Promise<ReportsListResponse> {
    const reportsCol = this.db.collection<ReportDoc>(COLLECTIONS.REPORTS);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);

    const filter: Filter<ReportDoc> = {};
    if (query.status) {
      filter.status = query.status;
    } else {
      filter.status = 'pending';
    }

    if (query.target_type) {
      filter.target_type = query.target_type;
    }

    if (query.cursor) {
      const decoded = decodeCursor(query.cursor, 'new');
      if (decoded?.createdAt && decoded?.id) {
        const cursorDate = new Date(decoded.createdAt);
        filter.$or = [
          { created_at: { $lt: cursorDate } },
          { created_at: cursorDate, _id: { $lt: decoded.id } },
        ];
      }
    }

    const docs = await reportsCol
      .find(filter)
      .sort({ created_at: -1, _id: -1 })
      .limit(limit + 1)
      .toArray();

    const hasMore = docs.length > limit;
    const pageDocs = hasMore ? docs.slice(0, limit) : docs;

    const data = pageDocs.map(toReportResponse);
    const nextCursor =
      hasMore && pageDocs.length > 0
        ? encodeCursor({
            t: 'new',
            createdAt: pageDocs[pageDocs.length - 1].created_at.toISOString(),
            id: pageDocs[pageDocs.length - 1]._id,
          })
        : null;

    return {
      data,
      total_count: data.length,
      next_cursor: nextCursor,
      has_more: hasMore,
    };
  }

  public async resolveReport(
    adminUserId: string,
    reportId: string,
    input: AdminResolveReportInput,
    postService: PostService
  ): Promise<ReportResponse> {
    const reportsCol = this.db.collection<ReportDoc>(COLLECTIONS.REPORTS);
    const commentsCol = this.db.collection<CommentDoc>(COLLECTIONS.COMMENTS);

    // 1. Validate against contradictory status and action
    if (input.action === 'remove_content' && input.status === 'dismissed') {
      throw AppError.badRequest('Cannot remove content when dismissing a report');
    }

    let postIdToInvalidate: string | null = null;
    let authorUsernameToInvalidate: string | null = null;

    // Run the entire report resolution and content cascade atomically in a single multi-document transaction
    const resolvedDoc = await runInTransaction(async (session) => {
      // 2. Fetch report inside session snapshot
      const report = await reportsCol.findOne({ _id: reportId }, { session });
      if (!report) {
        throw AppError.notFound(`Report with ID ${reportId} was not found`);
      }

      // Guard against repeated moderation actions
      if (report.status !== 'pending') {
        throw AppError.conflict(`Report with ID ${reportId} has already been ${report.status}`);
      }

      let actionTaken: 'none' | 'removed' | 'dismissed' = 'none';

      // 3. If admin requested removal of the reported content
      if (input.action === 'remove_content') {
        if (report.target_type === 'user') {
          throw AppError.badRequest('Content removal action is only supported for post and comment targets, not user entities.');
        }
        if (report.target_type === 'post') {
          postIdToInvalidate = report.target_id;
          try {
            const delRes = await postService.deletePost(report.target_id, adminUserId, true, session);
            if (delRes.author_username) {
              authorUsernameToInvalidate = delRes.author_username;
            }
            actionTaken = 'removed';
          } catch (err: any) {
            // If post was already deleted, still mark action taken as removed
            if (err?.statusCode === 404) {
              actionTaken = 'removed';
            } else {
              throw err;
            }
          }
        } else if (report.target_type === 'comment') {
          try {
            const comment = await commentsCol.findOne({ _id: report.target_id }, { session });
            if (comment) {
              postIdToInvalidate = comment.post_id;
              await postService.deleteComment(comment.post_id, report.target_id, adminUserId, true, session);
            }
            actionTaken = 'removed';
          } catch (err: any) {
            if (err?.statusCode === 404) {
              actionTaken = 'removed';
            } else {
              throw err;
            }
          }
        }
      } else if (input.status === 'dismissed') {
        actionTaken = 'dismissed';
      }

      // 4. Update the report document inside the same transaction
      const now = new Date();
      const updated = await reportsCol.findOneAndUpdate(
        { _id: reportId, status: 'pending' },
        {
          $set: {
            status: input.status,
            action_taken: actionTaken,
            resolved_by: adminUserId,
            resolved_at: now,
            updated_at: now,
          },
        },
        { returnDocument: 'after', session }
      );

      if (!updated) {
        const existing = await reportsCol.findOne({ _id: reportId }, { session });
        if (!existing) {
          throw AppError.notFound(`Report with ID ${reportId} was not found`);
        }
        // If deletePost or deleteComment above already resolved this report within the session on behalf of this admin:
        if (
          input.action === 'remove_content' &&
          existing.status === 'resolved' &&
          existing.action_taken === 'removed' &&
          existing.resolved_by === adminUserId
        ) {
          return existing;
        }
        throw AppError.conflict(`Report with ID ${reportId} has already been ${existing.status}`);
      }

      return updated;
    });

    // 5. Post-commit cache invalidation
    if (postIdToInvalidate) {
      await postService.invalidatePostCache(postIdToInvalidate);
    }
    if (authorUsernameToInvalidate) {
      await postService.invalidateAuthorCache(authorUsernameToInvalidate);
    }

    return toReportResponse(resolvedDoc);
  }
}
