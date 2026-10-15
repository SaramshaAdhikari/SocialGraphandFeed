import React, { forwardRef } from 'react';
import { Search, X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      className = '',
      disabled,
      ...rest
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[#0F172A] mb-1.5 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-[#94A3B8] pointer-events-none inline-flex items-center">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full h-10 text-sm bg-white dark:bg-[#181B22] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] border rounded-md transition-all ` +
              `focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ` +
              `disabled:bg-[#F4F4F5] dark:disabled:bg-[#12141A] disabled:text-[#94A3B8] disabled:cursor-not-allowed ` +
              `${leftIcon ? 'pl-9' : 'pl-3.5'} ${rightIcon ? 'pr-9' : 'pr-3.5'} ` +
              `${error ? 'border-red-500 focus:ring-red-500' : 'border-[#E2E8F0] dark:border-[#2E3544] hover:border-[#CBD5E1] dark:hover:border-[#3E475A]'} ` +
              `${className}`}
            {...rest}
          />
          {rightIcon && (
            <span className="absolute right-3 text-[#94A3B8] inline-flex items-center">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit?: (val: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search posts, communities, or people...',
  className = '',
  ariaLabel = 'Search across the platform',
}: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit?.(value);
    }
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search
        size={18}
        className="absolute left-3.5 text-[#94A3B8] pointer-events-none shrink-0"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full h-10 pl-10 pr-9 text-sm bg-[#F4F4F5] dark:bg-[#262B36] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] rounded-full border border-transparent focus:outline-none focus:ring-2 focus:ring-primary transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search query"
          className="absolute right-2.5 p-1 rounded-full text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#E4E4E7] dark:hover:bg-[#323846] transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
