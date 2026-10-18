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
} from 'lucide-react';
import type { DiscussionPostCard, VisualPinCard } from '@socialgraph/shared';
import { useRouter, Link } from '../router/Router';
import { usePostDetail } from '../hooks/usePostDetail';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { VoteControl } from '../components/ui/VoteControl';
import { CommentTree, PostDetailSkeleton } from '../components/post';
import { formatRelativeTime } from '../utils/date';

export function PostDetailPage() {
  const { params, currentPath, navigate } = useRouter();
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

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
  } = usePostDetail(postId);

  // Reliable Back navigation with sensible fallback
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 2) {
      window.history.back();
    } else {
      // Sensible destination fallback
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
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181B22] p-8 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-4">
            <AlertCircle size={28} />
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            Post Not Found
          </h1>
          <p className="mt-2 text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            The post or discussion you are looking for doesn't exist, has been removed, or the link may be broken.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Home size={15} />}
              onClick={() => navigate('/')}
            >
              Return to Home Feed
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Compass size={15} />}
              onClick={() => navigate('/explore')}
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
      className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6"
    >
      {/* Top Breadcrumb & Back Navigation */}
      <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1 py-0.5 -mx-1"
        >
          <ArrowLeft size={16} />
          <span>{isVisual ? 'Back to Discover' : 'Back to Feed'}</span>
        </button>

        {post.community_slug && (
          <Link
            to={`/c/${post.community_slug}`}
            className="text-xs font-semibold text-primary hover:underline bg-primary/10 px-2.5 py-1 rounded-full"
          >
            c/{post.community_slug}
          </Link>
        )}
      </nav>

      {/* ========================================================================= */}
      {/* MODE 1: VISUAL PIN DETAIL (Instagram-Inspired Immersive Layout)            */}
      {/* ========================================================================= */}
      {isVisual && visualPost && (
        <article
          data-testid="visual-post-detail"
          className="bg-white dark:bg-[#181B22] rounded-2xl border border-[#E2E8F0] dark:border-[#2E3544] shadow-sm overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
            {/* Left Column: Immersive Aspect-Ratio Media Box */}
            <div
              className="lg:col-span-7 xl:col-span-8 flex items-center justify-center p-3 sm:p-6 bg-slate-950/5 dark:bg-black/40 relative overflow-hidden"
              style={{
                backgroundColor: visualPost.dominant_color ? `${visualPost.dominant_color}18` : undefined,
              }}
            >
              <div
                className="w-full max-h-[75vh] flex items-center justify-center rounded-xl overflow-hidden shadow-xs"
                style={{
                  aspectRatio: visualPost.media.aspect_ratio || 1.0,
                }}
              >
                <img
                  src={visualPost.media.url}
                  alt={visualPost.media.alt_text || visualPost.title || 'Visual pin'}
                  onLoad={() => setImageLoaded(true)}
                  className={`w-full h-full object-contain max-h-[75vh] rounded-lg transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>
            </div>

            {/* Right Column: Sticky Creator Identity, Actions & Threaded Discussion */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col border-t lg:border-t-0 lg:border-l border-[#E2E8F0] dark:border-[#2E3544] bg-white dark:bg-[#181B22]">
              {/* Creator Header */}
              <div className="p-4 sm:p-5 border-b border-[#F1F5F9] dark:border-[#262B36] flex items-center justify-between gap-3">
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
                      <span className="font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC] group-hover/author:text-primary truncate">
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
                    <span className="text-xs text-[#94A3B8]">@{visualPost.author.username}</span>
                  </div>
                </Link>

                {/* Follow Button */}
                {visualPost.author.username !== 'alex_dev' && (
                  <Button
                    variant={isFollowingAuthor ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={toggleFollowAuthor}
                    className="text-xs px-3 font-semibold"
                  >
                    {isFollowingAuthor ? 'Following' : 'Follow'}
                  </Button>
                )}
              </div>

              {/* Title & Caption */}
              <div className="p-4 sm:p-5 border-b border-[#F1F5F9] dark:border-[#262B36]">
                {visualPost.title && (
                  <h1 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] leading-snug mb-1.5">
                    {visualPost.title}
                  </h1>
                )}
                {visualPost.caption && (
                  <p className="text-sm text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
                    {visualPost.caption}
                  </p>
                )}
                <div className="mt-2.5 flex items-center gap-2 text-xs text-[#94A3B8]">
                  <time dateTime={visualPost.created_at}>
                    {formatRelativeTime(visualPost.created_at)}
                  </time>
                  {visualPost.community_slug && (
                    <>
                      <span>•</span>
                      <Link
                        to={`/c/${visualPost.community_slug}`}
                        className="hover:underline font-medium text-slate-600 dark:text-slate-400"
                      >
                        c/{visualPost.community_slug}
                      </Link>
                    </>
                  )}
                </div>

                {visualPost.destination_url && (
                  <div className="mt-3">
                    <a
                      href={visualPost.destination_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-primary hover:underline hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {visualPost.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Bar (Consistent with API: Voting & Saving) */}
              <div className="px-4 py-3 border-b border-[#F1F5F9] dark:border-[#262B36] flex items-center justify-between">
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Upvote Button */}
                  <Button
                    variant={visualPost.user_vote === 1 ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => votePost(visualPost.user_vote === 1 ? 0 : 1)}
                    className={`h-9 px-3 text-xs font-semibold ${
                      visualPost.user_vote === 1
                        ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                    leftIcon={
                      <Heart
                        size={16}
                        className={visualPost.user_vote === 1 ? 'fill-rose-600 text-rose-600' : ''}
                      />
                    }
                  >
                    <span>{visualPost.score}</span>
                  </Button>

                  {/* Share Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="h-9 px-2.5 text-xs text-slate-600 dark:text-slate-300"
                    leftIcon={copied ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />}
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
                      : 'text-slate-600 dark:text-slate-300'
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
      {/* MODE 2: DISCUSSION POST DETAIL (Reddit-Inspired Readable Layout)          */}
      {/* ========================================================================= */}
      {!isVisual && discussionPost && (
        <article
          data-testid="discussion-post-detail"
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Main Discussion Card */}
          <div className="bg-white dark:bg-[#181B22] rounded-2xl border border-[#E2E8F0] dark:border-[#2E3544] p-4 sm:p-6 shadow-sm">
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
                <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
                  {discussionPost.community_slug && (
                    <>
                      <Link
                        to={`/c/${discussionPost.community_slug}`}
                        className="font-bold text-[#0F172A] dark:text-[#F8FAFC] hover:text-primary hover:underline"
                      >
                        c/{discussionPost.community_slug}
                      </Link>
                      <span className="text-[#CBD5E1] dark:text-[#475569]">•</span>
                    </>
                  )}

                  <Link
                    to={`/u/${discussionPost.author.username}`}
                    className="flex items-center gap-1.5 font-medium text-[#475569] dark:text-[#CBD5E1] hover:text-primary group/author"
                  >
                    <Avatar
                      src={discussionPost.author.avatar_url}
                      alt={discussionPost.author.display_name}
                      size="xs"
                    />
                    <span>Posted by</span>
                    <span className="group-hover/author:underline">u/{discussionPost.author.username}</span>
                  </Link>

                  {discussionPost.author.is_verified && (
                    <span
                      title="Verified"
                      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary text-white text-[9px] font-bold"
                    >
                      ✓
                    </span>
                  )}

                  <span className="text-[#CBD5E1] dark:text-[#475569]">•</span>
                  <time dateTime={discussionPost.created_at} className="text-[#94A3B8]">
                    {formatRelativeTime(discussionPost.created_at)}
                  </time>

                  {discussionPost.flair && (
                    <Badge size="sm" variant="neutral" className="text-[11px] py-0.5 px-2 font-medium">
                      {discussionPost.flair}
                    </Badge>
                  )}

                  {/* Author Follow Action */}
                  {discussionPost.author.username !== 'alex_dev' && (
                    <button
                      type="button"
                      onClick={toggleFollowAuthor}
                      className="ml-auto text-xs font-semibold text-primary hover:underline focus-visible:outline-none"
                    >
                      {isFollowingAuthor ? 'Following' : '+ Follow'}
                    </button>
                  )}
                </div>

                {/* Post Title */}
                <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] leading-snug mb-3">
                  {discussionPost.title}
                </h1>

                {/* Post Longform Content */}
                <div className="text-sm sm:text-base text-[#334155] dark:text-[#CBD5E1] leading-relaxed whitespace-pre-wrap break-words mb-5">
                  {discussionPost.content}
                </div>

                {/* Discussion Tags */}
                {discussionPost.tags && discussionPost.tags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {discussionPost.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Optional Media Attachments */}
                {discussionPost.media && discussionPost.media.length > 0 && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-[#E2E8F0] dark:border-[#2E3544] max-h-[500px] bg-slate-50 dark:bg-[#12141A] flex items-center justify-center">
                    <img
                      src={discussionPost.media[0].url}
                      alt={discussionPost.media[0].alt_text || discussionPost.title}
                      loading="lazy"
                      className="w-full h-auto max-h-[500px] object-contain"
                    />
                  </div>
                )}

                {/* Action Row & Mobile Vote Control */}
                <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9] dark:border-[#262B36] text-xs text-[#64748B] dark:text-[#94A3B8]">
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

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium px-2 py-1">
                      <MessageSquare size={15} />
                      <span>{discussionPost.comments_count} Comments</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      className="h-8 px-2 text-xs text-slate-600 dark:text-slate-300"
                      leftIcon={copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
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
                        : 'text-slate-600 dark:text-slate-300'
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
          <div className="bg-white dark:bg-[#181B22] rounded-2xl border border-[#E2E8F0] dark:border-[#2E3544] p-4 sm:p-6 shadow-sm">
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
