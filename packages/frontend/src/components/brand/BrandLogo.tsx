export interface BrandLogoProps {
  variant?: 'full' | 'symbol' | 'wordmark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showSubtitle?: boolean;
}

/**
 * Single reusable asset location for the temporary approved SocialGraph logo.
 * Referenced across sidebar navigation, mobile header, and auth pages.
 * To replace the logo in a future branding phase, update this constant or replace the asset file.
 */
export const TEMPORARY_LOGO_SRC = '/brand/socialgraph-logo.png';

export function BrandLogo({
  variant = 'full',
  size = 'md',
  className = '',
  showSubtitle = false,
}: BrandLogoProps) {
  // Dimensions per size tier
  const sizeConfig = {
    sm: { symbol: 28, textClass: 'text-base', gap: 'gap-2.5' },
    md: { symbol: 34, textClass: 'text-lg', gap: 'gap-2.5' },
    lg: { symbol: 46, textClass: 'text-2xl', gap: 'gap-3.5' },
  }[size];

  // Temporary Approved SocialGraph Connected-Node Logo Image
  // Derived from the supplied pink-violet artwork, cropped and transparent-keyed to blend seamlessly with any background.
  const Symbol = (
    <div
      className="relative shrink-0 flex items-center justify-center overflow-hidden rounded-xl transition-transform duration-200 group-hover:scale-105"
      style={{ width: sizeConfig.symbol, height: sizeConfig.symbol }}
      role="img"
      aria-label="SocialGraph mark"
    >
      <img
        src={TEMPORARY_LOGO_SRC}
        alt="SocialGraph"
        width={sizeConfig.symbol}
        height={sizeConfig.symbol}
        className="w-full h-full object-contain select-none"
        loading="eager"
        decoding="async"
      />
    </div>
  );

  // High-contrast Noir Wordmark:
  // "Social" in text-primary + "Graph" in vivid magenta (#FF3CAC)
  const Wordmark = (
    <div className="flex flex-col leading-none select-none">
      <div className="flex items-baseline tracking-tight">
        <span className={`font-black tracking-tight font-display text-text-primary ${sizeConfig.textClass}`}>
          Social<span className="text-[#FF3CAC]">Graph</span>
        </span>
      </div>
      {showSubtitle && (
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-text-muted mt-0.5">
          PEOPLE · IDEAS · VISIONS
        </span>
      )}
    </div>
  );

  if (variant === 'symbol') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {Symbol}
      </div>
    );
  }

  if (variant === 'wordmark') {
    return (
      <div className={`inline-flex items-center ${className}`} role="img" aria-label="SocialGraph">
        {Wordmark}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${sizeConfig.gap} ${className}`} role="img" aria-label="SocialGraph">
      {Symbol}
      {Wordmark}
    </div>
  );
}

export default BrandLogo;
