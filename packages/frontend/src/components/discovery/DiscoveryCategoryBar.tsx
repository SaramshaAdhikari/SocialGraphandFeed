import { Pill } from '../ui/Badge';

export interface DiscoveryCategoryBarProps {
  category: string;
  onCategoryChange: (category: string) => void;
  disabled?: boolean;
  className?: string;
}

export function DiscoveryCategoryBar({
  category,
  onCategoryChange,
  disabled = false,
  className = '',
}: DiscoveryCategoryBarProps) {
  const categories = [
    { id: 'all', label: 'All Inspirations' },
    { id: 'systems', label: 'Distributed Systems' },
    { id: 'visuals', label: 'Design & Visuals' },
    { id: 'hardware', label: 'Hardware & Silicon' },
    { id: 'algorithms', label: 'Algorithms' },
  ];

  return (
    <div
      role="toolbar"
      aria-label="Discover Categories"
      className={`flex items-center gap-2 overflow-x-auto scrollbar-none py-1.5 ${className}`}
    >
      {categories.map((c) => {
        const isSelected = category.toLowerCase() === c.id;
        return (
          <Pill
            key={c.id}
            size="sm"
            selected={isSelected}
            disabled={disabled}
            onClick={() => onCategoryChange(c.id)}
            className="whitespace-nowrap shrink-0 cursor-pointer"
          >
            {c.label}
          </Pill>
        );
      })}
    </div>
  );
}
