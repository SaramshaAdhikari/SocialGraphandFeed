import React, { useState } from 'react';
import { Tag as TagIcon, X, Plus } from 'lucide-react';

export interface TagInputProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  maxTags?: number;
  suggestions?: string[];
  error?: string;
}

const DEFAULT_SUGGESTIONS = [
  'RFC',
  'Architecture',
  'DistributedSystems',
  'Rust',
  'Go',
  'Database',
  'Observability',
  'Hardware',
];

export function TagInput({
  tags,
  onAddTag,
  onRemoveTag,
  maxTags = 5,
  suggestions = DEFAULT_SUGGESTIONS,
  error,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const commitTag = () => {
    const trimmed = inputValue.trim().replace(/^#+/, '').toLowerCase();
    if (trimmed && /^[a-z0-9_-]+$/.test(trimmed) && !tags.includes(trimmed) && tags.length < maxTags) {
      onAddTag(trimmed);
      setInputValue('');
    } else if (!trimmed || trimmed === '#') {
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitTag();
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onRemoveTag(tags[tags.length - 1]);
    }
  };

  const handleAddSuggested = (sugg: string) => {
    const formatted = sugg.toLowerCase();
    if (tags.length < maxTags && !tags.includes(formatted)) {
      onAddTag(formatted);
    }
  };

  const unusedSuggestions = suggestions.filter(
    (sugg) => !tags.includes(sugg.toLowerCase())
  );

  return (
    <div className="w-full text-left">
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor="tag-input-field"
          className="block text-xs font-semibold text-text-primary uppercase tracking-wider"
        >
          Topical Tags / Flair
        </label>
        <span className="text-[11px] text-text-muted">
          {tags.length} / {maxTags} tags
        </span>
      </div>

      {/* Main Tag Container */}
      <div
        className={`flex flex-wrap items-center gap-2 p-2 min-h-[44px] bg-surface-card border rounded-xl transition-all focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent ${
          error ? 'border-red-500' : 'border-border'
        }`}
      >
        <div className="pl-1.5 text-text-muted">
          <TagIcon size={15} />
        </div>

        {/* Existing Tag Pills */}
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 animate-fade-in"
          >
            <span>{`#${tag}`}</span>
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              aria-label={`Remove tag ${tag}`}
              className="text-primary hover:text-primary/70 transition-colors cursor-pointer"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        {/* Input for new tag */}
        {tags.length < maxTags && (
          <input
            id="tag-input-field"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitTag}
            placeholder={tags.length === 0 ? 'Type tag and press Enter...' : 'Add another tag...'}
            className="flex-1 min-w-[140px] text-xs bg-transparent text-text-primary placeholder-text-muted border-0 focus:outline-none py-1"
          />
        )}
      </div>

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-500 font-medium">
          {error}
        </p>
      )}

      {/* Popular Suggestions */}
      {unusedSuggestions.length > 0 && tags.length < maxTags && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[11px] text-text-muted mr-1">Suggestions:</span>
          {unusedSuggestions.slice(0, 5).map((sugg) => (
            <button
              key={sugg}
              type="button"
              onClick={() => handleAddSuggested(sugg)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-subtle text-text-secondary border border-border/50 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
            >
              <Plus size={10} />
              <span>{`#${sugg}`}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default TagInput;
