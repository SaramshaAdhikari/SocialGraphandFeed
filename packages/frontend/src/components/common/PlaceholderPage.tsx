import { Layers, ArrowLeft } from 'lucide-react';
import { Link } from '../../router/Router';
import { Button } from '../ui/Button';

export interface PlaceholderPageProps {
  title: string;
  personality: string;
  milestone: string;
  reference: string;
  description: string;
}

export function PlaceholderPage({
  title,
  personality,
  milestone,
  reference,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="bg-surface-card rounded-2xl border border-border p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Layers size={22} />
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
            {milestone} — Planned Surface
          </span>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">{title}</h1>
        </div>
      </div>

      <p className="text-sm text-text-secondary mb-6 leading-relaxed">{description}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-surface-subtle border border-border text-xs mb-6">
        <div>
          <span className="text-text-muted block font-medium">Visual Personality:</span>
          <span className="font-semibold text-text-primary">{personality}</span>
        </div>
        <div>
          <span className="text-text-muted block font-medium">Canonical Reference:</span>
          <span className="font-semibold text-text-primary">{reference}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link to="/">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />}>
            Back to Home Feed
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default PlaceholderPage;
