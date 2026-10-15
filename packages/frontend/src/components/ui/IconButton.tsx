import React, { forwardRef } from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  variant?: 'ghost' | 'outline' | 'filled' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
}

const variantStyles = {
  ghost:
    'bg-transparent text-[#475569] hover:text-[#0F172A] hover:bg-[#F4F4F5] active:bg-[#E4E4E7]',
  outline:
    'bg-white text-[#475569] border border-[#E2E8F0] hover:text-[#0F172A] hover:bg-[#F4F4F5]',
  filled:
    'bg-[#0F172A] text-white hover:bg-[#1E293B]',
  danger:
    'bg-transparent text-red-600 hover:bg-red-50 active:bg-red-100',
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
          `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 ` +
          `disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-95 ` +
          `${variantStyles[variant]} ${sizeStyles[size]} ${active ? 'bg-[#EFF6FF] text-[#2563EB]' : ''} ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
