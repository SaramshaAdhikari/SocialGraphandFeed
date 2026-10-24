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
            className="block text-xs font-semibold text-text-primary mb-1.5 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-text-muted pointer-events-none inline-flex items-center">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full h-10 text-sm bg-surface-card text-text-primary placeholder:text-text-muted border rounded-xl transition-all ` +
              `focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ` +
              `disabled:bg-surface-subtle disabled:text-text-muted disabled:cursor-not-allowed ` +
              `${leftIcon ? 'pl-9' : 'pl-3.5'} ${rightIcon ? 'pr-9' : 'pr-3.5'} ` +
              `${error ? 'border-red-500 focus:ring-red-500' : 'border-border hover:border-border-strong'} ` +
              `${className}`}
            {...rest}
          />
          {rightIcon && (
            <span className="absolute right-3 text-text-muted inline-flex items-center">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-text-muted">{helperText}</p>}
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
        size={17}
        className="absolute left-3.5 text-text-muted pointer-events-none shrink-0"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full h-10 pl-10 pr-16 text-sm bg-surface-subtle text-text-primary placeholder:text-text-muted rounded-full border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search query"
          className="absolute right-2.5 p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
        >
          <X size={14} />
        </button>
      ) : (
        <kbd className="hidden sm:inline-flex items-center absolute right-3 px-1.5 py-0.5 text-[10px] font-mono font-medium text-text-muted bg-surface-card border border-border rounded pointer-events-none select-none">
          Ctrl K
        </kbd>
      )}
    </div>
  );
}
