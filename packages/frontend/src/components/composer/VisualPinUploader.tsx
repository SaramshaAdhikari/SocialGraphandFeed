import { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  X,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Input, Button } from '../ui';

export interface VisualPinUploaderProps {
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
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

  return (
    <div className="w-full space-y-5 text-left">
      {/* 1. Image Source Selection: URL or Local File Upload */}
      <div>
        <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#CBD5E1] uppercase tracking-wider mb-1.5">
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
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
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
          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mb-3">
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
      </div>

      {/* 2. Natural Aspect Ratio Preview Canvas */}
      {imageUrl && !imageError && (
        <div
          data-testid="visual-pin-preview-card"
          className="rounded-2xl border border-[#E2E8F0] dark:border-[#2E3544] bg-white dark:bg-[#181B22] p-4 shadow-xs overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
            <div className="flex items-center gap-2 font-semibold">
              <ImageIcon size={14} className="text-primary" />
              <span>Natural Aspect Ratio Preview</span>
            </div>
            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
              {imageLoaded && aspectRatio ? `${aspectRatio} : 1` : 'Auto'}
            </span>
          </div>

          {/* Centered responsive frame maintaining natural ratio */}
          <div className="flex justify-center bg-slate-50 dark:bg-[#12141A] rounded-xl p-2 sm:p-4 max-h-[480px] overflow-hidden border border-[#F1F5F9] dark:border-[#262B36]">
            <img
              src={imageUrl}
              alt={imageAlt || 'Visual pin preview'}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className="max-h-[440px] max-w-full h-auto w-auto object-contain rounded-lg shadow-sm transition-opacity duration-300"
              style={{
                aspectRatio: aspectRatio || undefined,
              }}
            />
          </div>
        </div>
      )}

      {/* 3. Caption / Description */}
      <div>
        <label
          htmlFor="pin-caption"
          className="block text-xs font-semibold text-[#0F172A] dark:text-[#CBD5E1] uppercase tracking-wider mb-1.5"
        >
          Pin Caption / Description
        </label>
        <textarea
          id="pin-caption"
          rows={3}
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Add context, telemetry insights, equipment specs, or aesthetic notes..."
          className="w-full p-3.5 text-sm bg-white dark:bg-[#181B22] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] border border-[#E2E8F0] dark:border-[#2E3544] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y leading-relaxed"
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
