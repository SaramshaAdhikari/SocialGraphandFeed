import React, { useState } from 'react';
import { Tag as TagIcon, X, Plus } from 'lucide-react';

export interface TagInputProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  maxTags?: number;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  'systems',
  'performance',
  'architecture',
  'algorithms',
  'hardware',
  'datacenter',
  'design',
  'accessibility',
];

export function TagInput({
  tags,
  onAddTag,
  onRemoveTag,
  maxTags = 5,
  suggestions = DEFAULT_SUGGESTIONS,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitTag();
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onRemoveTag(tags[tags.length - 1]);
    }
  };

  const commitTag = () => {
    const trimmed = inputValue.trim().replace(/^#/, '').toLowerCase();
    if (trimmed && tags.length < maxTags) {
      onAddTag(trimmed);
      setInputValue('');
    }
  };

  const unusedSuggestions = suggestions.filter((s) => !tags.includes(s));

  return (
    <div className="w-full text-left">
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor="tag-input-field"
          className="block text-xs font-semibold text-[#0F172A] dark:text-[#CBD5E1] uppercase tracking-wider"
        >
          Topical Tags / Flair
        </label>
        <span className="text-[11px] text-[#94A3B8]">
          {tags.length} / {maxTags} tags
        </span>
      </div>

      {/* Main Tag Container */}
      <div
        className="flex flex-wrap items-center gap-2 p-2 min-h-[44px] bg-white dark:bg-[#181B22] border border-[#E2E8F0] dark:border-[#2E3544] rounded-xl transition-all focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent"
      >
        <div className="pl-1.5 text-[#94A3B8]">
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
            className="flex-1 min-w-[140px] text-xs bg-transparent text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] border-0 focus:outline-none py-1"
          />
        )}
      </div>

      {/* Popular Suggestions */}
      {unusedSuggestions.length > 0 && tags.length < maxTags && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[11px] text-[#94A3B8] mr-1">Suggestions:</span>
          {unusedSuggestions.slice(0, 5).map((sugg) => (
            <button
              key={sugg}
              type="button"
              onClick={() => onAddTag(sugg)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-[#475569] dark:text-[#CBD5E1] hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
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
