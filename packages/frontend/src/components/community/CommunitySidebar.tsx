import { useState } from 'react';
import type { Community } from '@socialgraph/shared';
import { BookOpen, ChevronDown, ChevronUp, Users, Calendar, Info, ShieldCheck } from 'lucide-react';

export interface CommunitySidebarProps {
  community: Community;
  className?: string;
}

export function CommunitySidebar({
  community,
  className = '',
}: CommunitySidebarProps) {
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

  const toggleRule = (ruleId: string) => {
    setExpandedRuleId((prev) => (prev === ruleId ? null : ruleId));
  };

  const formattedMembers = new Intl.NumberFormat('en-US').format(community.members_count);

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
      <div className="bg-surface-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border/60">
          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Info size={14} />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary">
            About Community
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4">
          {community.description}
        </p>

        <div className="space-y-2.5 pt-2 border-t border-border/60 text-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="flex items-center gap-1.5 font-medium">
              <Users size={14} className="text-primary" />
              Members
            </span>
            <span className="font-bold text-text-primary font-mono">
              {formattedMembers}
            </span>
          </div>

          <div className="flex items-center justify-between text-text-muted">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar size={14} />
              Created
            </span>
            <span className="font-medium text-text-primary">
              {formattedCreationDate}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Community Rules Card */}
      <div className="bg-surface-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border/60">
          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <BookOpen size={14} />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary">
            {`c/${community.slug} Rules`}
          </h2>
        </div>

        {hasRules ? (
          <ol className="divide-y divide-border/60">
            {community.rules.map((rule, idx) => {
              const isExpanded = expandedRuleId === rule.id;
              return (
                <li key={rule.id} className="py-2.5 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => toggleRule(rule.id)}
                    aria-expanded={isExpanded}
                    className="w-full flex items-center justify-between gap-2 text-left text-xs font-bold text-text-primary hover:text-primary transition-colors focus-visible:outline-none cursor-pointer"
                  >
                    <span className="flex items-start gap-2">
                      <span className="text-text-muted font-mono shrink-0">{idx + 1}.</span>
                      <span>{rule.title}</span>
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={14} className="text-text-muted shrink-0" />
                    ) : (
                      <ChevronDown size={14} className="text-text-muted shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <p className="mt-1.5 text-xs text-text-muted pl-5 leading-relaxed">
                      {rule.description}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-xs text-text-muted italic">
            No custom rules defined yet. Standard platform guidelines apply.
          </p>
        )}
      </div>

      {/* 3. Community Civility & Rigor */}
      <div className="bg-surface-subtle rounded-2xl border border-dashed border-border p-4 text-xs text-text-secondary leading-relaxed transition-colors">
        <div className="flex items-center gap-1.5 font-bold text-text-primary mb-1">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Technical Rigor &amp; Civility</span>
        </div>
        Discussions are peer-reviewed. Back assertions with reproducible traces, logs, or formal benchmarks whenever discussing distributed systems.
      </div>
    </aside>
  );
}
export default CommunitySidebar;
