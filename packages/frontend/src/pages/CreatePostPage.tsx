import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { useCreatePost } from '../hooks/useCreatePost';
import {
  PostTypeSelector,
  MarkdownEditor,
  VisualPinUploader,
  CommunitySelect,
  TagInput,
} from '../components/composer';
import { Input, Button } from '../components/ui';
import { ArrowLeft, Send, AlertCircle, Info, Sparkles, Clock } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function CreatePostPage() {
  const { navigate } = useRouter();
  const { user, status } = useAuth();
  const {
    postType,
    setPostType,
    title,
    setTitle,
    content,
    setContent,
    communityId,
    setCommunityId,
    tags,
    addTag,
    removeTag,
    imageUrl,
    setImageUrl,
    mediaList,
    addMediaItem,
    removeMediaItem,
    reorderMediaItem,
    setCoverMedia,
    imageAspectRatio,
    setImageAspectRatio,
    imageAlt,
    setImageAlt,
    destinationUrl,
    setDestinationUrl,
    isLocalFile,
    handleLocalFileSelect,
    clearImage,
    imageError,
    setImageError,
    imageLoaded,
    setImageLoaded,
    communities,
    loadingCommunities,
    errors,
    setFieldError,
    submitting,
    submitError,
    rateLimitSeconds,
    isDirty,
    isLiveMode,
    submitPost,
  } = useCreatePost('discussion');

  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const handleBack = () => {
    if (isDirty) {
      setConfirmDiscardOpen(true);
    } else {
      navigate('/');
    }
  };

  const handleConfirmDiscard = () => {
    setConfirmDiscardOpen(false);
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await submitPost();
    if (created && created.id) {
      navigate(`/post/${created.id}`);
    }
  };

  return (
    <div
      role="region"
      aria-label="Create Post"
      data-testid="create-post-page"
      className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6"
    >
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back to feed"
            className="p-2 -ml-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              Create Post
            </h1>
            <p className="text-xs text-text-muted">
              Publish engineering RFCs, distributed systems analyses, or architectural photography.
            </p>
          </div>
        </div>

        {/* Action button in header (desktop) */}
        <div className="hidden sm:flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || Boolean(rateLimitSeconds && rateLimitSeconds > 0) || (isLiveMode && status === 'unauthenticated')}
            leftIcon={<Send size={14} />}
            className="font-semibold shadow-xs"
          >
            {rateLimitSeconds && rateLimitSeconds > 0
              ? `Rate limited (${rateLimitSeconds}s)`
              : submitting
              ? 'Publishing...'
              : (isLiveMode && status === 'unauthenticated')
              ? 'Sign In to Publish'
              : postType === 'discussion'
              ? 'Publish Discussion'
              : 'Publish Pin'}
          </Button>
        </div>
      </div>

      {/* Discard Draft Modal / Confirmation */}
      {confirmDiscardOpen && (
        <div
          role="dialog"
          aria-labelledby="discard-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
        >
          <div className="w-full max-w-md bg-surface-card rounded-2xl border border-border p-6 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertCircle size={22} />
            </div>
            <div>
              <h3 id="discard-title" className="text-base font-bold text-text-primary">
                Discard unsaved changes?
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                You have an active draft. Leaving this page will discard the content you authored.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDiscardOpen(false)}
              >
                Continue Editing
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDiscard}
              >
                Discard Draft
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Format Mode Selector */}
      <section aria-label="Post Type Selection">
        <PostTypeSelector
          activeType={postType}
          onChange={(type) => {
            setPostType(type);
            setFieldError('title', null);
            setFieldError('content', null);
            setFieldError('imageUrl', null);
          }}
          disabled={submitting}
        />
      </section>

      {/* 3. Main Composer Form */}
      <form
        onSubmit={handleSubmit}
        data-testid="create-post-form"
        className="bg-surface-card rounded-3xl border border-border p-5 sm:p-8 shadow-xs space-y-6 transition-colors"
      >
        {/* Error notification banner */}
        {rateLimitSeconds && rateLimitSeconds > 0 ? (
          <div
            role="alert"
            data-testid="rate-limit-banner"
            className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400"
          >
            <Clock size={18} className="shrink-0 text-amber-500 mt-0.5" />
            <div>
              <p className="font-bold">Rate Limit Exceeded</p>
              <p className="mt-0.5 leading-relaxed">
                Posting frequency limit reached. Please wait {rateLimitSeconds} seconds before attempting to publish again. Your draft has been preserved.
              </p>
            </div>
          </div>
        ) : submitError ? (
          <div
            role="alert"
            data-testid="submit-error-banner"
            className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300"
          >
            <AlertCircle size={18} className="shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-bold">Publishing Error</p>
              <p className="mt-0.5 leading-relaxed">{submitError}</p>
            </div>
          </div>
        ) : null}

        {/* Community Destination Select */}
        <CommunitySelect
          communities={communities}
          selectedCommunityId={communityId}
          onSelect={setCommunityId}
          loading={loadingCommunities}
          error={errors.communityId}
        />

        {/* Post Title */}
        <div>
          <Input
            id="post-title"
            label={postType === 'discussion' ? 'Discussion Title' : 'Pin Title'}
            required
            placeholder={
              postType === 'discussion'
                ? 'An intuitive title explaining the engineering problem, telemetry insight, or RFC...'
                : 'Title describing this visual pin (e.g. Immersion Cooling Chamber for NVLink GPU Compute)'
            }
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setFieldError('title', null);
            }}
            error={errors.title}
            disabled={submitting || (isLiveMode && status === 'unauthenticated')}
            maxLength={postType === 'discussion' ? 300 : 150}
            helperText={`${title.length} / ${postType === 'discussion' ? 300 : 150} characters`}
          />
        </div>

        {/* Conditional Content: Discussion Markdown vs Visual Pin Uploader */}
        {postType === 'discussion' ? (
          <section id="panel-discussion" aria-labelledby="tab-discussion">
            <MarkdownEditor
              value={content}
              onChange={(val) => {
                setContent(val);
                if (errors.content) setFieldError('content', null);
              }}
              error={errors.content}
            />
          </section>
        ) : (
          <section id="panel-visual" aria-labelledby="tab-visual">
            <VisualPinUploader
              imageUrl={imageUrl}
              onImageUrlChange={(url) => {
                setImageUrl(url);
                if (errors.imageUrl) setFieldError('imageUrl', null);
              }}
              mediaList={mediaList}
              onAddMediaItem={addMediaItem}
              onRemoveMediaItem={removeMediaItem}
              onReorderMediaItem={reorderMediaItem}
              onSetCover={setCoverMedia}
              aspectRatio={imageAspectRatio}
              onAspectRatioChange={setImageAspectRatio}
              imageAlt={imageAlt}
              onImageAltChange={setImageAlt}
              destinationUrl={destinationUrl}
              onDestinationUrlChange={(url) => {
                setDestinationUrl(url);
                if (errors.destinationUrl) setFieldError('destinationUrl', null);
              }}
              caption={content}
              onCaptionChange={setContent}
              isLocalFile={isLocalFile}
              onLocalFileSelect={handleLocalFileSelect}
              onClearImage={clearImage}
              imageError={imageError}
              onImageErrorChange={setImageError}
              imageLoaded={imageLoaded}
              onImageLoadedChange={setImageLoaded}
              error={errors.imageUrl}
              destinationUrlError={errors.destinationUrl}
              isLiveMode={isLiveMode}
            />
          </section>
        )}

        {/* Tags / Flair input */}
        <TagInput
          tags={tags}
          onAddTag={addTag}
          onRemoveTag={removeTag}
        />

        {/* Informational Persistence Notice */}
        {isLiveMode && status === 'unauthenticated' ? (
          <div
            role="alert"
            data-testid="create-post-auth-warning"
            className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300"
          >
            <AlertCircle size={18} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1.5">
              <p className="font-bold text-amber-900 dark:text-amber-200">
                Sign-In Required for Live Mode
              </p>
              <p className="leading-relaxed">
                You are currently browsing SocialGraph in live database mode as a guest. Please sign in or register to publish posts to the local MongoDB database.
              </p>
              <div className="pt-1 flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => navigate('/login')}
                  className="text-xs h-7 px-3 font-semibold"
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/register')}
                  className="text-xs h-7 px-3 font-semibold"
                >
                  Register
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-surface-subtle border border-border text-[11px] text-text-muted">
            <Info size={15} className="shrink-0 text-primary mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <p className="font-semibold text-text-primary">
                {isLiveMode ? 'Live Database Persistence' : 'In-Memory Demonstration Persistence'}
              </p>
              <p>
                {isLiveMode ? (
                  <>
                    Your post will be safely committed to the native MongoDB replica set under your author session (<code className="text-primary font-mono">u/{user?.username || 'user'}</code>) and immediately surfaced across feed queries.
                  </>
                ) : (
                  <>
                    Your post will immediately be indexed in the client model, surfaced in your personal profile feed (<code className="text-primary font-mono">u/{user?.username || 'alex_dev'}</code>), aggregated into the selected community feed, and accessible at its dedicated post detail URL.
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={submitting || Boolean(rateLimitSeconds && rateLimitSeconds > 0) || (isLiveMode && status === 'unauthenticated')}
            leftIcon={submitting || (rateLimitSeconds && rateLimitSeconds > 0) ? undefined : <Sparkles size={15} />}
            className="w-full sm:w-auto min-w-[160px] font-semibold"
          >
            {rateLimitSeconds && rateLimitSeconds > 0
              ? `Rate limited (${rateLimitSeconds}s)`
              : submitting
              ? 'Publishing...'
              : (isLiveMode && status === 'unauthenticated')
              ? 'Sign In to Publish'
              : postType === 'discussion'
              ? 'Publish Discussion'
              : 'Publish Visual Pin'}
          </Button>
        </div>
      </form>
    </div>
  );
}
