import React from 'react';
import { ChevronDown, MapPin, Navigation, Search, X } from 'lucide-react';
import { CITIES, CITY_NEIGHBORHOODS, HERO_IMAGE, POPULAR_SEARCH_TAGS } from '../data/marketplaceData';
import { CityName } from '../types/marketplace';
import { SmartImage } from './SmartImage';

interface HeroBannerProps {
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  selectedCity: CityName;
  onSelectCity: (city: CityName) => void;
  selectedArea: string;
  onSelectArea: (area: string) => void;
  onSubmitSearch: (e?: React.FormEvent) => void;
  onSelectPopularTag: (tag: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  searchQuery,
  onSearchQueryChange,
  selectedCity,
  onSelectCity,
  selectedArea,
  onSelectArea,
  onSubmitSearch,
  onSelectPopularTag,
  searchInputRef,
}) => {
  const availableAreas =
    selectedCity !== 'All Cities' ? CITY_NEIGHBORHOODS[selectedCity] ?? [] : [];

  return (
    <section className="relative rounded-2xl overflow-hidden shadow-md border border-[#EADBC2] bg-[#382619]">
      {/* Background Photo */}
      <div className="absolute inset-0">
        <SmartImage
          src={HERO_IMAGE}
          alt="Historic Peshawar architecture and local merchant holding shopping bags"
          className="w-full h-full object-cover object-center sm:object-[65%_center]"
          fallbackLabel="LocalMarket Pakistan"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#24160D]/92 via-[#382619]/78 to-[#24160D]/30 lg:to-transparent"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#24160D]/75 via-transparent to-transparent lg:hidden"
          aria-hidden="true"
        />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="max-w-3xl w-full">
          <div className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-none text-white">
            Local<span className="text-[#F5B82E]">Market</span>
          </div>
          <h1 className="mt-2 text-xl sm:text-3xl font-bold text-white leading-snug text-balance">
            Your Local Marketplace in Pakistan
          </h1>
          <p className="mt-1.5 text-sm sm:text-base font-medium text-[#F7DC94]">
            Buy Products, Find Services &amp; Grow Your Business
          </p>

          {/* Search Interface: Keyword + City + Area + Search Button */}
          <form
            onSubmit={onSubmitSearch}
            className="mt-6 bg-white rounded-xl p-1.5 shadow-lg border border-white/20 flex flex-col md:flex-row items-stretch md:items-center gap-1.5"
            role="search"
          >
            <div className="flex items-center flex-1 min-w-0 px-3 py-2">
              <Search className="w-4 h-4 text-[#593B2A] shrink-0 mr-2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Search products or services (e.g. iPhone, Mechanic, Tailor)..."
                aria-label="Search for products or services"
                className="w-full text-sm text-[#382619] placeholder-[#8A7158] bg-transparent focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchQueryChange('')}
                  className="p-1 text-[#8A7158] hover:text-[#382619] cursor-pointer"
                  aria-label="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="hidden md:block h-7 w-px bg-[#E6D7BE]" aria-hidden="true" />

            <div className="grid grid-cols-2 md:flex items-center gap-1.5 border-t md:border-t-0 border-[#F0E5D1] pt-1.5 md:pt-0">
              {/* City Selector */}
              <div className="relative flex items-center px-2.5 py-2 md:w-36 bg-[#FFF9ED] md:bg-transparent rounded-lg">
                <MapPin className="w-4 h-4 text-[#593B2A] shrink-0 mr-1.5" />
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    onSelectCity(e.target.value as CityName);
                    onSelectArea('All Areas');
                  }}
                  aria-label="Select city"
                  className="w-full appearance-none bg-transparent text-xs sm:text-sm font-semibold text-[#382619] pr-5 focus:outline-none cursor-pointer"
                >
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#593B2A] pointer-events-none absolute right-2" />
              </div>

              <div className="hidden md:block h-7 w-px bg-[#E6D7BE]" aria-hidden="true" />

              {/* Area Selector */}
              <div className="relative flex items-center px-2.5 py-2 md:w-44 bg-[#FFF9ED] md:bg-transparent rounded-lg">
                <Navigation className="w-3.5 h-3.5 text-[#593B2A] shrink-0 mr-1.5" />
                <select
                  value={selectedArea}
                  onChange={(e) => onSelectArea(e.target.value)}
                  aria-label="Select neighborhood area"
                  disabled={selectedCity === 'All Cities'}
                  className="w-full appearance-none bg-transparent text-xs sm:text-sm font-medium text-[#382619] pr-5 focus:outline-none cursor-pointer disabled:opacity-50"
                >
                  <option value="All Areas">All Areas</option>
                  {availableAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#593B2A] pointer-events-none absolute right-2" />
              </div>
            </div>

            <button
              type="submit"
              className="bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] font-bold text-sm px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>Search</span>
            </button>
          </form>

          {/* Popular Quick Suggestions */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#FFF9ED] mr-1">Popular:</span>
            {POPULAR_SEARCH_TAGS.map((tag) => {
              const isActive = searchQuery.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onSelectPopularTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#F5B82E] text-[#382619]'
                      : 'bg-white/95 hover:bg-[#F5B82E] text-[#382619]'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Editorial Callout Badge */}
        <div className="hidden lg:flex flex-col items-end justify-start self-start shrink-0">
          <div className="bg-white/95 text-[#382619] px-4 py-2.5 rounded-xl shadow-md border border-[#EADBC2] -rotate-2">
            <p className="font-display text-lg font-extrabold leading-tight text-center text-[#593B2A]">
              Shop Local,
              <br />
              Support Local!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
