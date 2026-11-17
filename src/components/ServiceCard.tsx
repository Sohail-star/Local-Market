import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Heart, MapPin, Phone, ShieldCheck, Star, Wrench } from 'lucide-react';
import { ServiceItem } from '../types/marketplace';
import { SmartImage } from './SmartImage';

interface ServiceCardProps {
  service: ServiceItem;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onContactService: (service: ServiceItem) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  isFavorite = false,
  onToggleFavorite,
  onContactService,
}) => {
  return (
    <article className="group rounded-xl border border-[#F0DEC0] bg-[#FFF9ED] hover:bg-[#FFF4DD] hover:border-[#E5B85C] transition-all duration-150 hover:-translate-y-0.5 overflow-hidden flex flex-col">
      <div className="relative h-36 w-full overflow-hidden bg-[#F5E6C8]">
        <Link to={`/services/${service.id}`} className="block w-full h-full">
          <SmartImage
            src={service.image}
            alt={`${service.providerName} — ${service.categoryName}`}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
            fallbackLabel={service.title}
            icon={<Wrench className="w-6 h-6" />}
          />
        </Link>

        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => onToggleFavorite(service.id)}
            aria-label={
              isFavorite
                ? `Remove ${service.providerName} from favorites`
                : `Save ${service.providerName} to favorites`
            }
            className={`absolute top-2.5 left-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-xs transition-colors cursor-pointer ${
              isFavorite
                ? 'bg-[#D92D20] text-white'
                : 'bg-white/95 text-[#593B2A] hover:text-[#D92D20]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}

        <div className="absolute bottom-2 left-2.5 bg-white/95 text-[#382619] text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
          <Clock className="w-3 h-3 text-[#C98A09]" />
          <span>{service.responseTime}</span>
        </div>

        <div className="absolute top-2.5 right-2.5 bg-[#593B2A]/90 text-[#F5B82E] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
          {service.categoryName}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between gap-2">
            <Link
              to={`/services/${service.id}`}
              className="font-bold text-base text-[#382619] hover:text-[#9A5D0A] truncate"
            >
              {service.providerName}
            </Link>
            {service.providerVerified && (
              <ShieldCheck
                className="w-4 h-4 text-[#1D8348] shrink-0"
                aria-label="Verified profile"
              />
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#5C432D] tabular-nums">
            <span className="font-bold text-[#B8320A]">
              From Rs. {service.startingPrice.toLocaleString('en-PK')}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-0.5">
              <Star className="w-3.5 h-3.5 fill-[#F5B82E] text-[#F5B82E]" />
              <strong className="text-[#382619]">{service.rating.toFixed(1)}</strong>
              <span className="text-[#8A7158]">(Sample)</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>{service.experienceYears} yrs exp</span>
          </div>

          <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-[#6F5643]">
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-[#C98A09] shrink-0" />
              <span className="truncate">
                {service.area}, {service.city}
              </span>
            </span>
            <span className="font-semibold text-[#1D8348] whitespace-nowrap">
              {service.availability}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Link
            to={`/services/${service.id}`}
            className="flex-1 py-2 px-3 rounded-lg bg-[#593B2A] hover:bg-[#3B2518] text-white text-xs font-semibold text-center transition-colors whitespace-nowrap"
          >
            View Profile
          </Link>
          <button
            type="button"
            onClick={() => onContactService(service)}
            className="py-2 px-3 rounded-lg bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Contact</span>
          </button>
        </div>
      </div>
    </article>
  );
};
