import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  X,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  ArrowRight,
  Star,
} from 'lucide-react';
import type { MediaAttachment } from '@socialgraph/shared';
import { Input, Button } from '../ui';

export interface VisualPinUploaderProps {
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  mediaList?: MediaAttachment[];
  onAddMediaItem?: (item: { url: string; aspect_ratio?: number; alt_text?: string }) => void;
  onRemoveMediaItem?: (index: number) => void;
  onReorderMediaItem?: (from: number, to: number) => void;
  onSetCover?: (index: number) => void;
  aspectRatio: number;
  onAspectRatioChange: (ratio: number) => void;
  imageAlt: string;
  onImageAltChange: (alt: string) => void;
  destinationUrl: string;
  onDestinationUrlChange: (url: string) => void;
  caption: string;
  onCaptionChange: (caption: string) => void;
  isLocalFile: boolean;
  onLocalFileSelect: (file: File) => void;
  onClearImage: () => void;
  imageError: boolean;
  onImageErrorChange: (err: boolean) => void;
  imageLoaded: boolean;
  onImageLoadedChange: (loaded: boolean) => void;
  error?: string;
  destinationUrlError?: string;
  isLiveMode?: boolean;
}

export function VisualPinUploader({
  imageUrl,
  onImageUrlChange,
  mediaList = [],
  onAddMediaItem,
  onRemoveMediaItem,
  onReorderMediaItem,
  onSetCover,
  aspectRatio,
  onAspectRatioChange,
  imageAlt,
  onImageAltChange,
  destinationUrl,
  onDestinationUrlChange,
  caption,
  onCaptionChange,
  isLocalFile,
  onLocalFileSelect,
  onClearImage,
  imageError,
  onImageErrorChange,
  imageLoaded,
  onImageLoadedChange,
  error,
  destinationUrlError,
  isLiveMode = false,
}: VisualPinUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadAttempted, setLoadAttempted] = useState(Boolean(imageUrl));
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [previewIndex, setPreviewIndex] = useState(0);

  // Compute items to preview: either mediaList if populated, or fallback to single imageUrl
  const effectiveItems: { url: string; aspect_ratio?: number; alt_text?: string }[] =
    mediaList.length > 0
      ? mediaList
      : imageUrl
      ? [{ url: imageUrl, aspect_ratio: aspectRatio, alt_text: imageAlt }]
      : [];

  const safePreviewIndex = Math.min(Math.max(0, previewIndex), Math.max(0, effectiveItems.length - 1));
  const activeItem = effectiveItems[safePreviewIndex];

  const handleUrlChange = (val: string) => {
    onImageUrlChange(val);
    setLoadAttempted(Boolean(val.trim()));
    onImageErrorChange(false);
    onImageLoadedChange(false);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalHeight > 0) {
      const naturalRatio = parseFloat((img.naturalWidth / img.naturalHeight).toFixed(3));
      onAspectRatioChange(naturalRatio);
      onImageLoadedChange(true);
      onImageErrorChange(false);
    }
  };

  const handleImageError = () => {
    onImageErrorChange(true);
    onImageLoadedChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLocalFileSelect(file);
      setLoadAttempted(true);
    }
  };

  const handleAddAdditionalUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaUrl.trim()) return;
    try {
      const u = new URL(newMediaUrl.trim());
      if (!['http:', 'https:'].includes(u.protocol)) return;
    } catch {
      return;
    }

    if (onAddMediaItem) {
      onAddMediaItem({
        url: newMediaUrl.trim(),
        aspect_ratio: 1.0,
        alt_text: imageAlt || '',
      });
      setNewMediaUrl('');
      setPreviewIndex(mediaList.length);
    }
  };

  return (
    <div className="w-full space-y-5 text-left">
      {/* 1. Image Source Selection: URL or Local File Upload */}
      <div>
        <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
          Visual Media <span className="text-red-500">*</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div className="sm:col-span-2">
            <Input
              type="url"
              placeholder="Paste direct image URL (e.g. https://images.unsplash.com/...)"
              value={imageUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              disabled={isLocalFile}
              leftIcon={<LinkIcon size={16} />}
              rightIcon={
                imageUrl && !isLocalFile ? (
                  <button
                    type="button"
                    onClick={onClearImage}
                    aria-label="Clear image URL"
                    className="text-text-muted hover:text-text-primary"
                  >
                    <X size={14} />
                  </button>
                ) : undefined
              }
              error={error}
            />
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              data-testid="local-file-input"
            />
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={isLiveMode}
              title={isLiveMode ? 'Local file upload requires cloud media storage which is not configured in live mode.' : undefined}
              onClick={() => {
                if (!isLiveMode) {
                  fileInputRef.current?.click();
                }
              }}
              className="w-full h-10 gap-2 border-dashed font-semibold"
            >
              <Upload size={15} />
              <span>{isLiveMode ? 'Browse (N/A in Live)' : isLocalFile ? 'Change File' : 'Browse File'}</span>
            </Button>
          </div>
        </div>

        {/* Live mode notice */}
        {isLiveMode && (
          <p className="text-[11px] text-text-muted mb-3">
            <span className="font-semibold text-amber-600 dark:text-amber-400">Live Mode Active:</span> Direct image URL is required. Local file uploads require cloud media storage which is not configured.
          </p>
        )}

        {/* Local file notice */}
        {isLocalFile && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="shrink-0" />
              <span>Local browser preview loaded. (Temporary session memory; not permanently uploaded to cloud storage).</span>
            </div>
            <button
              type="button"
              onClick={onClearImage}
              aria-label="Remove local file"
              className="p-1 text-primary hover:text-primary/70 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Image loading failure alert */}
        {imageError && loadAttempted && (
          <div
            role="alert"
            data-testid="image-error-alert"
            className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 mb-3"
          >
            <AlertCircle size={16} className="shrink-0" />
            <span>Could not load image from this URL. Please check the address or choose another image.</span>
          </div>
        )}

        {/* Multi-Image Addition Sub-form */}
        {onAddMediaItem && mediaList.length > 0 && mediaList.length < 10 && (
          <div className="p-3 rounded-xl bg-surface-subtle border border-border mb-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-text-secondary font-semibold">
              <span className="flex items-center gap-1.5">
                <Plus size={14} className="text-primary" />
                Add More Images ({mediaList.length}/10)
              </span>
              <span className="text-[11px] text-text-muted">Carousel / Multi-Image</span>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Paste additional image URL (e.g. https://...)"
                value={newMediaUrl}
                onChange={(e) => setNewMediaUrl(e.target.value)}
                className="flex-1 h-9 px-3 text-xs rounded-lg border border-border bg-surface-card text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddAdditionalUrl}
                disabled={!newMediaUrl.trim()}
                className="h-9 px-3 text-xs font-semibold"
              >
                Add Image
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Natural Aspect Ratio Preview Canvas & Carousel */}
      {activeItem && !imageError && (
        <div
          data-testid="visual-pin-preview-card"
          className="rounded-2xl border border-border bg-surface-card p-4 shadow-xs overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3 text-xs text-text-muted">
            <div className="flex items-center gap-2 font-semibold text-text-primary">
              <ImageIcon size={14} className="text-primary" />
              <span>
                Natural Aspect Ratio Preview
                {effectiveItems.length > 1 && ` (${safePreviewIndex + 1} of ${effectiveItems.length})`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {safePreviewIndex === 0 && effectiveItems.length > 1 && (
                <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[10px] font-bold">
                  COVER IMAGE
                </span>
              )}
              <span className="font-mono bg-surface-subtle border border-border px-2 py-0.5 rounded text-[11px] text-text-secondary">
                {imageLoaded && (activeItem.aspect_ratio || aspectRatio)
                  ? `${activeItem.aspect_ratio || aspectRatio} : 1`
                  : 'Auto'}
              </span>
            </div>
          </div>

          {/* Centered responsive frame maintaining natural ratio with carousel arrows */}
          <div className="relative flex justify-center items-center bg-surface-subtle rounded-xl p-2 sm:p-4 max-h-[480px] overflow-hidden border border-border group">
            <img
              src={activeItem.url}
              alt={activeItem.alt_text || imageAlt || 'Visual pin preview'}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className="max-h-[440px] max-w-full h-auto w-auto object-contain rounded-lg shadow-sm transition-opacity duration-300"
              style={{
                aspectRatio: activeItem.aspect_ratio || aspectRatio || undefined,
              }}
            />

            {/* Carousel Prev/Next Buttons */}
            {effectiveItems.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous preview image"
                  disabled={safePreviewIndex === 0}
                  onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 text-white shadow-md hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Next preview image"
                  disabled={safePreviewIndex === effectiveItems.length - 1}
                  onClick={() => setPreviewIndex((i) => Math.min(effectiveItems.length - 1, i + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 text-white shadow-md hover:bg-black/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          {/* Carousel Thumbnail Strip and Reordering Controls */}
          {effectiveItems.length > 1 && (
            <div className="mt-3 pt-3 border-t border-border/70 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-text-muted">
                <span>Select cover or reorder ({effectiveItems.length} images)</span>
                <span>First image displays in feed</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {effectiveItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`relative shrink-0 rounded-lg overflow-hidden border-2 transition-all p-0.5 bg-surface-card ${
                      idx === safePreviewIndex ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewIndex(idx)}
                      className="block w-16 h-16 rounded overflow-hidden cursor-pointer"
                    >
                      <img src={item.url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>

                    {idx === 0 && (
                      <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[8px] font-bold bg-primary text-white shadow-xs">
                        COVER
                      </span>
                    )}

                    {/* Quick action buttons per thumbnail */}
                    <div className="flex items-center justify-between gap-1 pt-1 px-0.5">
                      {idx > 0 && onSetCover && (
                        <button
                          type="button"
                          onClick={() => onSetCover(idx)}
                          title="Set as Cover"
                          aria-label={`Set image ${idx + 1} as cover`}
                          className="p-1 rounded text-text-muted hover:text-primary transition-colors cursor-pointer"
                        >
                          <Star size={11} />
                        </button>
                      )}
                      {idx > 0 && onReorderMediaItem && (
                        <button
                          type="button"
                          onClick={() => onReorderMediaItem(idx, idx - 1)}
                          title="Move Left"
                          aria-label={`Move image ${idx + 1} left`}
                          className="p-1 rounded text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                        >
                          <ArrowLeft size={11} />
                        </button>
                      )}
                      {idx < effectiveItems.length - 1 && onReorderMediaItem && (
                        <button
                          type="button"
                          onClick={() => onReorderMediaItem(idx, idx + 1)}
                          title="Move Right"
                          aria-label={`Move image ${idx + 1} right`}
                          className="p-1 rounded text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                        >
                          <ArrowRight size={11} />
                        </button>
                      )}
                      {onRemoveMediaItem && (
                        <button
                          type="button"
                          onClick={() => onRemoveMediaItem(idx)}
                          title="Remove image"
                          aria-label={`Remove image ${idx + 1}`}
                          className="p-1 rounded text-red-500 hover:text-red-700 transition-colors ml-auto cursor-pointer"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Caption / Description */}
      <div>
        <label
          htmlFor="pin-caption"
          className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5"
        >
          Pin Caption / Description
        </label>
        <textarea
          id="pin-caption"
          rows={3}
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Add context, telemetry insights, equipment specs, or aesthetic notes..."
          className="w-full p-3.5 text-sm bg-surface-card text-text-primary placeholder-text-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y leading-relaxed"
        />
      </div>

      {/* 4. Alt Text & Destination Link */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Input
            id="pin-alt-text"
            label="Accessibility Alt Text"
            placeholder="Describe image for screen readers"
            value={imageAlt}
            onChange={(e) => onImageAltChange(e.target.value)}
            helperText="Improves accessibility for visually impaired community members."
          />
        </div>

        <div>
          <Input
            id="pin-destination-url"
            label="Destination Link (Optional)"
            placeholder="https://example.com/project"
            value={destinationUrl}
            onChange={(e) => onDestinationUrlChange(e.target.value)}
            leftIcon={<ExternalLink size={15} />}
            error={destinationUrlError}
            helperText="Where users are directed when clicking through this pin."
          />
        </div>
      </div>
    </div>
  );
}
