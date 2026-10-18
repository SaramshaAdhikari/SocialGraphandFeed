import { useState } from 'react';
import type { Community } from '@socialgraph/shared';
import { ShieldCheck, BookOpen, ChevronDown, ChevronUp, Users, Calendar, Info } from 'lucide-react';

export interface CommunitySidebarProps {
  community: Community;
  membersCount: number;
  className?: string;
}

export function CommunitySidebar({
  community,
  membersCount,
  className = '',
}: CommunitySidebarProps) {
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

  const toggleRule = (ruleId: string) => {
    setExpandedRuleId((prev) => (prev === ruleId ? null : ruleId));
  };

  const formattedMembers = new Intl.NumberFormat('en-US').format(membersCount);

  const formattedCreationDate = (() => {
    try {
      const d = new Date(community.created_at);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return 'Jan 2026';
    }
  })();

  const hasRules = community.rules && community.rules.length > 0;

  return (
    <aside
      data-testid="community-sidebar"
      aria-label="About this community"
      className={`space-y-4 ${className}`}
    >
      {/* 1. About Community Card */}
      <div className="bg-white dark:bg-[#181B22] rounded-2xl border border-[#E2E8F0] dark:border-[#2E3544] p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#F1F5F9] dark:border-[#262B36]">
          <Info size={16} className="text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F8FAFC]">
            About Community
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-[#475569] dark:text-[#CBD5E1] leading-relaxed mb-4">
          {community.description}
        </p>

        <div className="space-y-2.5 pt-2 border-t border-[#F8FAFC] dark:border-[#262B36] text-xs">
          <div className="flex items-center justify-between text-[#64748B] dark:text-[#94A3B8]">
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-primary" />
              Members
            </span>
            <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              {formattedMembers}
            </span>
          </div>

          <div className="flex items-center justify-between text-[#64748B] dark:text-[#94A3B8]">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              Created
            </span>
            <span className="font-medium text-[#0F172A] dark:text-[#F8FAFC]">
              {formattedCreationDate}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Community Rules Card */}
      <div className="bg-white dark:bg-[#181B22] rounded-2xl border border-[#E2E8F0] dark:border-[#2E3544] p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#F1F5F9] dark:border-[#262B36]">
          <BookOpen size={16} className="text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F8FAFC]">
            {`c/${community.slug} Rules`}
          </h2>
        </div>

        {hasRules ? (
          <ol className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {community.rules.map((rule, idx) => {
              const isExpanded = expandedRuleId === rule.id;
              return (
                <li key={rule.id} className="py-2.5 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => toggleRule(rule.id)}
                    aria-expanded={isExpanded}
                    className="w-full flex items-center justify-between gap-2 text-left text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] hover:text-primary transition-colors focus-visible:outline-none"
                  >
                    <span className="flex items-start gap-2">
                      <span className="text-[#94A3B8] font-mono shrink-0">{idx + 1}.</span>
                      <span>{rule.title}</span>
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={14} className="text-[#94A3B8] shrink-0" />
                    ) : (
                      <ChevronDown size={14} className="text-[#94A3B8] shrink-0" />
                    )}
                  </button>

                  {isExpanded && rule.description && (
                    <p className="mt-1.5 pl-5 text-[11px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                      {rule.description}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            No custom rules defined yet. Standard platform civility and technical rigor guidelines apply.
          </p>
        )}
      </div>

      {/* 3. Community Civility & Rigor */}
      <div className="bg-slate-50 dark:bg-[#12141A] rounded-2xl border border-dashed border-[#E2E8F0] dark:border-[#2E3544] p-4 text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
        <div className="flex items-center gap-1.5 font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Technical Rigor & Civility</span>
        </div>
        Discussions are peer-reviewed. Back assertions with reproducible traces, logs, or formal benchmarks whenever discussing distributed systems.
      </div>
    </aside>
  );
}
