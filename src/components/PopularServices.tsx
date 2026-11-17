import React from 'react';
import { ArrowRight, Wrench } from 'lucide-react';
import { ServiceItem } from '../types/marketplace';
import { ServiceCard } from './ServiceCard';

interface PopularServicesProps {
  services: ServiceItem[];
  totalCount: number;
  showAll: boolean;
  onToggleShowAll: () => void;
  favoriteServiceIds?: string[];
  onToggleFavoriteService?: (id: string) => void;
  onContactService: (service: ServiceItem) => void;
  onResetFilters: () => void;
}

export const PopularServices: React.FC<PopularServicesProps> = ({
  services,
  totalCount,
  showAll,
  onToggleShowAll,
  favoriteServiceIds = [],
  onToggleFavoriteService,
  onContactService,
  onResetFilters,
}) => {
  const displayedServices = showAll ? services : services.slice(0, 6);

  return (
    <section
      id="popular-services"
      className="bg-white rounded-2xl border border-[#EADBC2] p-5 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FFF4D6] flex items-center justify-center">
            <Wrench className="w-4 h-4 text-[#593B2A]" />
          </div>
          <h2 className="font-display text-lg sm:text-xl font-bold text-[#382619]">
            Popular Services
          </h2>
          <span className="text-xs font-medium text-[#6F5643] tabular-nums">
            ({services.length} {services.length === 1 ? 'provider' : 'providers'})
          </span>
        </div>

        {totalCount > 6 && (
          <button
            type="button"
            onClick={onToggleShowAll}
            className="text-sm font-semibold text-[#382619] hover:text-[#B57506] flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>{showAll ? 'Show Less' : 'View All'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {displayedServices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#DFC9A6] bg-[#FFF9ED] py-8 px-4 text-center">
          <Wrench className="w-8 h-8 text-[#B89B78] mx-auto mb-2" />
          <p className="text-sm font-bold text-[#382619]">No matching services found</p>
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-3 px-4 py-2 rounded-lg bg-[#F5B82E] text-[#382619] text-xs font-bold hover:bg-[#E5A71D] transition-colors cursor-pointer"
          >
            Show All Services
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {displayedServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isFavorite={favoriteServiceIds.includes(service.id)}
              onToggleFavorite={onToggleFavoriteService}
              onContactService={onContactService}
            />
          ))}
        </div>
      )}
    </section>
  );
};
