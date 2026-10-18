import { SearchX, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

export interface SearchEmptyStateProps {
  query: string;
  category: string;
  onClear: () => void;
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}

const POPULAR_SUGGESTIONS = [
  'Distributed Systems',
  'Cache Invalidation',
  'Redis 7',
  'Brutalist Architecture',
  'Generative Design',
  'Consensus Protocols',
];

export function SearchEmptyState({
  query,
  category,
  onClear,
  onSuggestionClick,
  className = '',
}: SearchEmptyStateProps) {
  return (
    <div
      data-testid="search-empty-state"
      className={`bg-white dark:bg-[#181B22] border border-[#E2E8F0] dark:border-[#2E3544] rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#262B36] text-[#64748B] dark:text-[#94A3B8] flex items-center justify-center mx-auto mb-4">
        <SearchX size={28} />
      </div>

      <h3 className="font-bold text-lg text-[#0F172A] dark:text-[#F8FAFC]">
        No results found for &ldquo;{query}&rdquo;
      </h3>

      <p className="mt-2 text-sm text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto leading-relaxed">
        {category === 'all'
          ? 'We couldn’t find any discussions, visual pins, communities, or people matching your query.'
          : `We couldn’t find any ${category} matching your query.`}{' '}
        Check your spelling or try alternative keywords.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" size="sm" onClick={onClear} className="text-xs font-semibold">
          <RotateCcw size={13} className="mr-1.5" />
          Clear search
        </Button>
      </div>

      {/* Suggested Exploration Chips */}
      <div className="mt-8 pt-6 border-t border-[#F1F5F9] dark:border-[#262B36]">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] mb-3">
          <Sparkles size={13} className="text-primary" />
          <span>Try searching for:</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {POPULAR_SUGGESTIONS.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onSuggestionClick(term)}
              className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 dark:bg-[#262B36] text-[#334155] dark:text-[#CBD5E1] hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary transition-colors cursor-pointer"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
