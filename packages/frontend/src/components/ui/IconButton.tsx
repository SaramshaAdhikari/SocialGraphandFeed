import React, { forwardRef } from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  variant?: 'ghost' | 'outline' | 'filled' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
}

const variantStyles = {
  ghost:
    'bg-transparent text-text-muted hover:text-text-primary hover:bg-surface-subtle active:bg-surface-subtle',
  outline:
    'bg-surface-card text-text-muted border border-border hover:text-text-primary hover:bg-surface-subtle',
  filled:
    'bg-primary text-white hover:bg-primary-hover',
  danger:
    'bg-transparent text-rose-500 hover:bg-rose-500/10 active:bg-rose-500/20',
};

const sizeStyles = {
  sm: 'w-8 h-8 min-w-[32px] min-h-[32px] text-sm',
  md: 'w-10 h-10 min-w-[40px] min-h-[40px] text-base',
  lg: 'w-12 h-12 min-w-[48px] min-h-[48px] text-lg',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      'aria-label': ariaLabel,
      variant = 'ghost',
      size = 'md',
      active = false,
      children,
      disabled,
      className = '',
      type = 'button',
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-pressed={active}
        className={`inline-flex items-center justify-center rounded-full transition-all cursor-pointer select-none ` +
          `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ` +
          `disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-95 ` +
          `${variantStyles[variant]} ${sizeStyles[size]} ${active ? 'bg-primary-soft text-primary font-bold' : ''} hover:scale-105 active:scale-95 duration-150 ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
