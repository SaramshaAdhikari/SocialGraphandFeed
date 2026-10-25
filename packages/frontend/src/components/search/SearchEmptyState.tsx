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
      className={`bg-surface-card border border-border rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-surface-subtle text-text-muted flex items-center justify-center mx-auto mb-4">
        <SearchX size={28} />
      </div>

      <h3 className="font-bold text-lg text-text-primary">
        No results found for &ldquo;{query}&rdquo;
      </h3>

      <p className="mt-2 text-sm text-text-muted max-w-md mx-auto leading-relaxed">
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
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-text-muted mb-3">
          <Sparkles size={13} className="text-primary" />
          <span>Try searching for:</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {POPULAR_SUGGESTIONS.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onSuggestionClick(term)}
              className="text-xs font-medium px-3 py-1 rounded-full bg-surface-subtle text-text-secondary border border-border/50 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary transition-colors cursor-pointer"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SearchEmptyState;
