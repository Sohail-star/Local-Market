import React from 'react';
import { ChevronDown, MapPin, Navigation } from 'lucide-react';
import {
  PAKISTAN_LOCATIONS,
  ProvinceName,
  getAreasForCity,
  getCitiesForProvince,
} from '../data/locations';

interface LocationSelectorProps {
  province: ProvinceName;
  onProvinceChange: (province: ProvinceName) => void;
  city: string;
  onCityChange: (city: string) => void;
  area: string;
  onAreaChange: (area: string) => void;
  compact?: boolean;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  province,
  onProvinceChange,
  city,
  onCityChange,
  area,
  onAreaChange,
  compact = false,
}) => {
  const citiesInProvince = getCitiesForProvince(province);
  const areasInCity = getAreasForCity(city);

  return (
    <div className={compact ? 'grid grid-cols-1 sm:grid-cols-3 gap-2.5' : 'space-y-3'}>
      {/* Province */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wide text-[#593B2A] mb-1">
          Province
        </label>
        <div className="relative">
          <MapPin className="w-3.5 h-3.5 text-[#593B2A] absolute left-2.5 top-2.5 pointer-events-none" />
          <select
            value={province}
            onChange={(e) => {
              const nextProv = e.target.value as ProvinceName;
              onProvinceChange(nextProv);
              onCityChange('All Cities');
              onAreaChange('All Areas');
            }}
            aria-label="Select province"
            className="w-full appearance-none rounded-lg border border-[#D8C5A5] bg-[#FFF9ED] pl-8 pr-7 py-2 text-xs font-semibold text-[#382619] focus:outline-none focus:border-[#593B2A] cursor-pointer"
          >
            <option value="All Provinces">All Provinces</option>
            {PAKISTAN_LOCATIONS.map((entry) => (
              <option key={entry.province} value={entry.province}>
                {entry.province}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#593B2A] absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* City */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wide text-[#593B2A] mb-1">
          City
        </label>
        <div className="relative">
          <MapPin className="w-3.5 h-3.5 text-[#C98A09] absolute left-2.5 top-2.5 pointer-events-none" />
          <select
            value={city}
            onChange={(e) => {
              onCityChange(e.target.value);
              onAreaChange('All Areas');
            }}
            aria-label="Select city"
            className="w-full appearance-none rounded-lg border border-[#D8C5A5] bg-[#FFF9ED] pl-8 pr-7 py-2 text-xs font-semibold text-[#382619] focus:outline-none focus:border-[#593B2A] cursor-pointer"
          >
            <option value="All Cities">All Cities</option>
            {citiesInProvince.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#593B2A] absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Area */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wide text-[#593B2A] mb-1">
          Area / Sector
        </label>
        <div className="relative">
          <Navigation className="w-3.5 h-3.5 text-[#593B2A] absolute left-2.5 top-2.5 pointer-events-none" />
          <select
            value={area}
            disabled={city === 'All Cities' || areasInCity.length === 0}
            onChange={(e) => onAreaChange(e.target.value)}
            aria-label="Select area"
            className="w-full appearance-none rounded-lg border border-[#D8C5A5] bg-[#FFF9ED] pl-8 pr-7 py-2 text-xs font-semibold text-[#382619] focus:outline-none focus:border-[#593B2A] cursor-pointer disabled:opacity-50"
          >
            <option value="All Areas">All Areas</option>
            {areasInCity.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#593B2A] absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
