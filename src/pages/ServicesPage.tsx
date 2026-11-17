import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  PlusCircle,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Wrench,
} from 'lucide-react';
import { LocationSelector } from '../components/LocationSelector';
import { ServiceCard } from '../components/ServiceCard';
import { ProvinceName, getProvinceForCity } from '../data/locations';
import { ALL_SERVICE_CATEGORIES } from '../data/marketplaceData';
import {
  CityName,
  ServiceAvailability,
  ServiceCategoryLabel,
  ServiceItem,
} from '../types/marketplace';

interface ServicesPageProps {
  services: ServiceItem[];
  selectedCity: CityName;
  onSelectCity: (city: CityName) => void;
  favoriteServiceIds: string[];
  onToggleFavoriteService: (id: string) => void;
  onContactService: (service: ServiceItem) => void;
  onOpenProviderModal: () => void;
}

const PAGE_SIZE = 8;

export const ServicesPage: React.FC<ServicesPageProps> = ({
  services,
  selectedCity,
  onSelectCity,
  favoriteServiceIds,
  onToggleFavoriteService,
  onContactService,
  onOpenProviderModal,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategoryLabel | 'All'>('All');
  const [province, setProvince] = useState<ProvinceName>(() =>
    getProvinceForCity(selectedCity)
  );
  const [area, setArea] = useState('All Areas');
  const [priceRange, setPriceRange] = useState<'all' | 'under-500' | '500-1000' | 'over-1000'>(
    'all'
  );
  const [minRating, setMinRating] = useState<number>(0);
  const [minExperience, setMinExperience] = useState<number>(0);
  const [availability, setAvailability] = useState<ServiceAvailability | 'All'>('All');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      const catOk = selectedCategory === 'All' || s.categoryName === selectedCategory;
      const provOk = province === 'All Provinces' || s.province === province;
      const cityOk = selectedCity === 'All Cities' || s.city === selectedCity;
      const areaOk =
        area === 'All Areas' || s.area === area || s.serviceAreas.includes(area);

      let priceOk = true;
      if (priceRange === 'under-500') priceOk = s.startingPrice < 500;
      else if (priceRange === '500-1000')
        priceOk = s.startingPrice >= 500 && s.startingPrice <= 1000;
      else if (priceRange === 'over-1000') priceOk = s.startingPrice > 1000;

      const ratingOk = s.rating >= minRating;
      const expOk = s.experienceYears >= minExperience;
      const availOk = availability === 'All' || s.availability === availability;

      const qOk =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.providerName.toLowerCase().includes(q) ||
        s.categoryName.toLowerCase().includes(q) ||
        s.area.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q);

      return (
        catOk &&
        provOk &&
        cityOk &&
        areaOk &&
        priceOk &&
        ratingOk &&
        expOk &&
        availOk &&
        qOk
      );
    });
  }, [
    services,
    query,
    selectedCategory,
    province,
    selectedCity,
    area,
    priceRange,
    minRating,
    minExperience,
    availability,
  ]);

  const activeFilterCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedCity !== 'All Cities' ? 1 : 0) +
    (area !== 'All Areas' ? 1 : 0) +
    (priceRange !== 'all' ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (minExperience > 0 ? 1 : 0) +
    (availability !== 'All' ? 1 : 0) +
    (query.trim() ? 1 : 0);

  const handleReset = () => {
    setQuery('');
    setSelectedCategory('All');
    setProvince('All Provinces');
    onSelectCity('All Cities');
    setArea('All Areas');
    setPriceRange('all');
    setMinRating(0);
    setMinExperience(0);
    setAvailability('All');
    setVisibleCount(PAGE_SIZE);
  };

  const displayedServices = filteredServices.slice(0, visibleCount);
  const hasMore = visibleCount < filteredServices.length;

  const FiltersBody = (
    <div className="space-y-4">
      <LocationSelector
        province={province}
        onProvinceChange={setProvince}
        city={selectedCity}
        onCityChange={(c) => onSelectCity(c as CityName)}
        area={area}
        onAreaChange={setArea}
      />

      <div className="pt-3 border-t border-[#F0E3CC]">
        <label className="block text-[11px] font-bold uppercase tracking-wide text-[#593B2A] mb-1">
          Starting Price Range
        </label>
        <select
          value={priceRange}
          onChange={(e) => setPriceRange(e.target.value as typeof priceRange)}
          className="w-full rounded-lg border border-[#D8C5A5] bg-[#FFF9ED] px-3 py-2 text-xs font-semibold text-[#382619]"
        >
          <option value="all">Any Starting Price</option>
          <option value="under-500">Under Rs. 500</option>
          <option value="500-1000">Rs. 500 – Rs. 1,000</option>
          <option value="over-1000">Above Rs. 1,000</option>
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wide text-[#593B2A] mb-1">
          Minimum Rating (Sample)
        </label>
        <select
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="w-full rounded-lg border border-[#D8C5A5] bg-[#FFF9ED] px-3 py-2 text-xs font-semibold text-[#382619]"
        >
          <option value={0}>All Ratings</option>
          <option value={4.5}>4.5★ &amp; above</option>
          <option value={4.8}>4.8★ &amp; above</option>
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wide text-[#593B2A] mb-1">
          Minimum Experience
        </label>
        <select
          value={minExperience}
          onChange={(e) => setMinExperience(Number(e.target.value))}
          className="w-full rounded-lg border border-[#D8C5A5] bg-[#FFF9ED] px-3 py-2 text-xs font-semibold text-[#382619]"
        >
          <option value={0}>Any Experience</option>
          <option value={5}>5+ Years</option>
          <option value={10}>10+ Years</option>
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wide text-[#593B2A] mb-1">
          Availability
        </label>
        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value as ServiceAvailability | 'All')}
          className="w-full rounded-lg border border-[#D8C5A5] bg-[#FFF9ED] px-3 py-2 text-xs font-semibold text-[#382619]"
        >
          <option value="All">Any Availability</option>
          <option value="Available Today">Available Today</option>
          <option value="Same-Day Visit">Same-Day Visit</option>
          <option value="Weekend Available">Weekend Available</option>
        </select>
      </div>

      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={handleReset}
          className="w-full py-2.5 rounded-lg border border-[#D8C5A5] bg-[#FFF9ED] hover:bg-[#FFF2D6] text-xs font-bold text-[#593B2A] inline-flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header + Search + Category Strip */}
      <section className="bg-white rounded-2xl border border-[#EADBC2] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#382619]">
              Local Services Directory
            </h1>
            <p className="text-xs sm:text-sm text-[#6F5643] mt-1">
              Find trusted mechanics, electricians, plumbers, technicians, tailors, and digital
              professionals near you.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenProviderModal}
            className="px-4 py-2.5 rounded-xl bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] text-xs font-extrabold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Service</span>
          </button>
        </div>

        {/* Search + Mobile Filter Toggle */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#593B2A] absolute left-3.5 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search service, provider name, or area (e.g. Hayatabad, Electrician)..."
              aria-label="Search service providers"
              className="w-full rounded-xl border border-[#D8C5A5] bg-[#FFF9ED] pl-10 pr-4 py-2.5 text-sm text-[#382619] focus:outline-none focus:border-[#593B2A]"
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((o) => !o)}
            className="lg:hidden px-4 py-2.5 rounded-xl border border-[#D8C5A5] bg-white text-xs font-bold text-[#382619] inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#593B2A]" />
            <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
            {mobileFiltersOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* All 20 Service Category Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-[#593B2A] text-white'
                : 'bg-[#FFF9ED] border border-[#EADBC2] text-[#382619] hover:border-[#F5B82E]'
            }`}
          >
            All Services ({services.length})
          </button>
          {ALL_SERVICE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#F5B82E] text-[#382619] font-bold'
                  : 'bg-[#FFF9ED] border border-[#EADBC2] text-[#382619] hover:border-[#F5B82E]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {mobileFiltersOpen && (
          <div className="lg:hidden pt-4 border-t border-[#EADBC2]">{FiltersBody}</div>
        )}
      </section>

      {/* Main Content: Sidebar + Providers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <aside className="hidden lg:block lg:col-span-3 bg-white rounded-2xl border border-[#EADBC2] p-5 shadow-xs">
          <h2 className="font-display text-base font-bold text-[#382619] pb-3 mb-3 border-b border-[#F0E3CC]">
            Filter Providers
          </h2>
          {FiltersBody}
        </aside>

        <div className="lg:col-span-9 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[#6F5643]">
            <span className="font-semibold text-[#382619] tabular-nums">
              Showing {displayedServices.length} of {filteredServices.length} providers
              {selectedCategory !== 'All' ? ` · ${selectedCategory}` : ''}
              {selectedCity !== 'All Cities' ? ` in ${selectedCity}` : ''}
            </span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="font-bold text-[#593B2A] hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>

          {displayedServices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#D8C5A5] p-10 text-center">
              <Wrench className="w-10 h-10 text-[#B89B78] mx-auto mb-2.5" />
              <h2 className="font-display text-lg font-bold text-[#382619]">
                No service providers match your filters
              </h2>
              <p className="text-xs text-[#6F5643] mt-1">
                Try selecting All Cities or broadening your rating, experience, or price filter.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-4 px-5 py-2.5 rounded-xl bg-[#F5B82E] hover:bg-[#E5A71D] text-[#382619] text-xs font-bold cursor-pointer"
              >
                Show All Providers
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayedServices.map((srv) => (
                  <ServiceCard
                    key={srv.id}
                    service={srv}
                    isFavorite={favoriteServiceIds.includes(srv.id)}
                    onToggleFavorite={onToggleFavoriteService}
                    onContactService={onContactService}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="px-6 py-3 rounded-xl bg-white hover:bg-[#FFF9ED] border border-[#D8C5A5] text-sm font-bold text-[#593B2A] cursor-pointer shadow-xs"
                  >
                    Load More Providers ({filteredServices.length - displayedServices.length}{' '}
                    remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
