import React, { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'pill' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:opacity-95 active:opacity-90 shadow-sm border border-transparent font-semibold btn-interaction btn-glow',
  secondary:
    'bg-primary-soft text-primary hover:bg-primary/20 active:bg-primary/25 border border-primary/30 font-semibold btn-interaction',
  outline:
    'bg-surface-card text-text-primary border border-border hover:bg-surface-subtle hover:border-border-strong btn-interaction',
  ghost:
    'bg-transparent text-text-muted hover:text-text-primary hover:bg-surface-subtle border border-transparent transition-colors',
  pill:
    'bg-surface-card text-text-primary hover:bg-surface-subtle border border-border rounded-full shadow-sm btn-interaction',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm border border-transparent btn-interaction',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 min-h-[32px]',
  md: 'h-10 px-4 text-sm gap-2 min-h-[40px]',
  lg: 'h-12 px-6 text-base gap-2.5 min-h-[48px]',
};

const defaultRadius: Record<ButtonSize, string> = {
  sm: 'rounded-md',
  md: 'rounded-lg',
  lg: 'rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isPill = variant === 'pill';
    const hasCustomRadius = className.split(/\s+/).some((c) => c.startsWith('rounded-'));
    const radiusClass = hasCustomRadius ? '' : isPill ? 'rounded-full' : defaultRadius[size];

    const baseClasses =
      'inline-flex items-center justify-center font-medium transition-all select-none cursor-pointer whitespace-nowrap ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0B0B0F] ' +
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={`${baseClasses} ${variantStyles[variant]} ${sizeStyles[size]} ${radiusClass} ${className}`.trim()}
        {...rest}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {!isLoading && leftIcon && (
          <span className="inline-flex items-center justify-center shrink-0 leading-none" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <span className="inline-flex items-center justify-center leading-none whitespace-nowrap">{children}</span>
        {!isLoading && rightIcon && (
          <span className="inline-flex items-center justify-center shrink-0 leading-none" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
