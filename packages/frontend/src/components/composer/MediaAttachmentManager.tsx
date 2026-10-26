import React, { useState, useRef } from 'react';
import {
  Upload,
  Link as LinkIcon,
  X,
  AlertCircle,
    ArrowLeft,
  ArrowRight,
  Star,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import type { MediaAttachment } from '@socialgraph/shared';
import { Button, Input } from '../ui';
import { useApi } from '../../api';

export interface MediaAttachmentManagerProps {
  mediaList: MediaAttachment[];
  onAddMediaItem: (item: MediaAttachment) => void;
  onAddMultipleMedia: (items: MediaAttachment[]) => void;
  onRemoveMediaItem: (index: number) => void;
  onReorderMediaItem: (from: number, to: number) => void;
  onSetCover: (index: number) => void;
  error?: string;
  disabled?: boolean;
}

export function MediaAttachmentManager({
  mediaList = [],
  onAddMediaItem,
  onAddMultipleMedia,
  onRemoveMediaItem,
  onReorderMediaItem,
  onSetCover,
  error,
  disabled = false,
}: MediaAttachmentManagerProps) {
  const api = useApi();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Reset input value so same files can be chosen again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setUploadError(null);

    // Enforce 10 image limit
    if (mediaList.length + files.length > 10) {
      setUploadError(`You can attach a maximum of 10 images per post (currently have ${mediaList.length}).`);
      return;
    }

    // Client-side file size and type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'];
    for (const f of files) {
      if (!allowedTypes.includes(f.type) && !f.type.startsWith('image/')) {
        setUploadError(`Unsupported file format '${f.name}'. Allowed: JPEG, PNG, WebP, GIF, AVIF, SVG.`);
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        setUploadError(`File '${f.name}' exceeds the 10MB size limit (${(f.size / 1024 / 1024).toFixed(1)}MB).`);
        return;
      }
    }

    setUploading(true);
    try {
      const uploaded = await api.uploadMedia(files);
      if (uploaded && uploaded.length > 0) {
        onAddMultipleMedia(uploaded);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload image(s). Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError('');

    const trimmed = urlInput.trim();
    if (!trimmed) return;

    if (mediaList.length >= 10) {
      setUrlError('Maximum 10 images already attached.');
      return;
    }

    try {
      const u = new URL(trimmed);
      if (!['http:', 'https:'].includes(u.protocol)) {
        setUrlError('Image link must start with http:// or https://');
        return;
      }
    } catch {
      setUrlError('Please enter a valid image URL.');
      return;
    }

    onAddMediaItem({
      id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      url: trimmed,
      aspect_ratio: 1.33,
      alt_text: 'Attached image',
    });

    setUrlInput('');
    setShowUrlInput(false);
  };

  return (
    <div className="w-full space-y-4" data-testid="media-attachment-manager">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider">
          Media Attachments ({mediaList.length} / 10)
        </label>
        <div className="flex items-center gap-2">
          {mediaList.length < 10 && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                disabled={disabled || uploading}
                onChange={handleFilesSelected}
                className="hidden"
                data-testid="media-file-input"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || uploading}
                onClick={() => fileInputRef.current?.click()}
                leftIcon={uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                className="gap-1.5"
              >
                <span>{uploading ? 'Uploading...' : 'Upload Images'}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || uploading}
                onClick={() => setShowUrlInput((v) => !v)}
                leftIcon={<LinkIcon size={14} />}
                className="text-xs"
              >
                <span>{showUrlInput ? 'Cancel URL' : 'Add from URL'}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error alert */}
      {(uploadError || error) && (
        <div
          role="alert"
          data-testid="media-error-alert"
          className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400"
        >
          <AlertCircle size={15} className="shrink-0" />
          <span>{uploadError || error}</span>
        </div>
      )}

      {/* Add from URL sub-form */}
      {showUrlInput && (
        <form onSubmit={handleAddUrl} className="p-3 rounded-xl bg-surface-subtle border border-border flex gap-2">
          <div className="flex-1">
            <Input
              type="url"
              placeholder="Paste direct image URL (e.g. https://images.unsplash.com/...)"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (urlError) setUrlError('');
              }}
              error={urlError}
              leftIcon={<LinkIcon size={14} />}
            />
          </div>
          <Button type="submit" variant="primary" size="sm" className="shrink-0 self-start mt-0.5">
            Add
          </Button>
        </form>
      )}

      {/* Media Thumbnails Grid */}
      {mediaList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {mediaList.map((item, index) => {
            const isCover = index === 0;
            return (
              <div
                key={item.id || item.url}
                data-testid={`media-item-${index}`}
                className={`relative group rounded-xl overflow-hidden border bg-surface-subtle aspect-square flex flex-col justify-between ${
                  isCover ? 'ring-2 ring-primary border-primary' : 'border-border'
                }`}
              >
                <img
                  src={item.url}
                  alt={item.alt_text || `Attached media ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback visual on error
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />

                {/* Cover badge */}
                {isCover && (
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-primary text-white text-[10px] font-bold shadow-xs pointer-events-none">
                    Cover
                  </span>
                )}

                {/* Index badge */}
                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono pointer-events-none">
                  {index + 1}
                </span>

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                  {!isCover && (
                    <button
                      type="button"
                      title="Set as cover image"
                      onClick={() => onSetCover(index)}
                      className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-amber-300 transition-colors"
                    >
                      <Star size={14} />
                    </button>
                  )}
                  {index > 0 && (
                    <button
                      type="button"
                      title="Move left"
                      onClick={() => onReorderMediaItem(index, index - 1)}
                      className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white transition-colors"
                    >
                      <ArrowLeft size={14} />
                    </button>
                  )}
                  {index < mediaList.length - 1 && (
                    <button
                      type="button"
                      title="Move right"
                      onClick={() => onReorderMediaItem(index, index + 1)}
                      className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white transition-colors"
                    >
                      <ArrowRight size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Remove image"
                    onClick={() => onRemoveMediaItem(index)}
                    className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State / Dropzone hint when 0 images attached */}
      {mediaList.length === 0 && !uploading && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border/80 hover:border-primary/50 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-colors bg-surface-subtle/40 hover:bg-surface-subtle group"
        >
          <div className="w-12 h-12 rounded-2xl bg-surface-card border border-border flex items-center justify-center mx-auto mb-2.5 text-text-muted group-hover:text-primary transition-colors shadow-xs">
            <ImageIcon size={22} />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-text-primary mb-1">
            Drag and drop images here, or <span className="text-primary hover:underline">browse</span>
          </p>
          <p className="text-[11px] text-text-muted">
            Attach up to 10 photos or diagrams (PNG, JPG, WebP, GIF, SVG up to 10MB each)
          </p>
        </div>
      )}
    </div>
  );
}
export default MediaAttachmentManager;
