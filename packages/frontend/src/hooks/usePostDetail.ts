import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { PostCard, CommentNode, UserSummary } from '@socialgraph/shared';
import type { ISocialGraphApi } from '../api/types';
import { api as defaultApi } from '../api';
import { ApiClientError } from '../api/client';

export type CommentSortOrder = 'top' | 'new' | 'old';

export interface UsePostDetailOptions {
  apiInstance?: ISocialGraphApi;
  currentViewer?: UserSummary;
}

export interface UsePostDetailReturn {
  post: PostCard | null;
  comments: CommentNode[];
  sortedComments: CommentNode[];
  sortOrder: CommentSortOrder;
  setSortOrder: (order: CommentSortOrder) => void;
  loading: boolean;
  commentsLoading: boolean;
  error: Error | null;
  isNotFound: boolean;
  submittingComment: boolean;
  isFollowingAuthor: boolean;
  votePost: (direction: 1 | -1 | 0) => Promise<void>;
  toggleSavePost: () => Promise<void>;
  toggleFollowAuthor: () => Promise<void>;
  addComment: (content: string, parentId?: string | null) => Promise<CommentNode | null>;
  voteComment: (commentId: string, direction: 1 | -1 | 0) => void;
  refresh: () => Promise<void>;
}

const GUEST_VIEWER: UserSummary = {
  id: '',
  username: '',
  display_name: 'Guest',
  avatar_url: '',
  is_verified: false,
};

export function usePostDetail(
  postId: string,
  options: UsePostDetailOptions = {}
): UsePostDetailReturn {
  const { apiInstance = defaultApi, currentViewer = GUEST_VIEWER } = options;

  const [post, setPost] = useState<PostCard | null>(null);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [sortOrder, setSortOrder] = useState<CommentSortOrder>('top');
  const [loading, setLoading] = useState<boolean>(true);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState<boolean>(false);

  const fetchTokenRef = useRef(0);

  const loadPostAndComments = useCallback(async () => {
    if (!postId) {
      setIsNotFound(true);
      setLoading(false);
      return;
    }

    const token = ++fetchTokenRef.current;
    setLoading(true);
    setCommentsLoading(true);
    setError(null);
    setIsNotFound(false);

    try {
      // 1. Fetch the post entity
      const fetchedPost = await apiInstance.getPost(postId);
      if (token !== fetchTokenRef.current) return;
      setPost(fetchedPost);
      setLoading(false);

      // Check author follow state if different user
      if (fetchedPost.author.username && fetchedPost.author.username !== currentViewer.username) {
        apiInstance
          .getUserProfile(fetchedPost.author.username)
          .then((p) => {
            if (token === fetchTokenRef.current && p) {
              setIsFollowingAuthor(Boolean(p.is_following));
            }
          })
          .catch(() => {});
      }

      // 2. Fetch comments for this post
      try {
        const fetchedComments = await apiInstance.getComments(postId);
        if (token === fetchTokenRef.current) {
          setComments(fetchedComments);
        }
      } catch (cErr) {
        // Fallback to empty comments if comments fail
        if (token === fetchTokenRef.current) {
          setComments([]);
        }
      } finally {
        if (token === fetchTokenRef.current) {
          setCommentsLoading(false);
        }
      }
    } catch (err: any) {
      if (token !== fetchTokenRef.current) return;

      if (
        (err instanceof ApiClientError && (err.problem.status === 404 || err.problem.code === 'POST_NOT_FOUND')) ||
        err?.message?.includes('not found') ||
        err?.status === 404
      ) {
        setIsNotFound(true);
      }
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
      setCommentsLoading(false);
    }
  }, [postId, apiInstance, currentViewer.username]);

  useEffect(() => {
    loadPostAndComments();
  }, [loadPostAndComments]);

  // Deterministic sorting of top-level comments while preserving recursive thread structure
  const sortedComments = useMemo(() => {
    const clone = [...comments];
    if (sortOrder === 'top') {
      clone.sort((a, b) => b.score - a.score || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortOrder === 'new') {
      clone.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortOrder === 'old') {
      clone.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    return clone;
  }, [comments, sortOrder]);

  // Optimistic post voting with rollback
  const votePost = useCallback(
    async (direction: 1 | -1 | 0) => {
      if (!post) return;
      const previousPost = { ...post };

      let delta = 0;
      if (post.user_vote === 1) delta -= 1;
      if (post.user_vote === -1) delta += 1;
      if (direction === 1) delta += 1;
      if (direction === -1) delta -= 1;

      // Optimistic update
      setPost((prev) =>
        prev
          ? {
              ...prev,
              score: prev.score + delta,
              user_vote: direction,
            }
          : null
      );

      try {
        const res = await apiInstance.votePost(post.id, direction);
        setPost((prev) =>
          prev
            ? {
                ...prev,
                score: res.new_score,
                user_vote: res.user_vote,
              }
            : null
        );
      } catch (err) {
        // Rollback
        setPost(previousPost);
        throw err;
      }
    },
    [post, apiInstance]
  );

  // Optimistic post save/bookmark with rollback
  const toggleSavePost = useCallback(async () => {
    if (!post) return;
    const previousSaved = post.is_saved;

    setPost((prev) => (prev ? { ...prev, is_saved: !previousSaved } : null));

    try {
      const res = await apiInstance.toggleSavePost(post.id);
      setPost((prev) => (prev ? { ...prev, is_saved: res.is_saved } : null));
    } catch (err) {
      setPost((prev) => (prev ? { ...prev, is_saved: previousSaved } : null));
      throw err;
    }
  }, [post, apiInstance]);

  // Optimistic author follow toggle with rollback
  const toggleFollowAuthor = useCallback(async () => {
    if (!post) return;
    const prev = isFollowingAuthor;
    setIsFollowingAuthor(!prev);

    try {
      const res = await apiInstance.toggleFollow(post.author.id);
      setIsFollowingAuthor(res.is_following);
    } catch (err) {
      setIsFollowingAuthor(prev);
      throw err;
    }
  }, [post, isFollowingAuthor, apiInstance]);

  // Optimistic comment creation with rollback
  const addComment = useCallback(
    async (content: string, parentId?: string | null): Promise<CommentNode | null> => {
      if (!post || !content.trim()) return null;

      const tempId = `cmt_temp_${Date.now()}`;
      const optimisticNode: CommentNode = {
        id: tempId,
        post_id: post.id,
        parent_id: parentId || null,
        author: currentViewer,
        content: content.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        score: 1,
        user_vote: 1,
        depth: 0,
        replies: [],
      };

      const previousComments = [...comments];
      const previousCount = post.comments_count;

      // Helper to recursively insert child reply
      const insertReply = (nodes: CommentNode[]): boolean => {
        for (const n of nodes) {
          if (n.id === parentId) {
            optimisticNode.depth = Math.min(n.depth + 1, 10);
            n.replies = [...n.replies, optimisticNode];
            return true;
          }
          if (n.replies.length > 0 && insertReply(n.replies)) {
            return true;
          }
        }
        return false;
      };

      if (!parentId) {
        setComments((prev) => [optimisticNode, ...prev]);
      } else {
        const cloned = JSON.parse(JSON.stringify(comments));
        insertReply(cloned);
        setComments(cloned);
      }

      setPost((prev) => (prev ? { ...prev, comments_count: prev.comments_count + 1 } : null));
      setSubmittingComment(true);

      try {
        const confirmedNode = await apiInstance.createComment(post.id, {
          content: content.trim(),
          parent_id: parentId || null,
        });

        // Replace temp node with confirmed node in tree
        const replaceNode = (nodes: CommentNode[]): boolean => {
          for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === tempId) {
              nodes[i] = confirmedNode;
              return true;
            }
            if (nodes[i].replies.length > 0 && replaceNode(nodes[i].replies)) {
              return true;
            }
          }
          return false;
        };

        setComments((prev) => {
          const next = JSON.parse(JSON.stringify(prev));
          replaceNode(next);
          return next;
        });

        return confirmedNode;
      } catch (err) {
        // Rollback
        setComments(previousComments);
        setPost((prev) => (prev ? { ...prev, comments_count: previousCount } : null));
        throw err;
      } finally {
        setSubmittingComment(false);
      }
    },
    [post, comments, currentViewer, apiInstance]
  );

  // Local comment voting for immediate feedback
  const voteComment = useCallback((commentId: string, direction: 1 | -1 | 0) => {
    const updateRecursive = (nodes: CommentNode[]): boolean => {
      for (const node of nodes) {
        if (node.id === commentId) {
          let delta = 0;
          if (node.user_vote === 1) delta -= 1;
          if (node.user_vote === -1) delta += 1;
          if (direction === 1) delta += 1;
          if (direction === -1) delta -= 1;

          node.score += delta;
          node.user_vote = direction;
          return true;
        }
        if (node.replies.length > 0 && updateRecursive(node.replies)) {
          return true;
        }
      }
      return false;
    };

    setComments((prev) => {
      const cloned = JSON.parse(JSON.stringify(prev));
      updateRecursive(cloned);
      return cloned;
    });
  }, []);

  return {
    post,
    comments,
    sortedComments,
    sortOrder,
    setSortOrder,
    loading,
    commentsLoading,
    error,
    isNotFound,
    submittingComment,
    isFollowingAuthor,
    votePost,
    toggleSavePost,
    toggleFollowAuthor,
    addComment,
    voteComment,
    refresh: loadPostAndComments,
  };
}
