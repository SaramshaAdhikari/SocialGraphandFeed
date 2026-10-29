import { useState, useEffect, useRef } from 'react';
import { User, Users, MessageSquare, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from '../../router/Router';
import { api } from '../../api';
import { Avatar } from '../ui/Avatar';
import type { UniversalSearchResults } from '@socialgraph/shared';

export interface SearchSuggestionsOverlayProps {
  query: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: () => void;
}

interface SuggestionItem {
  id: string;
  category: 'people' | 'communities' | 'posts';
  title: string;
  subtitle: string;
  url: string;
  avatarUrl?: string;
}

export function SearchSuggestionsOverlay({
  query,
  isOpen,
  onClose,
  onSelect,
}: SearchSuggestionsOverlayProps) {
  const { navigate } = useRouter();
  const [results, setResults] = useState<UniversalSearchResults | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Debounced API search
  useEffect(() => {
    const trimmed = query.trim();
    if (!isOpen || trimmed.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      api
        .search({ q: trimmed, limit: 4 })
        .then((res) => {
          setResults(res);
        })
        .catch(() => {
          setResults(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Build flattened list of suggestions for keyboard navigation
  const items: SuggestionItem[] = [];

  if (results) {
    for (const u of results.users.slice(0, 3)) {
      items.push({
        id: `user_${u.id}`,
        category: 'people',
        title: u.display_name,
        subtitle: `@${u.username}${u.bio ? ` • ${u.bio.slice(0, 50)}` : ''}`,
        url: `/u/${u.username}`,
        avatarUrl: u.avatar_url,
      });
    }

    for (const c of results.communities.slice(0, 3)) {
      items.push({
        id: `comm_${c.id}`,
        category: 'communities',
        title: c.name,
        subtitle: `c/${c.slug} • ${c.members_count} members`,
        url: `/c/${c.slug}`,
      });
    }

    for (const d of results.discussions.slice(0, 3)) {
      items.push({
        id: `disc_${d.id}`,
        category: 'posts',
        title: d.title,
        subtitle: `Posted by u/${d.author.username} • ${d.comments_count} comments`,
        url: `/post/${d.id}`,
      });
    }

    for (const v of results.visuals.slice(0, 2)) {
      items.push({
        id: `vis_${v.id}`,
        category: 'posts',
        title: v.title || 'Visual Pin',
        subtitle: `By u/${v.author.username}`,
        url: `/post/${v.id}`,
        avatarUrl: v.media?.url,
      });
    }
  }

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < items.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          e.preventDefault();
          navigate(items[selectedIndex].url);
          onSelect();
        } else if (selectedIndex === items.length || selectedIndex === -1) {
          // Open full search route
          if (query.trim()) {
            e.preventDefault();
            navigate(`/search?q=${encodeURIComponent(query.trim())}`);
            onSelect();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, selectedIndex, query, navigate, onClose, onSelect]);

  if (!isOpen || query.trim().length < 2) {
    return null;
  }

  const hasAnyResults = items.length > 0;

  return (
    <div
      ref={overlayRef}
      role="listbox"
      aria-label="Search suggestions"
      data-testid="search-suggestions-overlay"
      className="absolute top-full left-0 right-0 mt-2 bg-surface-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
    >
      {loading ? (
        <div className="p-6 text-center text-text-muted flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin text-primary" />
          <span className="text-xs">Searching platform...</span>
        </div>
      ) : !hasAnyResults ? (
        <div className="p-6 text-center space-y-2">
          <p className="text-xs font-semibold text-text-primary">No results found for &ldquo;{query}&rdquo;</p>
          <p className="text-[11px] text-text-muted">Try checking for typos or searching by handle.</p>
          <button
            type="button"
            onClick={() => {
              navigate(`/search?q=${encodeURIComponent(query.trim())}`);
              onSelect();
            }}
            className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1 mt-1 cursor-pointer"
          >
            <span>Search all categories</span>
            <ArrowRight size={12} />
          </button>
        </div>
      ) : (
        <div className="divide-y divide-border/40 max-h-96 overflow-y-auto">
          {/* Categorized suggestions */}
          {results && results.users.length > 0 && (
            <div className="p-2">
              <span className="px-2.5 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <User size={12} /> People
              </span>
              <div className="space-y-0.5 mt-1">
                {items
                  .filter((i) => i.category === 'people')
                  .map((item, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid="search-result-item"
                        onClick={() => {
                          navigate(item.url);
                          onSelect();
                        }}
                        className={`w-full text-left p-2 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                          isSelected ? 'bg-black/[0.06] dark:bg-white/[0.08] text-text-primary font-medium' : 'hover:bg-surface-subtle text-text-primary'
                        }`}
                      >
                        <Avatar src={item.avatarUrl || '/avatars/alex-dev.svg'} alt={item.title} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">{item.title}</p>
                          <p className="text-[11px] text-text-muted truncate">{item.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {results && results.communities.length > 0 && (
            <div className="p-2">
              <span className="px-2.5 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Users size={12} /> Communities
              </span>
              <div className="space-y-0.5 mt-1">
                {items
                  .filter((i) => i.category === 'communities')
                  .map((item) => {
                    const itemIndex = items.findIndex((x) => x.id === item.id);
                    const isSelected = selectedIndex === itemIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid="search-result-item"
                        onClick={() => {
                          navigate(item.url);
                          onSelect();
                        }}
                        className={`w-full text-left p-2 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                          isSelected ? 'bg-black/[0.06] dark:bg-white/[0.08] text-text-primary font-medium' : 'hover:bg-surface-subtle text-text-primary'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-surface-subtle border border-border flex items-center justify-center text-primary shrink-0 font-bold text-xs">
                          #
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">{item.title}</p>
                          <p className="text-[11px] text-text-muted truncate">{item.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {results && (results.discussions.length > 0 || results.visuals.length > 0) && (
            <div className="p-2">
              <span className="px-2.5 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={12} /> Posts
              </span>
              <div className="space-y-0.5 mt-1">
                {items
                  .filter((i) => i.category === 'posts')
                  .map((item) => {
                    const itemIndex = items.findIndex((x) => x.id === item.id);
                    const isSelected = selectedIndex === itemIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid="search-result-item"
                        onClick={() => {
                          navigate(item.url);
                          onSelect();
                        }}
                        className={`w-full text-left p-2 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                          isSelected ? 'bg-black/[0.06] dark:bg-white/[0.08] text-text-primary font-medium' : 'hover:bg-surface-subtle text-text-primary'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-surface-subtle border border-border flex items-center justify-center text-text-muted shrink-0">
                          <MessageSquare size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate text-text-primary">{item.title}</p>
                          <p className="text-[11px] text-text-muted truncate">{item.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Full Results Link */}
          <div className="p-2 bg-surface-subtle/40 border-t border-border">
            <button
              type="button"
              data-testid="search-full-results-button"
              onClick={() => {
                navigate(`/search?q=${encodeURIComponent(query.trim())}`);
                onSelect();
              }}
              className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between text-xs font-bold transition-colors cursor-pointer ${
                selectedIndex === items.length
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-primary hover:bg-primary/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} />
                <span>See all results for &ldquo;{query}&rdquo;</span>
              </div>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchSuggestionsOverlay;
