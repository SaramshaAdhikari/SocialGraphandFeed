import { MessageSquareText, Image as ImageIcon } from 'lucide-react';
import type { PostComposerType } from '../../hooks/useCreatePost';

export interface PostTypeSelectorProps {
  activeType: PostComposerType;
  onChange: (type: PostComposerType) => void;
  disabled?: boolean;
}

export function PostTypeSelector({ activeType, onChange, disabled = false }: PostTypeSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Post Formats"
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 rounded-2xl bg-surface-subtle border border-border"
    >
      {/* 1. Discussion Mode Tab */}
      <button
        type="button"
        role="tab"
        id="tab-discussion"
        aria-selected={activeType === 'discussion'}
        aria-controls="panel-discussion"
        disabled={disabled}
        onClick={() => onChange('discussion')}
        className={`flex items-start gap-3.5 p-3.5 rounded-xl text-left transition-all cursor-pointer ${
          activeType === 'discussion'
            ? 'bg-surface-card text-text-primary shadow-xs border border-primary/40 ring-1 ring-primary/40'
            : 'text-text-muted hover:text-text-primary hover:bg-surface-card/60'
        }`}
      >
        <div
          className={`p-2.5 rounded-xl shrink-0 ${
            activeType === 'discussion'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-surface-subtle text-text-muted'
          }`}
        >
          <MessageSquareText size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-text-primary">Discussion Post</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-card border border-border text-text-secondary">
              Reddit Style
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
            Architectural RFCs, telemetry benchmarks, code blocks, and threaded community discourse.
          </p>
        </div>
      </button>

      {/* 2. Visual Pin Mode Tab */}
      <button
        type="button"
        role="tab"
        id="tab-visual"
        aria-selected={activeType === 'visual'}
        aria-controls="panel-visual"
        disabled={disabled}
        onClick={() => onChange('visual')}
        className={`flex items-start gap-3.5 p-3.5 rounded-xl text-left transition-all cursor-pointer ${
          activeType === 'visual'
            ? 'bg-surface-card text-text-primary shadow-xs border border-primary/40 ring-1 ring-primary/40'
            : 'text-text-muted hover:text-text-primary hover:bg-surface-card/60'
        }`}
      >
        <div
          className={`p-2.5 rounded-xl shrink-0 ${
            activeType === 'visual'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-surface-subtle text-text-muted'
          }`}
        >
          <ImageIcon size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-text-primary">Visual Pin</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-card border border-border text-text-secondary">
              Pinterest Style
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
            Datacenter infrastructure, compute hardware photography, and high-density visual masonry.
          </p>
        </div>
      </button>
    </div>
  );
}

export default PostTypeSelector;
