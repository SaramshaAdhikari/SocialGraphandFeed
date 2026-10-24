import { useState } from 'react';
import { Flame, Sparkles, Trophy, MessageSquare, Bookmark, Share2 } from 'lucide-react';
import { Pill } from '../ui/Badge';
import { VoteControl } from '../ui/VoteControl';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { PostCardSkeleton } from '../ui/Skeleton';
import { Link } from '../../router/Router';

export function HomeFeedFoundation() {
  const [activeSort, setActiveSort] = useState<'hot' | 'new' | 'top'>('hot');
  const [demoVote, setDemoVote] = useState<1 | -1 | 0>(0);
  const [demoScore, setDemoScore] = useState(142);
  const [isSaved, setIsSaved] = useState(false);

  const handleVote = (dir: 1 | -1 | 0) => {
    let delta = 0;
    if (demoVote === 1) delta -= 1;
    if (demoVote === -1) delta += 1;
    if (dir === 1) delta += 1;
    if (dir === -1) delta -= 1;
    setDemoScore((prev) => prev + delta);
    setDemoVote(dir);
  };

  return (
    <div className="space-y-4">
      {/* Feed Sorting Bar */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-2 flex items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-1 sm:gap-2">
          <Pill
            size="sm"
            selected={activeSort === 'hot'}
            onClick={() => setActiveSort('hot')}
          >
            <Flame size={14} className="mr-1 text-[#F97316]" /> Hot
          </Pill>
          <Pill
            size="sm"
            selected={activeSort === 'new'}
            onClick={() => setActiveSort('new')}
          >
            <Sparkles size={14} className="mr-1 text-[#2563EB]" /> New
          </Pill>
          <Pill
            size="sm"
            selected={activeSort === 'top'}
            onClick={() => setActiveSort('top')}
          >
            <Trophy size={14} className="mr-1 text-amber-500" /> Top
          </Pill>
        </div>

        <span className="text-xs text-[#94A3B8] hidden sm:inline-block pr-2">
          Sorted by {activeSort}
        </span>
      </div>

      {/* Interactive Foundation Demo Card */}
      <article className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm hover:border-[#CBD5E1] transition-colors">
        <div className="flex items-start gap-3">
          {/* Vertical Vote Rail */}
          <div className="hidden sm:block shrink-0">
            <VoteControl
              score={demoScore}
              userVote={demoVote}
              onVote={handleVote}
              orientation="vertical"
            />
          </div>

          <div className="flex-1 min-w-0">
            {/* Post Header */}
            <div className="flex items-center gap-2 mb-2 text-xs">
              <Avatar alt="Systems Team" size="xs" />
              <Link to="/c/systems" className="font-bold text-[#0F172A] hover:underline">
                c/systems
              </Link>
              <span className="text-[#94A3B8]">•</span>
              <span className="text-[#64748B]">Posted by u/alec_m</span>
              <span className="text-[#94A3B8]">• 2h ago</span>
            </div>

            {/* Post Title */}
            <h2 className="text-base sm:text-lg font-bold text-[#0F172A] mb-2 leading-snug">
              Milestone 2 Foundation Checkpoint: Shared Primitives and Responsive Shell
            </h2>

            {/* Post Content Excerpt */}
            <p className="text-sm text-[#475569] mb-4 leading-relaxed">
              The application shell, routing infrastructure, design tokens, and accessible primitives
              are now active. This foundation establishes consistent layout behavior across mobile
              (390px), tablet (768px), and desktop (1440px) viewports before mock data ingestion.
            </p>

            {/* Mobile Horizontal Vote + Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] text-xs text-[#64748B]">
              <div className="flex items-center gap-2">
                <div className="sm:hidden">
                  <VoteControl
                    score={demoScore}
                    userVote={demoVote}
                    onVote={handleVote}
                    orientation="horizontal"
                    size="sm"
                  />
                </div>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" leftIcon={<MessageSquare size={15} />}>
                  <span>24 Comments</span>
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" leftIcon={<Share2 size={15} />}>
                  <span>Share</span>
                </Button>
              </div>

              <Button
                variant={isSaved ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setIsSaved(!isSaved)}
                className="h-8 px-2 text-xs"
                leftIcon={<Bookmark size={15} className={isSaved ? 'fill-current' : ''} />}
              >
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </Button>
            </div>
          </div>
        </div>
      </article>

      {/* Placeholder Skeletons simulating infinite scroll stream */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            Upcoming Feed Posts (Loading State Preview)
          </span>
        </div>
        <PostCardSkeleton />
      </div>
    </div>
  );
}
