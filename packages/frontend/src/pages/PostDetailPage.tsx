import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Share2,
  Bookmark,
  Check,
  Heart,
  MessageSquare,
  AlertCircle,
  Home,
  Compass,
  ExternalLink,
  ImageOff,
} from 'lucide-react';
import type { DiscussionPostCard, VisualPinCard } from '@socialgraph/shared';
import { useRouter, Link } from '../router/Router';
import { usePostDetail } from '../hooks/usePostDetail';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { VoteControl } from '../components/ui/VoteControl';
import { CommentTree, PostDetailSkeleton } from '../components/post';
import { PostActionMenu } from '../components/feed/PostActionMenu';
import { formatRelativeTime } from '../utils/date';
import { useAuth } from '../auth/AuthContext';

export function PostDetailPage() {
  const { params, currentPath, navigate } = useRouter();
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { user } = useAuth();

  // Extract postId from route params with regex fallback
  const postId = useMemo(() => {
    if (params.postId) return params.postId;
    const match = currentPath.match(/^\/post\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }, [params.postId, currentPath]);

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
  } = usePostDetail(postId, {
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

  // Reliable Back navigation with sensible fallback
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 2) {
      window.history.back();
    } else {
      navigate(post?.post_type === 'visual' ? '/explore' : '/');
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
      if (navigator.clipboard && shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 1. Loading State
  if (loading) {
    return <PostDetailSkeleton />;
  }

  // 2. 404 Not Found State
  if (isNotFound || (!post && error)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center" role="region" aria-label="Post Not Found">
        <div className="rounded-3xl border border-border bg-surface-card p-8 sm:p-12 shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-subtle flex items-center justify-center mx-auto text-text-muted">
            <AlertCircle size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Post Not Found
            </h1>
            <p className="mt-2 text-sm text-text-muted leading-relaxed">
              The post or discussion you are looking for doesn't exist, has been removed, or the link may be broken.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Home size={15} />}
              onClick={() => navigate('/')}
              className="font-semibold"
            >
              Return to Home Feed
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Compass size={15} />}
              onClick={() => navigate('/explore')}
              className="font-semibold"
            >
              Explore Discover
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const isVisual = post.post_type === 'visual';
  const visualPost = isVisual ? (post as VisualPinCard) : null;
  const discussionPost = !isVisual ? (post as DiscussionPostCard) : null;

  return (
    <div
      data-testid="post-detail-page"
      role="region"
      aria-label="Post Detail"
      className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6"
    >
      {/* Top Breadcrumb & Back Navigation */}
      <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl px-2 py-1 -mx-2 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>{isVisual ? 'Back to Discover' : 'Back to Feed'}</span>
        </button>

        {post.community_slug && (
          <Link
            to={`/c/${post.community_slug}`}
            className="text-xs font-bold text-primary hover:underline bg-primary/10 border border-primary/20 px-3 py-1 rounded-full transition-colors"
          >
            c/{post.community_slug}
          </Link>
        )}
      </nav>

      {/* ========================================================================= */}
      {/* MODE 1: VISUAL PIN DETAIL (Instagram-Inspired Immersive Canvas)             */}
      {/* ========================================================================= */}
      {isVisual && visualPost && (
        <article
          data-testid="visual-post-detail"
          className="bg-surface-card rounded-3xl border border-border shadow-xs overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
            {/* Left Column: Immersive Media Box */}
            <div
              className="lg:col-span-7 xl:col-span-8 flex items-center justify-center p-4 sm:p-8 bg-surface-subtle relative overflow-hidden"
              style={{
                backgroundColor: visualPost.dominant_color ? `${visualPost.dominant_color}14` : undefined,
              }}
            >
              <div
                className="w-full max-h-[75vh] flex items-center justify-center rounded-2xl overflow-hidden shadow-xs"
                style={{
                  aspectRatio: visualPost.media.aspect_ratio || 1.0,
                }}
              >
                {!imageError ? (
                  <img
                    src={visualPost.media.url}
                    alt={visualPost.media.alt_text || visualPost.title || 'Visual pin'}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    className={`w-full h-full object-contain max-h-[75vh] rounded-xl transition-all duration-300 ${
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ) : (
                  <div className="w-full h-48 sm:h-64 flex flex-col items-center justify-center text-center text-text-muted bg-surface-card rounded-2xl p-6">
                    <ImageOff size={36} className="mb-2 opacity-60" />
                    <span className="text-sm font-medium">Image preview unavailable</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Sticky Creator Identity, Actions & Threaded Discussion */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col border-t lg:border-t-0 lg:border-l border-border bg-surface-card">
              {/* Creator Header */}
              <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between gap-3">
                <Link
                  to={`/u/${visualPost.author.username}`}
                  className="flex items-center gap-3 min-w-0 group/author"
                >
                  <Avatar
                    src={visualPost.author.avatar_url}
                    alt={visualPost.author.display_name}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-text-primary group-hover/author:text-primary truncate">
                        {visualPost.author.display_name}
                      </span>
                      {visualPost.author.is_verified && (
                        <span
                          title="Verified"
                          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary text-white text-[9px] font-bold"
                        >
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-text-muted">@{visualPost.author.username}</span>
                  </div>
                </Link>

                {/* Follow Button */}
                {(user?.username
                  ? visualPost.author.username !== user.username
                  : visualPost.author.username !== 'alex_dev') && (
                  <Button
                    variant={isFollowingAuthor ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={toggleFollowAuthor}
                    className="text-xs px-3 font-semibold rounded-full"
                  >
                    {isFollowingAuthor ? 'Following' : 'Follow'}
                  </Button>
                )}
              </div>

              {/* Title & Caption */}
              <div className="p-4 sm:p-5 border-b border-border/60 space-y-2">
                {visualPost.title && (
                  <h1 className="text-base sm:text-lg font-bold text-text-primary leading-snug">
                    {visualPost.title}
                  </h1>
                )}
                {visualPost.caption && (
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {visualPost.caption}
                  </p>
                )}
                <div className="pt-1 flex items-center gap-2 text-xs text-text-muted">
                  <time dateTime={visualPost.created_at}>
                    {formatRelativeTime(visualPost.created_at)}
                  </time>
                  {visualPost.community_slug && (
                    <>
                      <span>•</span>
                      <Link
                        to={`/c/${visualPost.community_slug}`}
                        className="hover:underline font-bold text-text-secondary"
                      >
                        c/{visualPost.community_slug}
                      </Link>
                    </>
                  )}
                </div>

                {visualPost.destination_url && (
                  <div className="pt-2">
                    <a
                      href={visualPost.destination_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-subtle text-xs font-semibold text-primary hover:underline hover:border-border border border-transparent transition-colors"
                    >
                      <ExternalLink size={12} />
                      <span className="truncate max-w-[200px]">
                        {(() => {
                          try {
                            return new URL(visualPost.destination_url).hostname;
                          } catch {
                            return visualPost.destination_url;
                          }
                        })()}
                      </span>
                    </a>
                  </div>
                )}

                {visualPost.tags && visualPost.tags.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {visualPost.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center text-[11px] font-semibold text-text-secondary bg-surface-subtle border border-border/60 px-2 py-0.5 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Upvote Button */}
                  <Button
                    variant={visualPost.user_vote === 1 ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => votePost(visualPost.user_vote === 1 ? 0 : 1)}
                    className={`h-9 px-3 text-xs font-semibold ${
                      visualPost.user_vote === 1
                        ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                        : 'text-text-muted hover:text-rose-600'
                    }`}
                    leftIcon={
                      <Heart
                        size={16}
                        className={visualPost.user_vote === 1 ? 'fill-rose-600 text-rose-600' : ''}
                      />
                    }
                  >
                    <span className="font-mono tabular-nums">{visualPost.score}</span>
                  </Button>

                  <PostActionMenu post={visualPost} onPostDeleted={() => navigate('/')} />
                  {/* Share Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="h-9 px-2.5 text-xs text-text-muted hover:text-text-primary"
                    leftIcon={copied ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
                  >
                    <span>{copied ? 'Copied' : 'Share'}</span>
                  </Button>
                </div>

                {/* Bookmark / Save Button */}
                <Button
                  variant={visualPost.is_saved ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={toggleSavePost}
                  className={`h-9 px-3 text-xs font-semibold ${
                    visualPost.is_saved
                      ? 'text-primary bg-primary/10'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                  leftIcon={
                    <Bookmark
                      size={16}
                      className={visualPost.is_saved ? 'fill-primary text-primary' : ''}
                    />
                  }
                >
                  <span>{visualPost.is_saved ? 'Saved' : 'Save'}</span>
                </Button>
              </div>

              {/* Threaded Comments Section */}
              <div className="p-4 sm:p-5 flex-1">
                <CommentTree
                  comments={sortedComments}
                  sortOrder={sortOrder}
                  onSortChange={setSortOrder}
                  onAddComment={addComment}
                  onVoteComment={voteComment}
                  loading={commentsLoading}
                  totalCount={visualPost.comments_count}
                />
              </div>
            </div>
          </div>
        </article>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: DISCUSSION POST DETAIL (Reddit-Inspired Readable Layout)           */}
      {/* ========================================================================= */}
      {!isVisual && discussionPost && (
        <article
          data-testid="discussion-post-detail"
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Main Discussion Card */}
          <div className="bg-surface-card rounded-3xl border border-border p-5 sm:p-7 shadow-xs">
            <div className="flex items-start gap-4">
              {/* Desktop Vertical Vote Rail (Reddit Pattern) */}
              <div className="hidden sm:block shrink-0 pt-1">
                <VoteControl
                  score={discussionPost.score}
                  userVote={discussionPost.user_vote}
                  onVote={votePost}
                  orientation="vertical"
                />
              </div>

              {/* Main Content Body */}
              <div className="flex-1 min-w-0">
                {/* Header Metadata */}
                <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-text-muted">
                  {discussionPost.community_slug && (
                    <>
                      <Link
                        to={`/c/${discussionPost.community_slug}`}
                        className="font-bold text-text-primary hover:text-primary hover:underline bg-surface-subtle border border-border/60 px-2.5 py-0.5 rounded-full"
                      >
                        c/{discussionPost.community_slug}
                      </Link>
                      <span className="text-border-strong">•</span>
                    </>
                  )}

                  <Link
                    to={`/u/${discussionPost.author.username}`}
                    className="flex items-center gap-1.5 font-medium text-text-secondary hover:text-primary group/author"
                  >
                    <Avatar
                      src={discussionPost.author.avatar_url}
                      alt={discussionPost.author.display_name}
                      size="xs"
                    />
                    <span>Posted by</span>
                    <span className="font-semibold text-text-primary group-hover/author:underline">
                      u/{discussionPost.author.username}
                    </span>
                  </Link>

                  {discussionPost.author.is_verified && (
                    <span
                      title="Verified"
                      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary text-white text-[9px] font-bold"
                    >
                      ✓
                    </span>
                  )}

                  <span className="text-border-strong">•</span>
                  <time dateTime={discussionPost.created_at} className="text-text-muted">
                    {formatRelativeTime(discussionPost.created_at)}
                  </time>

                  {discussionPost.flair && (
                    <Badge size="sm" variant="neutral" className="text-[11px] py-0.5 px-2 font-medium">
                      {discussionPost.flair}
                    </Badge>
                  )}

                  {/* Author Follow Action */}
                  {(user?.username
                    ? discussionPost.author.username !== user.username
                    : discussionPost.author.username !== 'alex_dev') && (
                    <button
                      type="button"
                      onClick={toggleFollowAuthor}
                      className="ml-auto text-xs font-bold text-primary hover:underline focus-visible:outline-none cursor-pointer"
                    >
                      {isFollowingAuthor ? 'Following' : '+ Follow'}
                    </button>
                  )}
                </div>

                {/* Post Title */}
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary leading-snug mb-3.5">
                  {discussionPost.title}
                </h1>

                {/* Post Longform Content */}
                <div className="text-sm sm:text-base text-text-secondary leading-relaxed whitespace-pre-wrap break-words mb-5">
                  {discussionPost.content}
                </div>

                {/* Discussion Tags */}
                {discussionPost.tags && discussionPost.tags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {discussionPost.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center text-[11px] font-semibold text-text-secondary bg-surface-subtle border border-border/60 px-2 py-0.5 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Optional Media Attachments */}
                {discussionPost.media && discussionPost.media.length > 0 && (
                  <div className="mb-4 rounded-2xl overflow-hidden border border-border max-h-[500px] bg-surface-subtle flex items-center justify-center">
                    <img
                      src={discussionPost.media[0].url}
                      alt={discussionPost.media[0].alt_text || discussionPost.title}
                      loading="lazy"
                      className="w-full h-auto max-h-[500px] object-contain"
                    />
                  </div>
                )}

                {/* Action Row & Mobile Vote Control */}
                <div className="flex items-center justify-between pt-3.5 border-t border-border/60 text-xs text-text-muted">
                  <div className="flex items-center gap-2">
                    {/* Mobile Vote Control */}
                    <div className="sm:hidden">
                      <VoteControl
                        score={discussionPost.score}
                        userVote={discussionPost.user_vote}
                        onVote={votePost}
                        orientation="horizontal"
                        size="sm"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium px-2 py-1">
                      <MessageSquare size={15} />
                      <span className="font-mono tabular-nums">{discussionPost.comments_count} Comments</span>
                    </div>

                    <PostActionMenu post={discussionPost} onPostDeleted={() => navigate('/')} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      className="h-8 px-2.5 text-xs text-text-muted hover:text-text-primary"
                      leftIcon={copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
                    >
                      <span>{copied ? 'Copied' : 'Share'}</span>
                    </Button>
                  </div>

                  <Button
                    variant={discussionPost.is_saved ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={toggleSavePost}
                    className={`h-8 px-3 text-xs font-semibold ${
                      discussionPost.is_saved
                        ? 'text-primary bg-primary/10'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                    leftIcon={
                      <Bookmark
                        size={14}
                        className={discussionPost.is_saved ? 'fill-primary text-primary' : ''}
                      />
                    }
                  >
                    <span>{discussionPost.is_saved ? 'Saved' : 'Save'}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Threaded Comments Container */}
          <div className="bg-surface-card rounded-3xl border border-border p-5 sm:p-7 shadow-xs">
            <CommentTree
              comments={sortedComments}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
              onAddComment={addComment}
              onVoteComment={voteComment}
              loading={commentsLoading}
              totalCount={discussionPost.comments_count}
            />
          </div>
        </article>
      )}
    </div>
  );
}
export default PostDetailPage;
