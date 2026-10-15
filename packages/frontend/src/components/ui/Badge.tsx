import React from 'react';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'outline';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-[#F4F4F5] text-[#475569] border border-[#E2E8F0]',
  brand: 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]',
  success: 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]',
  warning: 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]',
  error: 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]',
  outline: 'bg-transparent text-[#64748B] border border-[#CBD5E1]',
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
    ? 'bg-[#0F172A] text-white border-transparent shadow-sm'
    : 'bg-[#F4F4F5] text-[#475569] hover:bg-[#E4E4E7] hover:text-[#0F172A] border-transparent';

  return (
    <button
      type={type}
      aria-pressed={selected}
      className={`inline-flex items-center justify-center font-medium rounded-full border transition-all cursor-pointer ` +
        `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1 ` +
        `active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${stateClasses} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
