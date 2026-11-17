import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Layers, Package, Wrench } from 'lucide-react';
import { ALL_CATEGORY_GROUPS } from '../data/categories';

export const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<'all' | 'product' | 'service'>('all');

  const visibleGroups = ALL_CATEGORY_GROUPS.filter(
    (g) => filterType === 'all' || g.type === filterType
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#EADBC2] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#593B2A] mb-1">
            <Layers className="w-4 h-4 text-[#F5B82E]" />
            <span>Complete Marketplace Directory</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#382619]">
            All Product &amp; Service Categories
          </h1>
          <p className="text-sm text-[#6F5643] mt-1">
            Explore 8 product categories and 5 specialized local service groups across Pakistan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 rounded-xl bg-[#FFF9ED] border border-[#EADBC2]">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'product', label: 'Products' },
                { id: 'service', label: 'Services' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-[#F5B82E] text-[#382619]'
                    : 'text-[#593B2A] hover:text-[#382619]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Link
            to="/"
            className="px-4 py-2 rounded-xl border border-[#D8C5A5] text-xs font-semibold text-[#593B2A] hover:bg-[#FFF9ED] inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>
      </div>

      <div className="space-y-5">
        {visibleGroups.map((group) => (
          <section
            key={group.id}
            id={group.id}
            className="bg-white rounded-2xl border border-[#EADBC2] p-5 sm:p-6 shadow-xs scroll-mt-24"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#F3E9D7]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FFF4D6] flex items-center justify-center">
                  {group.type === 'product' ? (
                    <Package className="w-5 h-5 text-[#593B2A]" />
                  ) : (
                    <Wrench className="w-5 h-5 text-[#593B2A]" />
                  )}
                </div>
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-bold text-[#382619]">
                    {group.title}
                  </h2>
                  <p className="text-xs text-[#6F5643]">{group.subtitle}</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#593B2A] tabular-nums">
                {group.items.length} categories
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {group.items.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    navigate(`/categories/${encodeURIComponent(cat.slug.toLowerCase())}`)
                  }
                  className="group text-left rounded-xl border border-[#EFE3CE] bg-[#FFF9ED]/70 hover:bg-white hover:border-[#F5B82E] hover:shadow-sm p-4 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-sm text-[#382619] group-hover:text-[#9A5D0A]">
                        {cat.name}
                      </h3>
                      <ArrowRight className="w-4 h-4 text-[#593B2A] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-xs text-[#6F5643] mt-1 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                  <p className="mt-3 text-[11px] font-semibold text-[#593B2A] tabular-nums">
                    {cat.sampleCount} demo listings
                  </p>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
