import React from 'react';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'outline';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-subtle text-text-secondary border border-border',
  brand: 'bg-[#EFF6FF] dark:bg-primary/20 text-primary border border-primary/30',
  success: 'bg-[#ECFDF5] dark:bg-emerald-950/30 text-[#059669] dark:text-emerald-400 border border-[#A7F3D0] dark:border-emerald-800',
  warning: 'bg-[#FFFBEB] dark:bg-amber-950/30 text-[#D97706] dark:text-amber-400 border border-[#FDE68A] dark:border-amber-800',
  error: 'bg-[#FEF2F2] dark:bg-rose-950/30 text-[#DC2626] dark:text-rose-400 border border-[#FECACA] dark:border-rose-800',
  outline: 'bg-transparent text-text-muted border border-border',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[11px] font-medium rounded-full',
  md: 'px-2.5 py-1 text-xs font-semibold rounded-full',
};

export function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
  ...rest
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 leading-none whitespace-nowrap select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}

export interface PillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  size?: 'sm' | 'md';
}

export function Pill({
  children,
  selected = false,
  size = 'md',
  className = '',
  type = 'button',
  ...rest
}: PillProps) {
  const sizeClasses = size === 'sm' ? 'px-3 py-1 text-xs min-h-[28px]' : 'px-4 py-1.5 text-sm min-h-[36px]';

  const stateClasses = selected
    ? 'bg-primary text-white border-transparent shadow-sm'
    : 'bg-surface-subtle text-text-muted hover:bg-surface-card hover:text-text-primary border border-border';

  return (
    <button
      type={type}
      aria-pressed={selected}
      className={`inline-flex items-center justify-center font-medium rounded-full border transition-all cursor-pointer ` +
        `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ` +
        `active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${stateClasses} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
