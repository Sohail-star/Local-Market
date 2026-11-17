import React from 'react';
import { Handshake, ShieldCheck, Star, Store, Users } from 'lucide-react';

interface TrustStatsBarProps {
  dynamicListingCount: number;
}

export const TrustStatsBar: React.FC<TrustStatsBarProps> = ({ dynamicListingCount }) => {
  const stats = [
    {
      icon: <Users className="w-6 h-6 text-[#593B2A]" />,
      value: '10K+ (Demo)',
      label: 'Sample Users',
    },
    {
      icon: <Store className="w-6 h-6 text-[#593B2A]" />,
      value: '5K+ (Demo)',
      label: 'Local Businesses',
    },
    {
      icon: <Handshake className="w-6 h-6 text-[#593B2A]" />,
      value: `${100 + dynamicListingCount}+ (Demo)`,
      label: 'Services & Listings',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#593B2A]" />,
      value: 'Verified',
      label: 'Local Profiles',
    },
    {
      icon: <Star className="w-6 h-6 fill-[#F5B82E] text-[#F5B82E]" />,
      value: '4.8/5 (Demo)',
      label: 'Sample Rating',
    },
  ];

  return (
    <section
      aria-label="Marketplace demo statistics"
      className="bg-[#FFF4DC] border border-[#EADBC2] rounded-2xl px-4 py-4 shadow-xs"
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#593B2A]">
          Marketplace Highlights
        </span>
        <span className="text-[11px] font-medium text-[#6F5643]">
          Illustrative Demo Metrics
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            className={`bg-white border border-[#EADBC2] rounded-xl flex items-center gap-3 p-3 ${
              idx === stats.length - 1 ? 'col-span-2 sm:col-span-1' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-[#FFF9ED] border border-[#EADBC2] flex items-center justify-center shrink-0">
              {stat.icon}
            </div>
            <div className="leading-tight min-w-0">
              <div className="font-display text-sm font-extrabold text-[#382619] tabular-nums truncate">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-[#6F5643] truncate">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
