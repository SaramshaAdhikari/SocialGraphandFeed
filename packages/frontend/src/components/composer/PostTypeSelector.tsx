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
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 rounded-2xl bg-slate-100/80 dark:bg-[#14171E] border border-[#E2E8F0] dark:border-[#2E3544]"
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
            ? 'bg-white dark:bg-[#1C202B] text-[#0F172A] dark:text-[#F8FAFC] shadow-sm border border-primary/20 ring-1 ring-primary/20'
            : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#181B22]/60'
        }`}
      >
        <div
          className={`p-2.5 rounded-xl shrink-0 ${
            activeType === 'discussion'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500'
          }`}
        >
          <MessageSquareText size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight">Discussion Post</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Reddit Style
            </span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5 leading-relaxed">
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
            ? 'bg-white dark:bg-[#1C202B] text-[#0F172A] dark:text-[#F8FAFC] shadow-sm border border-primary/20 ring-1 ring-primary/20'
            : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#181B22]/60'
        }`}
      >
        <div
          className={`p-2.5 rounded-xl shrink-0 ${
            activeType === 'visual'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500'
          }`}
        >
          <ImageIcon size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight">Visual Pin</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Pinterest Style
            </span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5 leading-relaxed">
            Datacenter infrastructure, compute hardware photography, and high-density visual masonry.
          </p>
        </div>
      </button>
    </div>
  );
}
