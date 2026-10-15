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
    'bg-primary text-white hover:opacity-90 active:opacity-100 shadow-sm border border-transparent',
  secondary:
    'bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] hover:bg-[#1E293B] dark:hover:bg-slate-100 active:bg-[#334155] shadow-sm border border-transparent',
  outline:
    'bg-white dark:bg-[#181B22] text-[#0F172A] dark:text-[#F8FAFC] border border-[#E2E8F0] dark:border-[#2E3544] hover:bg-[#F4F4F5] dark:hover:bg-[#262B36] hover:border-[#CBD5E1] dark:hover:border-[#3E475A]',
  ghost:
    'bg-transparent text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#262B36] border border-transparent',
  pill:
    'bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] hover:bg-[#1E293B] dark:hover:bg-slate-100 rounded-full shadow-sm border border-transparent',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm border border-transparent',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md min-h-[32px]',
  md: 'h-10 px-4 text-sm gap-2 rounded-md min-h-[40px]',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-lg min-h-[48px]',
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
    const borderRadius = isPill ? 'rounded-full' : sizeStyles[size].split(' ').find((c) => c.startsWith('rounded-')) || 'rounded-md';

    const baseClasses =
      'inline-flex items-center justify-center font-medium transition-all select-none cursor-pointer ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#181B22] ' +
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={`${baseClasses} ${variantStyles[variant]} ${sizeStyles[size]} ${borderRadius} ${className}`}
        {...rest}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
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
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
