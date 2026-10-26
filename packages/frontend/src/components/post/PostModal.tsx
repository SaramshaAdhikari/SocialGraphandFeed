import { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Share2,
  Check,
  Heart,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  ImageOff,
} from 'lucide-react';
import type { DiscussionPostCard, VisualPinCard, MediaAttachment } from '@socialgraph/shared';
import { usePostModal } from '../../context/PostModalContext';
import { usePostDetail } from '../../hooks/usePostDetail';
import { useAuth } from '../../auth/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { VoteControl } from '../ui/VoteControl';
import { CommentTree } from './CommentTree';
import { CommentComposer } from './CommentComposer';
import { PostDetailSkeleton } from './PostDetailSkeleton';
import { Link } from '../../router/Router';
import { formatRelativeTime } from '../../utils/date';

export function PostModal() {
  const { activeModalPostId, closePostModal } = usePostModal();
  const { user } = useAuth();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const {
    post,
    sortedComments,
    sortOrder,
    setSortOrder,
    loading,
    commentsLoading,
    error,
    isNotFound,
    isFollowingAuthor,
    votePost,
    toggleSavePost,
    toggleFollowAuthor,
    addComment,
    voteComment,
  } = usePostDetail(activeModalPostId || '', {
    currentViewer: user
      ? {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url || '',
          is_verified: false,
        }
      : undefined,
  });

  // Compute media attachments for carousel unconditionally before any effects or returns
  const mediaItems: MediaAttachment[] = useMemo(() => {
    if (!post) return [];
    if (Array.isArray((post as any).media)) {
      return (post as any).media;
    }
    if (post.post_type === 'visual') {
      const pin = post as VisualPinCard;
      return pin.media ? [pin.media] : [];
    }
    const disc = post as DiscussionPostCard;
    return disc.media || [];
  }, [post]);

  const activeMedia = mediaItems[carouselIndex] || mediaItems[0];

  // Reset carousel index when post changes
  useEffect(() => {
    setCarouselIndex(0);
    setImageError(false);
  }, [activeModalPostId]);

  // Focus trap and keyboard controls (Escape to close, Left/Right for carousel)
  useEffect(() => {
    if (!activeModalPostId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePostModal();
        return;
      }

      // Keyboard carousel navigation
      if (e.key === 'ArrowLeft' && mediaItems.length > 1) {
        setCarouselIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight' && mediaItems.length > 1) {
        setCarouselIndex((i) => Math.min(mediaItems.length - 1, i + 1));
      }

      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus into dialog
    const timer = setTimeout(() => {
      const closeBtn = dialogRef.current?.querySelector<HTMLElement>('button[aria-label="Close dialog"]');
      closeBtn?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [activeModalPostId, closePostModal]);

  // Handle Share link copy
  const handleShare = async () => {
    if (!post) return;
    try {
      const shareUrl = `${window.location.origin}/post/${post.id}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!activeModalPostId) return null;

  const isVisual = post?.post_type === 'visual';
  const visualPost = isVisual ? (post as VisualPinCard) : null;
  const discussionPost = !isVisual && post ? (post as DiscussionPostCard) : null;


  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={post ? (post.title || 'Post detail') : 'Post details'}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closePostModal();
        }
      }}
    >
      {/* Modal Surface Container */}
      <div
        ref={dialogRef}
        data-testid="post-modal-dialog"
        className="relative w-full max-w-5xl max-h-[92vh] bg-surface-card border border-border rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col focus:outline-none"
      >
        {/* Top Floating Close Button */}
        <button
          type="button"
          onClick={closePostModal}
          aria-label="Close dialog"
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors cursor-pointer shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X size={18} />
        </button>

        {/* 1. Loading State */}
        {loading && (
          <div className="p-6 sm:p-8 overflow-y-auto max-h-[85vh]">
            <PostDetailSkeleton />
          </div>
        )}

        {/* 2. Error / 404 Not Found State */}
        {!loading && (isNotFound || (!post && error)) && (
          <div className="p-8 sm:p-12 text-center my-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-surface-subtle flex items-center justify-center mx-auto text-text-muted">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Post Not Found</h2>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              This post could not be loaded or may have been deleted.
            </p>
            <Button variant="outline" size="sm" onClick={closePostModal} className="mt-2">
              Close
            </Button>
          </div>
        )}

        {/* 3. Render Post Content */}
        {!loading && post && (
          <>
            {/* ===================================================================== */}
            {/* VARIANT A: VISUAL PIN (Instagram-Inspired Two-Panel Desktop Layout)   */}
            {/* ===================================================================== */}
            {isVisual && visualPost && (
              <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden">
                {/* Left Panel: Media Presentation / Carousel */}
                <div
                  className="lg:col-span-7 xl:col-span-8 relative bg-surface-subtle flex items-center justify-center overflow-hidden min-h-[280px] sm:min-h-[420px] max-h-[50vh] lg:max-h-[92vh] group/media"
                  style={{
                    backgroundColor: visualPost.dominant_color ? `${visualPost.dominant_color}14` : undefined,
                  }}
                >
                  {activeMedia && !imageError ? (
                    <img
                      src={activeMedia.url}
                      alt={activeMedia.alt_text || visualPost.title || 'Visual pin'}
                      onError={() => setImageError(true)}
                      className="w-full h-full object-contain max-h-[50vh] lg:max-h-[92vh] select-none"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-text-muted text-center">
                      <ImageOff size={36} className="mb-2 opacity-50" />
                      <span className="text-xs">Image unavailable</span>
                    </div>
                  )}

                  {/* Carousel Controls if multiple images exist */}
                  {mediaItems.length > 1 && (
                    <>
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/60 text-white text-[11px] font-mono pointer-events-none">
                        {carouselIndex + 1} / {mediaItems.length}
                      </div>
                      <button
                        type="button"
                        aria-label="Previous image"
                        disabled={carouselIndex === 0}
                        onClick={() => setCarouselIndex((i) => Math.max(0, i - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        aria-label="Next image"
                        disabled={carouselIndex === mediaItems.length - 1}
                        onClick={() => setCarouselIndex((i) => Math.min(mediaItems.length - 1, i + 1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}
                </div>

                {/* Right Panel: Author Info, Details, Engagement & Comments */}
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col min-h-0 border-t lg:border-t-0 lg:border-l border-border bg-surface-card">
                  {/* Author Header */}
                  <div className="p-4 border-b border-border/70 flex items-center justify-between gap-3 shrink-0">
                    <Link
                      to={`/u/${visualPost.author.username}`}
                      onClick={closePostModal}
                      className="flex items-center gap-3 min-w-0 group/author"
                    >
                      <Avatar
                        src={visualPost.author.avatar_url}
                        alt={visualPost.author.display_name}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-text-primary group-hover/author:text-primary truncate">
                            {visualPost.author.display_name}
                          </span>
                          {visualPost.author.is_verified && (
                            <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-primary text-white text-[8px] font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-text-muted">@{visualPost.author.username}</span>
                      </div>
                    </Link>

                    {/* Follow button */}
                    {user?.username !== visualPost.author.username && (
                      <Button
                        variant={isFollowingAuthor ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={toggleFollowAuthor}
                        className="text-xs h-7 px-3 rounded-full"
                      >
                        {isFollowingAuthor ? 'Following' : 'Follow'}
                      </Button>
                    )}
                  </div>

                  {/* Scrollable Middle: Post Details & Threaded Comments */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                    {/* Caption & Metadata */}
                    <div className="space-y-2">
                      {visualPost.title && (
                        <h2 className="text-sm sm:text-base font-bold text-text-primary leading-snug">
                          {visualPost.title}
                        </h2>
                      )}

                      {visualPost.caption && (
                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                          {visualPost.caption}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1 text-[11px] text-text-muted">
                        <time dateTime={visualPost.created_at}>
                          {formatRelativeTime(visualPost.created_at)}
                        </time>
                        {visualPost.community_slug && (
                          <>
                            <span>•</span>
                            <Link
                              to={`/c/${visualPost.community_slug}`}
                              onClick={closePostModal}
                              className="font-semibold text-primary hover:underline"
                            >
                              c/{visualPost.community_slug}
                            </Link>
                          </>
                        )}
                        {visualPost.destination_url && (
                          <>
                            <span>•</span>
                            <a
                              href={visualPost.destination_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <ExternalLink size={11} /> Link
                            </a>
                          </>
                        )}
                      </div>

                      {/* Tags */}
                      {visualPost.tags && visualPost.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {visualPost.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[11px] font-medium text-text-muted bg-surface-subtle border border-border px-2 py-0.5 rounded-md"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border/60 pt-3">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                          Comments ({post.comments_count})
                        </h3>
                      </div>

                      {/* Comment Tree */}
                      <CommentTree
                        comments={sortedComments}
                        sortOrder={sortOrder}
                        onSortChange={setSortOrder}
                        loading={commentsLoading}
                        onAddComment={addComment}
                        onVoteComment={voteComment}
                      />
                    </div>
                  </div>

                  {/* Actions Bar & Quick Reply Composer */}
                  <div className="p-3 sm:p-4 border-t border-border/70 bg-surface-card space-y-3 shrink-0">
                    {/* Action Buttons Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => votePost(post.user_vote === 1 ? 0 : 1)}
                          className={`h-8 px-2.5 text-xs ${
                            post.user_vote === 1 ? 'text-primary font-bold' : 'text-text-muted hover:text-text-primary'
                          }`}
                        >
                          <Heart
                            size={16}
                            className={`mr-1.5 ${post.user_vote === 1 ? 'fill-current text-primary' : ''}`}
                          />
                          <span>{post.score}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleShare}
                          className="h-8 px-2 text-xs text-text-muted hover:text-text-primary"
                        >
                          {copied ? (
                            <Check size={15} className="text-emerald-500 mr-1" />
                          ) : (
                            <Share2 size={15} className="mr-1" />
                          )}
                          <span>{copied ? 'Copied' : 'Share'}</span>
                        </Button>
                      </div>

                      <Button
                        variant={post.is_saved ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={toggleSavePost}
                        className={`h-8 px-3 text-xs ${
                          post.is_saved ? 'text-primary bg-primary/10 font-bold' : 'text-text-muted hover:text-text-primary'
                        }`}
                      >
                        <Bookmark
                          size={15}
                          className={`mr-1.5 ${post.is_saved ? 'fill-current text-primary' : ''}`}
                        />
                        <span>{post.is_saved ? 'Saved' : 'Save'}</span>
                      </Button>
                    </div>

                    {/* Inline Comment Composer */}
                    <CommentComposer
                      onSubmit={async (content) => {
                        await addComment(content);
                      }}
                      placeholder="Add a comment..."
                      submitLabel="Post"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* VARIANT B: DISCUSSION POST (Reddit-Inspired Discussion Layout)         */}
            {/* ===================================================================== */}
            {!isVisual && discussionPost && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-5">
                {/* Discussion Header */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted pb-1 border-b border-border/60">
                  {discussionPost.community_slug && (
                    <Link
                      to={`/c/${discussionPost.community_slug}`}
                      onClick={closePostModal}
                      className="font-bold text-text-primary hover:text-primary transition-colors bg-surface-subtle px-2.5 py-0.5 rounded-full border border-border"
                    >
                      c/{discussionPost.community_slug}
                    </Link>
                  )}
                  <span className="text-border-strong">•</span>
                  <Link
                    to={`/u/${discussionPost.author.username}`}
                    onClick={closePostModal}
                    className="flex items-center gap-1.5 font-medium text-text-secondary hover:text-primary"
                  >
                    <Avatar
                      src={discussionPost.author.avatar_url}
                      alt={discussionPost.author.display_name}
                      size="xs"
                    />
                    <span>u/{discussionPost.author.username}</span>
                  </Link>
                  <span className="text-border-strong">•</span>
                  <time dateTime={discussionPost.created_at}>
                    {formatRelativeTime(discussionPost.created_at)}
                  </time>

                  {discussionPost.flair && (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {discussionPost.flair}
                    </span>
                  )}
                </div>

                {/* Discussion Title */}
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary leading-snug">
                  {discussionPost.title}
                </h1>

                {/* Discussion Markdown Body */}
                <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line bg-surface-subtle/50 p-4 rounded-xl border border-border/60">
                  {discussionPost.content}
                </div>

                {/* Multi-Image Carousel if discussion has media attachments */}
                {mediaItems.length > 0 && activeMedia && (
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-surface-subtle max-h-[460px] flex items-center justify-center group/discMedia">
                    <img
                      src={activeMedia.url}
                      alt={activeMedia.alt_text || discussionPost.title}
                      className="max-h-[440px] w-auto h-auto object-contain rounded-xl"
                    />
                    {mediaItems.length > 1 && (
                      <>
                        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 text-[11px] font-mono text-white">
                          {carouselIndex + 1} / {mediaItems.length}
                        </div>
                        <button
                          type="button"
                          aria-label="Previous image"
                          disabled={carouselIndex === 0}
                          onClick={() => setCarouselIndex((i) => Math.max(0, i - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white disabled:opacity-20 cursor-pointer"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label="Next image"
                          disabled={carouselIndex === mediaItems.length - 1}
                          onClick={() => setCarouselIndex((i) => Math.min(mediaItems.length - 1, i + 1))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white disabled:opacity-20 cursor-pointer"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Discussion Action Row */}
                <div className="flex items-center justify-between pt-3 border-t border-border/80 text-xs">
                  <div className="flex items-center gap-3">
                    <VoteControl
                      score={post.score}
                      userVote={post.user_vote}
                      onVote={(dir) => votePost(dir)}
                      orientation="horizontal"
                      size="sm"
                    />
                    <div className="flex items-center gap-1.5 text-text-muted font-medium">
                      <MessageSquare size={15} />
                      <span>{post.comments_count} Comments</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      className="h-8 px-2 text-xs text-text-muted hover:text-text-primary"
                    >
                      {copied ? (
                        <Check size={14} className="text-emerald-500 mr-1" />
                      ) : (
                        <Share2 size={14} className="mr-1" />
                      )}
                      <span>{copied ? 'Copied' : 'Share'}</span>
                    </Button>
                  </div>

                  <Button
                    variant={post.is_saved ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={toggleSavePost}
                    className={`h-8 px-2.5 text-xs ${
                      post.is_saved ? 'text-primary bg-primary/10 font-bold' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <Bookmark
                      size={15}
                      className={`mr-1 ${post.is_saved ? 'fill-current text-primary' : ''}`}
                    />
                    <span>{post.is_saved ? 'Saved' : 'Save'}</span>
                  </Button>
                </div>

                {/* Discussion Comment Tree */}
                <div className="border-t border-border pt-4">
                  <CommentTree
                    comments={sortedComments}
                    sortOrder={sortOrder}
                    onSortChange={setSortOrder}
                    loading={commentsLoading}
                    onAddComment={addComment}
                    onVoteComment={voteComment}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
export default PostModal;
