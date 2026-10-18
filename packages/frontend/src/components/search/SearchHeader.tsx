import { SearchBar } from '../ui/Input';
import { Button } from '../ui/Button';
import { Sparkles } from 'lucide-react';

export interface SearchHeaderProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSubmit: (q?: string) => void;
  loading?: boolean;
  className?: string;
}

const QUICK_TOPICS = [
  'Distributed Systems',
  'Cache Invalidation',
  'Redis 7',
  'Brutalist Architecture',
  'Zero CLS',
  'Consensus',
];

export function SearchHeader({
  query,
  onQueryChange,
  onSubmit,
  loading = false,
  className = '',
}: SearchHeaderProps) {
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit();
  };

  return (
    <div className={`mb-6 ${className}`}>
      <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
        <div className="flex-1">
          <SearchBar
            value={query}
            onChange={onQueryChange}
            onSubmit={(val) => onSubmit(val)}
            placeholder="Search discussions, visual pins, communities, people..."
            ariaLabel="Search SocialGraph"
            className="w-full"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={loading}
          className="shrink-0 font-semibold px-5 h-10 rounded-full"
        >
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </form>

      {/* Suggested Quick Topics Strip */}
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1 shrink-0 font-medium mr-1">
          <Sparkles size={12} className="text-primary" />
          <span>Trending:</span>
        </span>
        {QUICK_TOPICS.map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => {
              onQueryChange(topic);
              onSubmit(topic);
            }}
            className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#262B36] text-[#475569] dark:text-[#CBD5E1] hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary transition-colors shrink-0 font-medium cursor-pointer"
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
}
