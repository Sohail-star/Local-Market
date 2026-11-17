import React from 'react';
import { ArrowRight, CheckCircle2, Headphones } from 'lucide-react';

interface SidebarTrustPanelProps {
  onOpenContact: () => void;
}

const TRUST_REASONS = [
  'Easy Search',
  'Local Businesses',
  'Trusted Profiles',
  'Easy Contact',
  'User-Friendly Platform',
];

export const SidebarTrustPanel: React.FC<SidebarTrustPanelProps> = ({ onOpenContact }) => {
  return (
    <aside className="flex flex-col gap-4 h-full">
      {/* Why Choose LocalMarket? */}
      <div className="bg-white rounded-2xl border border-[#EADBC2] p-5 shadow-xs flex-1">
        <h2 className="font-display text-lg font-bold text-[#382619] pb-3 border-b border-[#F3E9D7]">
          Why Choose LocalMarket?
        </h2>
        <ul className="mt-4 space-y-3.5">
          {TRUST_REASONS.map((reason) => (
            <li key={reason} className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#1D8348] shrink-0" />
              <span className="text-sm font-medium text-[#382619]">{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Need Help? Support Card */}
      <div className="bg-[#593B2A] text-white rounded-2xl p-5 shadow-sm flex items-center gap-4 border border-[#4D2A13]">
        <div className="w-14 h-14 rounded-2xl bg-[#F5B82E]/15 border border-[#F5B82E]/30 flex items-center justify-center shrink-0">
          <Headphones className="w-8 h-8 text-[#F5B82E]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold text-white leading-tight">Need Help?</h3>
          <p className="text-xs text-[#E7D4B5] mt-0.5">Our Support Team is here!</p>
          <button
            type="button"
            onClick={onOpenContact}
            className="mt-3 bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] font-bold text-xs px-4 py-2 rounded-lg inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
          >
            <span>Contact Us</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
