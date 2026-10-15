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
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
          <Layers size={22} />
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB] block">
            {milestone} — Planned Surface
          </span>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">{title}</h1>
        </div>
      </div>

      <p className="text-sm text-[#475569] mb-6 leading-relaxed">{description}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs mb-6">
        <div>
          <span className="text-[#64748B] block font-medium">Visual Personality:</span>
          <span className="font-semibold text-[#0F172A]">{personality}</span>
        </div>
        <div>
          <span className="text-[#64748B] block font-medium">Canonical Reference:</span>
          <span className="font-semibold text-[#0F172A]">{reference}</span>
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
